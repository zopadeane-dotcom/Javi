// Extractor robusto de facturas españolas — sin IA, sin coste
// Estrategia: extrae texto del PDF y usa patrones + verificación matemática

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

// ── Parsear número español: "1.234,56" o "1234.56" → 1234.56
function parseNum(s: string): number {
  const clean = s.trim()
  // Formato europeo: 1.234,56
  if (/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(clean)) {
    return parseFloat(clean.replace(/\./g, "").replace(",", "."))
  }
  // Formato con coma decimal simple: 108,00
  if (/^\d+,\d{1,2}$/.test(clean)) {
    return parseFloat(clean.replace(",", "."))
  }
  // Formato punto decimal: 108.00
  return parseFloat(clean.replace(",", "."))
}

// ── Extraer todos los importes monetarios del texto
function extractAllAmounts(text: string): number[] {
  const raw = text.match(/\b\d{1,6}[.,]\d{2}\b/g) ?? []
  const nums = raw.map(parseNum).filter((n) => n > 0 && n < 1_000_000)
  return [...new Set(nums)]
}

// ── Buscar la combinación base+IVA+total matemáticamente correcta
function findAmounts(amounts: number[], vatRateHint?: number): {
  base: number; vat: number; total: number; rate: number
} | null {
  const rates = vatRateHint
    ? [vatRateHint]
    : [21, 10, 4, 0]

  // Ordenar de mayor a menor para empezar por el total más probable
  const sorted = [...amounts].sort((a, b) => b - a)

  for (const rate of rates) {
    for (const total of sorted) {
      // base = total / (1 + rate/100)
      const base = parseFloat((total / (1 + rate / 100)).toFixed(2))
      const vat = parseFloat((total - base).toFixed(2))

      // Buscar si base y vat existen en la lista (tolerancia 0.02€)
      const baseMatch = amounts.find((a) => Math.abs(a - base) <= 0.02)
      const vatMatch = amounts.find((a) => Math.abs(a - vat) <= 0.02)

      if (baseMatch && vatMatch && baseMatch !== total && vatMatch !== total && baseMatch !== vatMatch) {
        return { base: baseMatch, vat: vatMatch, total, rate }
      }
    }
  }
  return null
}

// ── Parsear fecha española a YYYY-MM-DD
function parseDate(s: string): string | undefined {
  const months: Record<string, string> = {
    enero: "01", febrero: "02", marzo: "03", abril: "04",
    mayo: "05", junio: "06", julio: "07", agosto: "08",
    septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12",
  }
  // "12 de marzo de 2024" o "12/03/2024" etc.
  const long = s.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i)
  if (long) {
    const m = months[long[2].toLowerCase()]
    if (m) return `${long[3]}-${m}-${long[1].padStart(2, "0")}`
  }
  const short = s.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
  if (short) {
    const y = short[3].length === 2 ? `20${short[3]}` : short[3]
    const mo = short[2].padStart(2, "0")
    const d = short[1].padStart(2, "0")
    // Validar que parece una fecha real (mes ≤ 12)
    if (parseInt(mo) <= 12 && parseInt(d) <= 31) {
      return `${y}-${mo}-${d}`
    }
  }
  return undefined
}

