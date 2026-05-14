import { NextRequest, NextResponse } from "next/server"
import { extractFromText } from "@/lib/invoice-extractor"

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
    return NextResponse.json({ success: true, data, rawText: text.substring(0, 1000) })

  } catch (e: any) {
    return NextResponse.json({
      success: true, data: {}, scanned: true,
      rawText: `Error general: ${e?.message}`,
    })
  }
}
