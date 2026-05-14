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
      // Para imágenes no podemos extraer texto sin OCR — devolvemos vacío
      return NextResponse.json({ success: true, data: {}, isImage: true })
    }

    // Extraer texto del PDF
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse")
    const parsed = await pdfParse(buffer)
    const text = parsed.text

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ success: true, data: {}, scanned: true })
    }

    const data = extractFromText(text)
    return NextResponse.json({ success: true, data, rawText: text.substring(0, 500) })

  } catch (e: any) {
    console.error("Extract error:", e)
    return NextResponse.json({ error: e.message ?? "Error al leer el PDF" }, { status: 500 })
  }
}