// ── Extractor principal
export function extractFromText(rawText: string): InvoiceData {
  const text = rawText
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const result: InvoiceData = {}

  // ── 1. NIF / CIF del emisor ──────────────────────────────
  // CIF: letra + 7 dígitos + dígito/letra = 9 chars
  // NIF: 8 dígitos + letra = 9 chars
  // NIE: X/Y/Z + 7 dígitos + letra = 9 chars
  const nifAll = text.match(/\b([A-Z]\d{7}[A-Z0-9]|\d{8}[A-Z])\b/g) ?? []
  // Preferir el primero que aparezca después de "CIF" o "NIF"
  const nifContext = text.match(/(?:NIF\s*[\/:]?\s*CIF|CIF|NIF)[:\s]+([A-Z0-9]{9})/i)
  if (nifContext) result.supplier_nif = nifContext[1]
  else if (nifAll.length > 0) result.supplier_nif = nifAll[0]

  // ── 2. Número de factura ──────────────────────────────────
  // Patrones muy permisivos para cualquier formato español
  const numPatterns = [
    // "Factura C26 32" o "Factura 2024/001" o "Factura A-001"
    /factura\s+n[uº°]?[:\s]*([A-Z0-9][\w\s\-\/\.]{1,20}?)(?:\s*\n|\s{2,}|$)/im,
    /factura[:\s]+([A-Z0-9][\w\-\/]{1,20})/i,
    // "Fra. nº 001"
    /fra\.?\s*n[uº°]?[:\s]*([A-Z0-9][\w\-\/]{1,15})/i,
    // "Nº factura: 001"
    /n[uº°]\s*\.?\s*factura[:\s]+([A-Z0-9][\w\-\/]{1,15})/i,
    // "F/2024/001" o "F-001-2024"
    /\b(F[\/\-]\d{2,4}[\/\-]\d{2,6})\b/i,
  ]
  for (const pat of numPatterns) {
    const m = text.match(pat)
    if (m) {
      const num = m[1].trim().replace(/\s+/g, " ")
      // Filtrar si es demasiado largo o parece una dirección
      if (num.length <= 20 && !/calle|avenida|avda/i.test(num)) {
        result.invoice_number = num
        break
      }
    }
  }

  // ── 3. Fecha de la factura ────────────────────────────────
  // Buscar cerca de "Fecha" sin requerir dos puntos
  const fechaPatterns = [
    /fecha\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /fecha\s*[:\-]?\s*(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/i,
  ]
  for (const pat of fechaPatterns) {
    const m = text.match(pat)
    if (m) {
      const d = parseDate(m[1])
      if (d) { result.invoice_date = d; break }
    }
  }
  // Fallback: primera fecha que aparece en el texto
  if (!result.invoice_date) {
    const allDates = text.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}\b/g) ?? []
    for (const d of allDates) {
      const parsed = parseDate(d)
      if (parsed) { result.invoice_date = parsed; break }
    }
  }

  // ── 4. Tipo de IVA ────────────────────────────────────────
  // "IVA 4.00%" o "21%" o "IVA: 10%" etc.
  const vatPatterns = [
    /iva\s+(\d+)[.,]?\d*\s*%/i,
    /(\d+)[.,]?\d*\s*%\s+iva/i,
    /\b(21|10|4)\s*%/,
  ]
  for (const pat of vatPatterns) {
    const m = text.match(pat)
    if (m) {
      const rate = parseInt(m[1])
      if ([0, 4, 10, 21].includes(rate)) { result.vat_rate = rate; break }
    }
  }

  // ── 5. Importes (estrategia matemática) ──────────────────
  const amounts = extractAllAmounts(text)
  const found = findAmounts(amounts, result.vat_rate)
  if (found) {
    result.base_amount = found.base
    result.vat_amount = found.vat
    result.total_amount = found.total
    if (!result.vat_rate) result.vat_rate = found.rate
  } else {
    // Intentar patrones de texto como último recurso
    const baseM = text.match(/base\s+imponible[^0-9\n]{0,30}(\d+[.,]\d{2})/i)
    const totalM = text.match(/total[^0-9\n]{0,15}(\d+[.,]\d{2})/i)
    if (baseM) result.base_amount = parseNum(baseM[1])
    if (totalM) result.total_amount = parseNum(totalM[1])
  }

  // ── 6. Nombre del proveedor ───────────────────────────────
  // Buscar líneas con forma jurídica (S.A., S.L., S.A.T., etc.)
  const companyRe = /\b([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,\.]{3,50}(?:S\.?A\.?T\.?|S\.?A\.?|S\.?L\.?U?\.?|S\.?C\.?P\.?|CB\b)\.?)\b/m
  const companyM = text.match(companyRe)
  if (companyM) {
    result.supplier_name = companyM[1].trim()
  } else {
    // Primera línea que parezca un nombre de empresa (no dirección, no número)
    const candidate = lines.find((l) =>
      l.length >= 3 && l.length <= 60 &&
      /[A-ZÁÉÍÓÚÑ]/.test(l) &&
      !/^\d/.test(l) &&
      !/^(factura|fecha|n[uú]mero|p[aá]g|total|base|iva|ref|tel|fax|cif|nif|ctra|avda|calle|c\/)/i.test(l)
    )
    if (candidate) result.supplier_name = candidate
  }

  // ── 7. Concepto ───────────────────────────────────────────
  const conceptM = text.match(/(?:concepto|descripci[oó]n|objeto)\s*[:\-]\s*([^\n]{5,80})/i)
  if (conceptM) {
    result.concept = conceptM[1].trim()
  } else {
    // Buscar líneas que parezcan productos/servicios
    const productLine = lines.find((l) =>
      l.length > 5 && l.length < 80 &&
      /^[A-Z]/.test(l) &&
      !/^(S\.A\.|S\.L\.|factura|fecha|total|base|iva|pagado|contado|observ)/i.test(l) &&
      !/^\d/.test(l) &&
      !/NIF|CIF|Tel:|Fax:|CADIZ|MADRID/.test(l)
    )
    if (productLine) result.concept = productLine
  }

  return result
}
