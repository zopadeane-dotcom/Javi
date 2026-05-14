// Extractor de facturas españolas basado en Real Decreto 1619/2012 (AEAT)
// Campos obligatorios según normativa: número, fecha expedición, NIF emisor,
// nombre emisor, nombre receptor, descripción operación, base imponible,
// tipo impositivo, cuota IVA, total.

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

// ── Parsear número español/inglés → float
function parseNum(s: string): number {
  const clean = s.trim()
  if (/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(clean))
    return parseFloat(clean.replace(/\./g, "").replace(",", "."))
  if (/^\d+,\d{1,2}$/.test(clean))
    return parseFloat(clean.replace(",", "."))
  return parseFloat(clean.replace(",", "."))
}

// ── Extraer todos los importes monetarios del texto
function extractAllAmounts(text: string): number[] {
  const patterns = [
    /\d{1,3}(?:\.\d{3})+,\d{2}/g,
    /\d{1,3}(?:,\d{3})+\.\d{2}/g,
    /\d{1,6},\d{2}(?!\d)/g,
    /\d{1,6}\.\d{2}(?!\d)/g,
  ]
  const all: string[] = []
  for (const pat of patterns) all.push(...(text.match(pat) ?? []))
  const nums = all.map(parseNum).filter((n) => n > 0.01 && n < 999_999)
  return [...new Set(nums.map((n) => parseFloat(n.toFixed(2))))]
}

// ── Verificación matemática: base × (1 + tipo/100) ≈ total
function findAmounts(amounts: number[], vatRateHint?: number) {
  const rates = vatRateHint != null ? [vatRateHint] : [21, 10, 4, 0]
  const sorted = [...amounts].sort((a, b) => b - a)
  const TOL = 0.05

  for (const rate of rates) {
    for (const total of sorted) {
      if (total < 1) continue
      const base1 = parseFloat((total / (1 + rate / 100)).toFixed(2))
      const vat1 = parseFloat((total - base1).toFixed(2))
      const bM = amounts.find((a) => Math.abs(a - base1) <= TOL)
      const vM = amounts.find((a) => Math.abs(a - vat1) <= TOL)
      if (bM && vM && Math.abs(bM - total) > TOL && Math.abs(vM - total) > TOL)
        return { base: bM, vat: vM, total, rate }

      for (const base of sorted) {
        if (base >= total) continue
        const vat = parseFloat((total - base).toFixed(2))
        const expectedVat = parseFloat((base * rate / 100).toFixed(2))
        if (Math.abs(vat - expectedVat) <= TOL) {
          const vatM = amounts.find((a) => Math.abs(a - vat) <= TOL)
          if (vatM || rate === 0) return { base, vat: vatM ?? vat, total, rate }
        }
      }
    }
  }
  return null
}

// ── Parsear fecha a YYYY-MM-DD (soporta español, inglés, ISO)
function parseDate(s: string): string | undefined {
  const M: Record<string, string> = {
    enero:"01",febrero:"02",marzo:"03",abril:"04",mayo:"05",junio:"06",
    julio:"07",agosto:"08",septiembre:"09",octubre:"10",noviembre:"11",diciembre:"12",
    january:"01",february:"02",march:"03",april:"04",may:"05",june:"06",
    july:"07",august:"08",september:"09",october:"10",november:"11",december:"12",
    jan:"01",feb:"02",mar:"03",apr:"04",jun:"06",jul:"07",aug:"08",
    sep:"09",oct:"10",nov:"11",dec:"12",
    ene:"01",abr:"04",ago:"08",
  }
  // "12 de marzo de 2024"
  const long = s.match(/(\d{1,2})\s+de\s+(\w+)(?:\s+de)?\s+(\d{4})/i)
  if (long) { const m = M[long[2].toLowerCase()]; if (m) return `${long[3]}-${m}-${long[1].padStart(2,"0")}` }
  // "07 May 2026" / "7 mayo 2026"
  const named = s.match(/(\d{1,2})\s+([A-Za-záéíóúñ]{3,12})\s+(\d{4})/)
  if (named) { const m = M[named[2].toLowerCase()]; if (m) return `${named[3]}-${m}-${named[1].padStart(2,"0")}` }
  // YYYY/MM/DD o YYYY-MM-DD
  const iso = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (iso) { const mo=iso[2].padStart(2,"0"),d=iso[3].padStart(2,"0"); if(+mo<=12&&+d<=31) return `${iso[1]}-${mo}-${d}` }
  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const short = s.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
  if (short) {
    const y = short[3].length===2 ? `20${short[3]}` : short[3]
    const mo=short[2].padStart(2,"0"), d=short[1].padStart(2,"0")
    if (+mo<=12 && +d<=31) return `${y}-${mo}-${d}`
  }
  return undefined
}

