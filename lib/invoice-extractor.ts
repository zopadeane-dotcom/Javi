// Extractor de datos de facturas españolas sin IA
// Funciona con PDFs digitales (texto seleccionable)

export interface InvoiceData {
  supplier_name?: string
  supplier_nif?: string
  invoice_number?: string
  invoice_date?: string
  base_amount?: number
  vat_rate?: number
  vat_amount?: number
  total_amount?: number
  concept?: string
}

function parseSpanishNumber(s: string): number {
  // Convierte "1.234,56" o "1234.56" a número
  const clean = s.replace(/\./g, "").replace(",", ".")
  return parseFloat(clean)
}

function parseSpanishDate(s: string): string | undefined {
  // Formatos: "12/03/2024", "12-03-2024", "12.03.2024", "12 de marzo de 2024"
  const months: Record<string, string> = {
    enero: "01", febrero: "02", marzo: "03", abril: "04",
    mayo: "05", junio: "06", julio: "07", agosto: "08",
    septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12",
  }

  // Formato largo: "12 de marzo de 2024"
  const longMatch = s.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i)
  if (longMatch) {
    const m = months[longMatch[2].toLowerCase()]
    if (m) return `${longMatch[3]}-${m}-${longMatch[1].padStart(2, "0")}`
  }

  // Formato corto: "12/03/2024" o "12-03-2024"
  const shortMatch = s.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
  if (shortMatch) {
    const year = shortMatch[3].length === 2 ? `20${shortMatch[3]}` : shortMatch[3]
    return `${year}-${shortMatch[2].padStart(2, "0")}-${shortMatch[1].padStart(2, "0")}`
  }

  return undefined
}

