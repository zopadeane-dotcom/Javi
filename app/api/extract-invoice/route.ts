import { NextRequest, NextResponse } from "next/server"
import { extractFromText } from "@/lib/invoice-extractor"

async function visionSupplier(buffer: Buffer): Promise<string | undefined> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return undefined
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk")
    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: buffer.toString("base64"),
            },
          } as any,
          {
            type: "text",
            text: "¿Cuál es el nombre de la empresa que EMITE esta factura (el vendedor, no el cliente)? Responde solo con el nombre exacto, sin explicaciones. Si no puedes determinarlo escribe DESCONOCIDO.",
          },
        ],
      }],
    })
    const name = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : ""
    if (!name || name.toUpperCase().includes("DESCONOCIDO")) return undefined
    return name
  } catch {
    return undefined
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const isPdf = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")

    if (!isPdf) {
      return NextResponse.json({ success: true, data: {}, isImage: true, rawText: "Imagen — sin texto extraíble" })
    }

    let text = ""
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse")
      const result = await pdfParse(buffer)
      text = result.text ?? ""
    } catch (e: any) {
      return NextResponse.json({
        success: true, data: {}, scanned: true,
        rawText: `Error pdf-parse: ${e?.message}`,
      })
    }

    if (!text || text.trim().length < 5) {
      return NextResponse.json({
        success: true, data: {}, scanned: true,
        rawText: `Texto vacío (${text?.length ?? 0} chars)`,
      })
    }

    const data = extractFromText(text)

    // Si no se detectó el proveedor, Claude lee el PDF visualmente (logos, imágenes)
    if (!data.supplier_name && buffer.length < 10 * 1024 * 1024) {
      const visionName = await visionSupplier(buffer)
      if (visionName) data.supplier_name = visionName
    }

    return NextResponse.json({ success: true, data, rawText: text.substring(0, 1000) })

  } catch (e: any) {
    return NextResponse.json({
      success: true, data: {}, scanned: true,
      rawText: `Error general: ${e?.message}`,
    })
  }
}