// ── Palabras que marcan el inicio de la sección RECEPTOR/CLIENTE
// (según RD 1619/2012: "datos del destinatario", "receptor", "cliente", etc.)
const BUYER_SECTION = /\b(datos\s+del\s+(receptor|destinatario|cliente|comprador)|receptor|destinatario|comprador|señores|bill\s+to|billing\s+(address|info)|ship\s+to|sold\s+to|dirección\s+de\s+(envío|facturación|entrega)|facturar\s+a|cliente[:\s])\b/i

// ── Etiquetas que NO son números de factura válidos
const NUM_BLACKLIST = /^(FECHA(\s+DEL?)?|NUMERO|NÚMERO|DATE|REF|REFERENCIA|MR\.|MRS\.|SR\.|SRA\.|DR\.|CONCEPTO|DESCRIPCI[OÓ]N)$/i
const NUM_BAD_START = /^(FECHA|MR\.|MRS\.|SR\.|DR\.|ID[\s\-])/i
const FRACTION = /^\d+\/\d+$/

// ── Formas jurídicas con o sin puntos (para detectar razón social)
const LEGAL_FORMS = "(?:S\\.A\\.T\\.?|S\\.A\\.L\\.?|S\\.L\\.U\\.?|S\\.L\\.?|S\\.A\\.?|S\\.C\\.P\\.?|C\\.B\\.?|SLU\\b|SL\\b|SA\\b|SAT\\b|CB\\b)"