export function extractFromText(rawText: string): InvoiceData {
  const text = rawText
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const result: InvoiceData = {}

  // ── NIF / CIF del emisor ──
  // Busca patrones tipo B12345678, A12345678, 12345678Z
  const nifMatches = text.match(/\b([A-Z]\d{7}[A-Z0-9]|\d{8}[A-Z])\b/g)
  if (nifMatches) result.supplier_nif = nifMatches[0]

  // ── Número de factura ──
  const numPatterns = [
    /(?:n[uú]mero\s+de\s+factura|n[uú]m\.?\s*factura|factura\s+n[uú]m\.?|fra\.?\s*n[uú]m\.?|nº)[:\s#]*([A-Z0-9\-\/]+)/i,
    /(?:invoice\s+no?\.?|invoice\s+number)[:\s#]*([A-Z0-9\-\/]+)/i,
    /\bF[-\/]?(\d{4}[-\/]\d+|\d+[-\/]\d+)\b/i,
    /\b(FAC|FRA|INV|F)[-\s]?(\d{4,}[-\/]\d+|\d{6,})\b/i,
  ]
  for (const pat of numPatterns) {
    const m = text.match(pat)
    if (m) { result.invoice_number = (m[1] || m[2]).trim(); break }
  }

  // ── Fecha ──
  // Busca cerca de palabras clave "fecha"
  const fechaContext = text.match(/fecha[^:]*:\s*([^\n]+)/i)
  if (fechaContext) {
    result.invoice_date = parseSpanishDate(fechaContext[1])
  }
  if (!result.invoice_date) {
    // Busca primera fecha válida en el texto
    const allDates = text.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g)
    if (allDates) {
      for (const d of allDates) {
        const parsed = parseSpanishDate(d)
        if (parsed) { result.invoice_date = parsed; break }
      }
    }
  }

  // ── Tipo de IVA ──
  const vatRateMatch = text.match(/\b(21|10|4)\s*%/)
  if (vatRateMatch) result.vat_rate = parseInt(vatRateMatch[1])

  // ── Importes ──
  // Patrones de base imponible
  const basePatterns = [
    /base\s+imponible[^0-9€]*([0-9]+[.,][0-9]{2})/i,
    /base[^0-9€\n]{0,20}([0-9]{1,6}[.,][0-9]{2})\s*€?/i,
  ]
  for (const pat of basePatterns) {
    const m = text.match(pat)
    if (m) { result.base_amount = parseSpanishNumber(m[1]); break }
  }

  // Cuota IVA
  const vatPatterns = [
    /(?:cuota|importe)\s+(?:de\s+)?iva[^0-9€]*([0-9]+[.,][0-9]{2})/i,
    /iva\s+(?:21|10|4)\s*%[^0-9€\n]{0,20}([0-9]+[.,][0-9]{2})/i,
  ]
  for (const pat of vatPatterns) {
    const m = text.match(pat)
    if (m) { result.vat_amount = parseSpanishNumber(m[1]); break }
  }

  // Total
  const totalPatterns = [
    /total\s+(?:a\s+pagar|factura|general)[^0-9€\n]{0,20}([0-9]+[.,][0-9]{2})/i,
    /(?:importe\s+total|total\s+importe)[^0-9€\n]{0,20}([0-9]+[.,][0-9]{2})/i,
    /total[^0-9€\n]{0,10}([0-9]{2,6}[.,][0-9]{2})\s*€/i,
  ]
  for (const pat of totalPatterns) {
    const m = text.match(pat)
    if (m) { result.total_amount = parseSpanishNumber(m[1]); break }
  }

  // Si tenemos base y tipo IVA pero no cuota ni total, los calculamos
  if (result.base_amount && result.vat_rate && !result.vat_amount) {
    result.vat_amount = parseFloat((result.base_amount * result.vat_rate / 100).toFixed(2))
  }
  if (result.base_amount && result.vat_amount && !result.total_amount) {
    result.total_amount = parseFloat((result.base_amount + result.vat_amount).toFixed(2))
  }
  // Si tenemos total y tipo pero no base
  if (result.total_amount && result.vat_rate && !result.base_amount) {
    result.base_amount = parseFloat((result.total_amount / (1 + result.vat_rate / 100)).toFixed(2))
    result.vat_amount = parseFloat((result.total_amount - result.base_amount).toFixed(2))
  }

  // ── Nombre del emisor ──
  // Las primeras líneas suelen ser el nombre de la empresa
  // Buscamos líneas que parezcan nombres de empresa (mayúsculas, S.A., S.L., etc.)
  const companyPatterns = [
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑA-Za-z\s,\.]{5,50}(?:S\.?A\.?|S\.?L\.?|S\.?L\.?U\.?|S\.?A\.?U\.?|S\.?C\.?P\.?|CB\b))$/m,
    /(?:razón\s+social|empresa|emisor|vendedor)[:\s]+([^\n]+)/i,
    /^([A-Z][A-ZÁÉÍÓÚÑ\s,\.]{4,40}(?:S\.A\.|S\.L\.|SL|SA)\.?)/m,
  ]
  for (const pat of companyPatterns) {
    const m = text.match(pat)
    if (m) { result.supplier_name = m[1].trim(); break }
  }

  // Si no encontramos nombre con forma jurídica, usamos las primeras líneas con texto real
  if (!result.supplier_name && lines.length > 0) {
    const candidate = lines.find((l) =>
      l.length > 4 && l.length < 60 &&
      /[A-ZÁÉÍÓÚÑ]/.test(l) &&
      !/^(factura|fecha|n[uú]mero|p[aá]gina|total|base|iva|ref)/i.test(l)
    )
    if (candidate) result.supplier_name = candidate
  }

  // ── Concepto ──
  const conceptPatterns = [
    /(?:concepto|descripci[oó]n|objeto)[:\s]+([^\n]+)/i,
    /(?:servicios?\s+de|suministro\s+de|venta\s+de)\s+([^\n]{5,60})/i,
  ]
  for (const pat of conceptPatterns) {
    const m = text.match(pat)
    if (m) { result.concept = m[1].trim().substring(0, 100); break }
  }

  return result
}
