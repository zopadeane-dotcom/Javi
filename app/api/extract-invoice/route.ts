import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "no_api_key" }, { status: 200 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    const isPdf = file.type.includes("pdf")

    const prompt = `Eres un experto en facturas españolas. Analiza esta factura y devuelve ÚNICAMENTE un JSON válido con estos campos exactos (sin texto adicional, sin markdown):

{
  "supplier_name": "nombre completo del proveedor/emisor",
  "supplier_nif": "NIF o CIF del emisor (formato español, ej: B12345678)",
  "invoice_number": "número de factura exacto",
  "invoice_date": "fecha en formato YYYY-MM-DD",
  "base_amount": número_decimal,
  "vat_rate": número (0, 4, 10 o 21),
  "vat_amount": número_decimal,
  "total_amount": número_decimal,
  "concept": "descripción breve del concepto o tipo de gasto"
}

Si no encuentras algún campo, usa null. Para los importes usa punto decimal, no coma.`

    let message
    if (isPdf) {
      message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: prompt },
          ],
        }],
      })
    } else {
      const mediaType = (file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp") || "image/jpeg"
      message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: prompt },
          ],
        }],
      })
    }

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: "No se pudo extraer la información" }, { status: 422 })

    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error("Extract invoice error:", e)
    return NextResponse.json({ error: e.message ?? "Error al procesar la factura" }, { status: 500 })
  }
}