// ── Extractor principal
export function extractFromText(rawText: string): InvoiceData {
  const text = rawText
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const result: InvoiceData = {}

  // ════════════════════════════════════════════════════════
  // MODO AMAZON — detectado por presencia de "amazon" en el texto
  // Estructura especial: datos del vendedor en "Vendido por",
  // número y fecha en cuadro superior, NIF con prefijo EU (ESWxxxxxxx)
  // ════════════════════════════════════════════════════════
  if (/amazon/i.test(text)) {
    // Nº factura: "Número de la factura  ES6DMF6ABEI"
    const numM = text.match(/n[uú]mero\s+de\s+la\s+factura\s+([A-Z0-9\-]+)/i)
    if (numM) result.invoice_number = numM[1].trim()

    // Fecha: "Fecha de la factura/Fecha de la entrega  01 marzo 2026"
    const dateM = text.match(/fecha\s+de\s+la\s+factura[^\n]{0,40}\n?\s*(\d{1,2}\s+\w+\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i)
    if (dateM) result.invoice_date = parseDate(dateM[1].trim())

    // Proveedor: línea debajo de "Vendido por"
    const vendidoM = text.match(/vendido\s+por\s*\n?\s*([^\n]{5,80})/i)
    if (vendidoM) {
      const name = vendidoM[1].trim().replace(/\s+/g, " ")
      if (!/^joanna|^juan|^maria|^jose/i.test(name)) // excluir nombres de persona
        result.supplier_name = name
    }

    // NIF del vendedor: "IVA ESW0264006H" (formato EU: 2 letras país + NIF)
    const vatNumM = text.match(/\bIVA\s+(ES[A-Z0-9]{8,10})\b/gi)
    if (vatNumM) {
      // El último suele ser el del vendedor (Amazon), no el del comprador
      result.supplier_nif = vatNumM[vatNumM.length - 1].replace(/^IVA\s+/i, "")
    }

    // Total: "Total pendiente  22,87 €"
    const totalM = text.match(/total\s+pendiente\s+([0-9.,]+)\s*€/i)
    if (totalM) result.total_amount = parseNum(totalM[1])

    // Base: precio IVA excluido en la tabla de productos
    const baseM = text.match(/\(\s*IVA\s+exclu[ií]do\s*\)[^\n]*\n[\s\S]{0,200}?(\d+,\d{2})\s*€/i)
      ?? text.match(/(\d+,\d{2})\s*€\s*\n?\s*\d+[.,]\d+\s*%/i)
    if (baseM) result.base_amount = parseNum(baseM[1])

    // IVA %: porcentaje en tabla "21.0%"
    const vatPctM = text.match(/(\d+)[.,]\d*\s*%\s*(?:\n|€|\s+\d)/i)
    if (vatPctM) {
      const r = parseInt(vatPctM[1])
      if ([0, 4, 10, 21].includes(r)) result.vat_rate = r
    }

    // Si tenemos total y base, calcular IVA
    if (result.total_amount && result.base_amount && !result.vat_amount) {
      result.vat_amount = parseFloat((result.total_amount - result.base_amount).toFixed(2))
    }

    // Concepto: descripción del producto
    const descM = text.match(/Descripci[oó]n\s*\n\s*(.{5,100})/i)
    if (descM) result.concept = descM[1].trim()

    // Si tenemos suficiente, devolver ya sin pasar por el extractor genérico
    if (result.invoice_number && result.invoice_date && result.total_amount)
      return result
  }

  // ════════════════════════════════════════════════════════
  // 1. NIF/CIF del emisor
  //    RD 1619/2012 art.6: obligatorio el NIF del expedidor
  // ════════════════════════════════════════════════════════
  const nifRe = /\b([A-Z]\d{7}[A-Z0-9]|\d{8}[A-Z]|[XYZ]\d{7}[A-Z])\b/g
  const allNifs = text.match(nifRe) ?? []
  const nifLabelled = text.match(/(?:NIF|CIF|C\.I\.F|N\.I\.F)[.:\s]+([A-Z0-9]{9})/i)
  if (nifLabelled) result.supplier_nif = nifLabelled[1]
  else if (allNifs.length > 0) result.supplier_nif = allNifs[0]

  // ════════════════════════════════════════════════════════
  // 2. Número de factura
  //    RD 1619/2012 art.6.1a: número y serie, correlativo
  // ════════════════════════════════════════════════════════
  const numPatterns = [
    // "Número de factura: F26/0784" — etiqueta legal exacta
    /n[uú]mero\s+(?:de\s+)?factura[:\s#]*([A-Z0-9][\w\-\/\.]{1,20})/i,
    // "Factura nº / Factura #"
    /factura\s+n[uúº°]?[:\s#]*([A-Z0-9][\w\s\-\/\.]{1,20}?)(?:\s{2,}|\n|$)/im,
    /factura\s*#\s*([A-Z0-9][\w\-\/\.]+)/i,
    /factura[:\s]+([A-Z0-9][\w\-\/\.]+(?:[\s\-][A-Z0-9][\w\-\/\.]*)?)/i,
    // "Fra. nº" / "Nº fra."
    /fra\.?\s*n[uúº°]?[:\s]*([A-Z0-9][\w\-\/\s]{1,15}?)(?:\s{2,}|\n|$)/im,
    /n[uúº°]\s*\.?\s*fra[:.]\s*([A-Z0-9][\w\-\/]{1,15})/i,
    // Serie + número: "A-001", "F/2024/001"
    /\b(F[\/\-]\d{2,4}[\/\-]\d{2,6})\b/,
    /\bserie[:\s]+([A-Z]{1,3})\s+n[uúº°]?[:\s]*(\d{1,6})/i,
    // Ticket / Recibo / Receipt
    /(?:ticket|recibo|receipt|albar[aá]n)\s*n[uúº°]?[:\s#]*([A-Z0-9][\w\-\/]{1,20})/i,
    // INV-xxx / FAC-xxx / REC-xxx
    /\b((?:INV|FAC|FACT|REC|ORD)[_\-][A-Z0-9][\w\-]{1,20})\b/i,
    // "Ref:" como último recurso
    /\bref(?:erencia)?[:\s]+([A-Z0-9][\w\-\/]{2,20})/i,
  ]
  for (const pat of numPatterns) {
    const m = text.match(pat)
    if (!m) continue
    // Si el patrón captura serie + número por separado (grupo 1 y 2)
    const raw = m[2] ? `${m[1]}-${m[2]}` : m[1]
    const num = raw.trim().replace(/\s+/g, " ").replace(/\s*-\s*/g, "-")
    if (num.length > 20) continue
    if (/calle|avenida|avda|ctra/i.test(num)) continue
    if (NUM_BLACKLIST.test(num)) continue
    if (NUM_BAD_START.test(num)) continue
    if (FRACTION.test(num)) continue
    result.invoice_number = num
    break
  }

  // ════════════════════════════════════════════════════════
  // 3. Fecha de expedición
  //    RD 1619/2012 art.6.1b: "fecha de expedición"
  // ════════════════════════════════════════════════════════
  const datePatterns = [
    // Etiquetas legales exactas (mayor prioridad)
    /fecha\s+de\s+(?:expedici[oó]n|emisi[oó]n|factura)[:\s]*(.{6,20})/i,
    /fecha\s+(?:de\s+)?(?:expedici[oó]n|emisi[oó]n)[:\s]*(.{6,20})/i,
    // "Fecha:" genérico
    /fecha\s*[:\-]\s*(.{6,20})/i,
    // "Date:" / "Invoice date:" en inglés (Amazon, plataformas internacionales)
    /invoice\s+date[:\s]+(.{6,20})/i,
    /order\s+date[:\s]+(.{6,20})/i,
    /\bdate[:\s]+(.{6,20})/i,
    // "Fecha de operación" / "Fecha de servicio"
    /fecha\s+(?:de\s+)?(?:operaci[oó]n|servicio|entrega)[:\s]*(.{6,20})/i,
  ]
  for (const pat of datePatterns) {
    const m = text.match(pat)
    if (m) {
      const d = parseDate(m[1].trim().substring(0, 20))
      if (d) { result.invoice_date = d; break }
    }
  }
  // Fallback: primera fecha del texto que no sea de vencimiento
  if (!result.invoice_date) {
    const allDates = [...text.matchAll(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b/g)]
    for (const match of allDates) {
      const before = text.substring(Math.max(0, (match.index ?? 0) - 50), match.index ?? 0)
      if (/vencimiento|vence\b|pago\s+antes|cobro|caducidad/i.test(before)) continue
      const parsed = parseDate(match[1])
      if (parsed) { result.invoice_date = parsed; break }
    }
    // Si no hay nada sin vencimiento, usar la primera
    if (!result.invoice_date && allDates.length > 0) {
      const parsed = parseDate(allDates[0][1])
      if (parsed) result.invoice_date = parsed
    }
  }

  // ════════════════════════════════════════════════════════
  // 4. Tipo impositivo (IVA)
  //    RD 1619/2012 art.6.1f: "tipo impositivo aplicado"
  // ════════════════════════════════════════════════════════
  const vatPatterns = [
    /tipo\s+impositivo[:\s]+(\d+)[,.]?\d*\s*%/i,
    /iva\s+(\d+)[,.]?\d*\s*%/i,
    /(\d+)[,.]?\d*\s*%\s+(?:de\s+)?iva/i,
    /\b(21|10|4)\s*%/,
  ]
  for (const pat of vatPatterns) {
    const m = text.match(pat)
    if (m) {
      const rate = parseInt(m[1])
      if ([0, 4, 10, 21].includes(rate)) { result.vat_rate = rate; break }
    }
  }

  // ════════════════════════════════════════════════════════
  // 5. Importes: base imponible, cuota IVA, total
  //    RD 1619/2012 art.6.1e-g
  // ════════════════════════════════════════════════════════
  // Intentar primero con etiquetas legales directas
  const baseLabelled = text.match(/base\s+imponible[^0-9\n]{0,20}(\d[\d.,]*)/i)
  const vatLabelled = text.match(/cuota\s+(?:de\s+)?(?:iva|tributaria|impuesto)[^0-9\n]{0,20}(\d[\d.,]*)/i)
  const totalLabelled = text.match(/(?:total\s+(?:factura|a\s+pagar|importe)|importe\s+total)[^0-9\n]{0,15}(\d[\d.,]*)/i)
    ?? text.match(/\bTOTAL\s+(\d[\d.,€\s]*)/i)

  if (baseLabelled && totalLabelled) {
    const base = parseNum(baseLabelled[1])
    const total = parseNum(totalLabelled[1].replace(/€|\s/g, ""))
    if (base > 0 && total > base) {
      result.base_amount = base
      result.total_amount = total
      result.vat_amount = vatLabelled ? parseNum(vatLabelled[1]) : parseFloat((total - base).toFixed(2))
      if (!result.vat_rate) {
        const rate = parseFloat(((total - base) / base * 100).toFixed(0))
        if ([0, 4, 10, 21].includes(rate)) result.vat_rate = rate
      }
    }
  }

  // Si no, usar verificación matemática
  if (!result.base_amount) {
    const amounts = extractAllAmounts(text)
    const found = findAmounts(amounts, result.vat_rate)
    if (found) {
      result.base_amount = found.base
      result.vat_amount = found.vat
      result.total_amount = found.total
      if (!result.vat_rate) result.vat_rate = found.rate
    } else if (baseLabelled) {
      result.base_amount = parseNum(baseLabelled[1])
    }
    if (!result.total_amount && totalLabelled) {
      result.total_amount = parseNum(totalLabelled[1].replace(/€|\s/g, ""))
    }
  }

  // ════════════════════════════════════════════════════════
  // 6. Nombre del emisor (proveedor)
  //    RD 1619/2012 art.6.1d: "nombre y apellidos/razón social del expedidor"
  //    CLAVE: el emisor va ANTES que el receptor en la factura
  // ════════════════════════════════════════════════════════
  const buyerIdx = text.search(BUYER_SECTION)
  // Zona del emisor: texto antes del receptor, máximo 700 chars
  const issuerZone = buyerIdx > 80
    ? text.substring(0, buyerIdx)
    : text.substring(0, Math.min(text.length, 700))

  // Si hay una sección marcada explícitamente como emisor, usarla
  const issuerSectionM = text.match(/(?:datos\s+del\s+(?:emisor|expedidor|proveedor|vendedor)|emisor[:\s]|expedidor[:\s])([\s\S]{0,200}?)(?:\n\n|\n(?=[A-Z]))/i)
  const searchZone = issuerSectionM ? issuerSectionM[1] : issuerZone
  const searchLines = searchZone.split("\n").map((l) => l.trim()).filter(Boolean)

  function isValidSupplier(name: string): boolean {
    if (!name || name.length < 3) return false
    if (name.startsWith("(")) return false
    if (/ID\s+de\s+(comerciante|referencia|pago)|merchant\s*ID|payment\s*ID/i.test(name)) return false
    if (/IVA\s+(exclu|inclu)/i.test(name)) return false
    if (/^[A-Za-z0-9]{9,}$/.test(name)) return false
    if (/^(Mr\.|Mrs\.|Sr\.|Sra\.|Dr\.|Miss\s|Don\s|Doña\s)/i.test(name)) return false
    if (/^ID[\s\-]/i.test(name)) return false
    if (/^(IVA|IRPF|impuesto|tax|base|total|fecha|factura|n[uú]m|detalles\s+de|invoice\s+det|order\s+det|datos\s+de\s+la)/i.test(name)) return false
    if (/\b\d{5}\b/.test(name)) return false
    // Etiquetas de sección que se cuelan como nombre
    if (/^(detalles|details|summary|resumen|informaci[oó]n|datos)\b/i.test(name)) return false
    return true
  }

  // A: razón social con forma jurídica
  const reFirst = new RegExp(`\\b((?:${LEGAL_FORMS})\\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\\s,\\.&]{2,50})`, "m")
  const reFinal = new RegExp(`([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\\s,\\.&]{2,50}\\s${LEGAL_FORMS})`, "m")

  const mFirst = searchZone.match(reFirst)
  const mFinal = searchZone.match(reFinal)

  if (mFirst) {
    const c = mFirst[1].trim().replace(/\s+/g, " ")
    if (isValidSupplier(c)) result.supplier_name = c
  }
  if (!result.supplier_name && mFinal) {
    const c = mFinal[1].trim().replace(/\s+/g, " ")
    if (isValidSupplier(c)) result.supplier_name = c
  }

  // B: fallback — primera línea de la zona emisor que parezca un nombre
  if (!result.supplier_name) {
    const candidate = searchLines.find((l) => {
      if (l.length < 4 || l.length > 70) return false
      if (/^\d/.test(l)) return false
      if (l.trim().split(/\s+/).length < 2) return false
      if (/^(factura|fecha|n[uú]m|p[aá]g|total|base|iva|ref|tel[eé]?f?|fax|email|e-mail|web|cif|nif|c\.i\.f|n\.i\.f|ctra|carretera|avda|calle|c\/|pol[íi]gono|apdo|c\.p\.)/i.test(l)) return false
      if (/\bKM\.?\s*\d/i.test(l)) return false
      if (/\b\d{5}\b/.test(l)) return false
      if (/^\+?\d[\d\s\-().]{6,}$/.test(l)) return false  // teléfono
      if (/@/.test(l)) return false  // email
      return isValidSupplier(l)
    })
    if (candidate) result.supplier_name = candidate
  }

  // ════════════════════════════════════════════════════════
  // 7. Concepto / descripción de la operación
  //    RD 1619/2012 art.6.1e
  // ════════════════════════════════════════════════════════
  const conceptLabelled = text.match(/(?:concepto|descripci[oó]n(?:\s+de\s+(?:la\s+)?operaci[oó]n)?|objeto\s+de\s+factura)[:\-\s]+([^\n]{5,100})/i)
  if (conceptLabelled) {
    result.concept = conceptLabelled[1].trim()
  } else {
    const productLine = lines.find((l) =>
      l.length > 5 && l.length < 100 &&
      /^[A-ZÁÉÍÓÚÑ]/.test(l) &&
      !/^(S\.A\.|S\.L\.|S\.A\.T\.|factura|fecha|total|base|iva|pagado|contado|observ|proveedor|emisor|receptor|cliente|destinatario)/i.test(l) &&
      !/^\d/.test(l) &&
      !/NIF|CIF|Tel[éef]?|Fax|Email|e-mail|web/i.test(l) &&
      !/^(CTRA|CARRETERA|C\/|AVDA|PLAZA|POL|URB\.)/i.test(l) &&
      !/\bKM\.?\s*\d/i.test(l) &&
      !/\b\d{5}\b/.test(l) &&
      !/@/.test(l)
    )
    if (productLine) result.concept = productLine
  }

  return result
}
