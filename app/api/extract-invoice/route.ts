import { NextRequest, NextResponse } from "next/server"
import { extractFromText } from "@/lib/invoice-extractor"

// Extracción con pdfjs-dist: agrupa items por línea Y para reconstruir el texto
// Captura texto que pdf-parse omite (fuentes CID, elementos posicionados cerca de logos, etc.)
async function extractTextPdfJs(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js")
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), verbosity: 0 }).promise
    const parts: string[] = []
    for (let p = 1; p <= Math.min(doc.numPages, 2); p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      const lineMap = new Map<number, string[]>()
      for (const item of content.items as any[]) {
        if (!item.str?.trim()) continue
        const y = Math.round(item.transform[5])
        if (!lineMap.has(y)) lineMap.set(y, [])
        lineMap.get(y)!.push(item.str)
      }
      const sorted = [...lineMap.entries()].sort((a, b) => b[0] - a[0])
      parts.push(sorted.map(([, words]) => words.join(" ")).join("\n"))
    }
    return parts.join("\n")
  } catch {
    return ""
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

    // Si no encontró proveedor, releer con pdfjs-dist (extrae más texto que pdf-parse)
    if (!data.supplier_name) {
      const pdfJsText = await extractTextPdfJs(buffer)
      if (pdfJsText.trim().length > 10) {
        const data2 = extractFromText(pdfJsText)
        if (data2.supplier_name) data.supplier_name = data2.supplier_name
        // Aprovechar otros campos que pdfjs pueda haber encontrado
        if (!data.invoice_number && data2.invoice_number) data.invoice_number = data2.invoice_number
        if (!data.invoice_date && data2.invoice_date) data.invoice_date = data2.invoice_date
        if (!data.total_amount && data2.total_amount) data.total_amount = data2.total_amount
      }
    }

    return NextResponse.json({ success: true, data, rawText: text.substring(0, 1000) })

  } catch (e: any) {
    return NextResponse.json({
      success: true, data: {}, scanned: true,
      rawText: `Error general: ${e?.message}`,
    })
  }
}
