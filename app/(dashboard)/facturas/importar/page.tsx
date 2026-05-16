"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { createInvoice, saveOtherDocument } from "@/lib/actions/invoices"
import JSZip from "jszip"
import {
  CheckCircle, AlertCircle, Loader2, ArrowLeft, ArrowRight,
  FileText, ChevronDown, ChevronUp, Mail, HardDrive, Upload,
  FolderOpen, X, Sparkles, Inbox,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

/* ─── Tipos ─── */
type FileStatus = "pending" | "reading" | "done" | "error"
type Step = "source" | "drop" | "processing" | "polishing" | "review" | "saving" | "done"
type Source = "drive" | "gmail" | "files"

interface InvoiceRow {
  id: string; file: File; status: FileStatus; error?: string
  supplier_name?: string; supplier_nif?: string; invoice_number?: string
  invoice_date?: string; base_amount?: number; vat_rate?: number
  total_amount?: number; concept?: string; supplier_id?: string
  saved?: boolean; expanded?: boolean; rawText?: string
  documentType?: "invoice" | "income_report" | "other"
  detectionReason?: string
}

const fmt = (n?: number) => n != null ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n) : "—"

/* ─── Correcciones automáticas post-extracción ─── */

// Etiquetas que indican que el número de factura no se extrajo correctamente
const BAD_INVOICE_NUMBERS = new Set(["FECHA", "NUMERO", "NÚMERO", "REF", "DATE", "", "0", "0/0"])

function polishRow(row: InvoiceRow): InvoiceRow {
  const result = { ...row }
  const fileName = row.file.name

  // ── Número de factura ──────────────────────────────────────
  const invNum = result.invoice_number?.trim() ?? ""
  if (BAD_INVOICE_NUMBERS.has(invNum.toUpperCase()) || invNum === "") {
    // Intento 1: patrón INV_12345 o FAC_12345 en el nombre del fichero
    const prefixMatch = fileName.match(/\b(?:INV|FAC|FACT|REC)[_\-]([A-Z0-9][\w\-]{2,20})/i)
    if (prefixMatch) {
      result.invoice_number = prefixMatch[0].toUpperCase()
    } else {
      // Intento 2: secuencia de números en el nombre tipo "42_51_24929_20260416..."
      // extraer el segmento numérico más largo (descartando segmentos de fecha YYYYMMDD)
      const segments = fileName.replace(/\.[^.]+$/, "").split(/[_\-\s]+/)
      const numericSegments = segments.filter((s) => /^\d+$/.test(s) && s.length >= 4 && s.length <= 8)
      // Preferir segmentos que no parezcan fechas (YYYYMMDD = 8 dígitos que empiezan con 20xx)
      const candidate = numericSegments.find((s) => !(s.length === 8 && s.startsWith("20")))
        ?? numericSegments[0]
      if (candidate) {
        result.invoice_number = candidate
      }
      // No usar fallback de nombre de archivo — produce basura (FACTURAAMAZONES)
    }
  }

  // ── Fecha de factura ───────────────────────────────────────
  if (!result.invoice_date) {
    // Patrón YYYYMMDD en el nombre (ej: "20260416" → "2026-04-16")
    const yyyymmdd = fileName.match(/\b(20\d{2})(0[1-9]|1[0-2])([0-2]\d|3[01])\b/)
    if (yyyymmdd) {
      result.invoice_date = `${yyyymmdd[1]}-${yyyymmdd[2]}-${yyyymmdd[3]}`
    } else {
      // Patrón YYYY-MM-DD en el nombre
      const isoDate = fileName.match(/\b(20\d{2})[-_](0[1-9]|1[0-2])[-_]([0-2]\d|3[01])\b/)
      if (isoDate) {
        result.invoice_date = `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`
      }
    }
  }

  // ── Nombre de proveedor ────────────────────────────────────
  const supplierName = result.supplier_name ?? ""
  if (
    supplierName.startsWith("(") ||
    /^ID\s/i.test(supplierName) ||
    /ID\s+de\s+(comerciante|referencia|pago)|merchant\s+ID|IVA\s+exclu[ií]do|IVA\s+inclu[ií]do/i.test(supplierName) ||
    /^(Mr\.|Mrs\.|Sr\.|Sra\.|Dr\.)/i.test(supplierName) ||
    /^[A-Za-z0-9]{8,}$/.test(supplierName) && /\d/.test(supplierName)
  ) {
    result.supplier_name = undefined
  }

  // ── Número de factura inválido ─────────────────────────────
  const invNumCheck = result.invoice_number ?? ""
  if (/^(FECHA|MR\.|SR\.|ID\s)/i.test(invNumCheck) || /^\d+\/\d+$/.test(invNumCheck)) {
    result.invoice_number = undefined
  }

  return result
}

/* ─── Instrucciones por fuente ─── */
const SOURCES = {
  drive: {
    icon: HardDrive,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800/40",
    title: "Desde Google Drive",
    subtitle: "Descarga tu carpeta de facturas como ZIP",
    steps: [
      { emoji: "📂", text: "Abre Google Drive y ve a la carpeta donde tienes tus facturas" },
      { emoji: "🖱️", text: "Haz click derecho sobre la carpeta → Descargar" },
      { emoji: "📦", text: "Google Drive descarga un archivo .zip a tu ordenador" },
      { emoji: "⬆️", text: "Arrastra ese archivo .zip aquí abajo" },
    ],
  },
  gmail: {
    icon: Mail,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800/40",
    title: "Desde Gmail",
    subtitle: "Guarda las facturas de tu correo en Drive y descárgalas",
    steps: [
      { emoji: "🔍", text: "Abre Gmail y busca 'factura' en el buscador" },
      { emoji: "📎", text: "Abre cada email con factura → haz click en el PDF adjunto → Guardar en Drive" },
      { emoji: "📂", text: "En Drive tendrás todos los PDFs juntos en una carpeta" },
      { emoji: "⬇️", text: "Descarga la carpeta como ZIP y arrástrala aquí" },
    ],
  },
  files: {
    icon: Upload,
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
    title: "Desde mi ordenador",
    subtitle: "Selecciona directamente los archivos o carpeta",
    steps: [
      { emoji: "💻", text: "Haz click en el botón de abajo para seleccionar archivos" },
      { emoji: "📁", text: "Puedes seleccionar una carpeta entera o varios PDFs a la vez" },
      { emoji: "📦", text: "También puedes arrastrar un archivo .zip con todos los PDFs" },
      { emoji: "✅", text: "Workie leerá cada factura y rellenará los datos automáticamente" },
    ],
  },
}

/* ─── Componente principal ─── */
export default function ImportarFacturasPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("source")
  const [source, setSource] = useState<Source>("drive")
  const [rows, setRows] = useState<InvoiceRow[]>([])
  const [dragging, setDragging] = useState(false)
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [savingProgress, setSavingProgress] = useState(0)
  const [polishProgress, setPolishProgress] = useState(0)
  const [showOtherModal, setShowOtherModal] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)
  const zipRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    createClient().from("suppliers").select("id, name").order("name")
      .then(({ data }) => setSuppliers(data ?? []))
  }, [])

  // Mostrar popup cuando entramos en revisión y hay documentos "otros"
  useEffect(() => {
    if (step === "review") {
      const count = rows.filter((r) => r.documentType === "other").length
      if (count > 0) setShowOtherModal(true)
    }
  }, [step])

  async function extractPdfsFromFiles(files: File[]): Promise<File[]> {
    const result: File[] = []
    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const zip = await JSZip.loadAsync(await file.arrayBuffer())
          for (const [name, entry] of Object.entries(zip.files)) {
            if (!entry.dir && name.toLowerCase().endsWith(".pdf")) {
              const blob = await entry.async("blob")
              result.push(new File([blob], name.split("/").pop() ?? name, { type: "application/pdf" }))
            }
          }
        } catch { toast.error(`No se pudo abrir ${file.name}`) }
      } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        result.push(file)
      }
    }
    return result
  }

  async function startPolishing(rawRows: InvoiceRow[]) {
    setStep("polishing")
    setPolishProgress(0)
    const polished = [...rawRows]
    for (let i = 0; i < polished.length; i++) {
      polished[i] = polishRow(polished[i])
      setRows([...polished])
      setPolishProgress(Math.round(((i + 1) / polished.length) * 100))
      await new Promise((r) => setTimeout(r, 50))
    }
    setStep("review")
  }

  async function startProcessing(files: File[]) {
    const pdfs = await extractPdfsFromFiles(files)
    if (pdfs.length === 0) { toast.error("No se encontraron PDFs en los archivos seleccionados"); return }

    const newRows: InvoiceRow[] = pdfs.map((f) => ({
      id: Math.random().toString(36).slice(2), file: f, status: "pending",
    }))
    setRows(newRows)
    setStep("processing")

    const updated = [...newRows]
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: "reading" }
      setRows([...updated])
      try {
        const fd = new FormData()
        fd.append("file", updated[i].file)
        const resp = await fetch("/api/extract-invoice", { method: "POST", body: fd })
        const json = await resp.json()
        if (json.success && json.data) {
          const d = json.data
          let supplier_id: string | undefined
          if (d.supplier_name) {
            const found = suppliers.find((s) =>
              s.name.toLowerCase().includes(d.supplier_name.toLowerCase().split(" ")[0]) ||
              d.supplier_name.toLowerCase().includes(s.name.toLowerCase().split(" ")[0])
            )
            if (found) supplier_id = found.id
          }
          updated[i] = { ...updated[i], status: "done", supplier_id, rawText: json.rawText, ...d, documentType: d.documentType, detectionReason: d.detectionReason }
        } else {
          updated[i] = { ...updated[i], status: json.scanned ? "error" : "done", rawText: json.rawText, error: json.scanned ? "PDF escaneado" : undefined }
        }
      } catch { updated[i] = { ...updated[i], status: "error", error: "Error al leer" } }
      setRows([...updated])
      await new Promise((r) => setTimeout(r, 60))
    }
    // Ir al paso de pulido antes de la revisión
    await startPolishing(updated)
  }

  const updateRow = useCallback((id: string, changes: Partial<InvoiceRow>) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, ...changes } : r))
  }, [])

  async function saveAll() {
    setStep("saving")
    let saved = 0
    const toSave = invoiceRows.filter((r) => r.invoice_number && r.invoice_date && r.base_amount && (r.supplier_name || r.supplier_id))
    const total = toSave.length

    // Obtener business_id una sola vez para los uploads
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = user
      ? await supabase.from("profiles").select("business_id").eq("id", user.id).single()
      : { data: null }

    for (const row of invoiceRows) {
      if (row.saved || !row.invoice_number || !row.invoice_date || !row.base_amount) continue
      if (!row.supplier_name && !row.supplier_id) continue
      try {
        // Subir PDF directamente a Supabase Storage (evita límite 1MB del Server Action)
        let fileUrl: string | undefined
        if (profile?.business_id) {
          const ext = row.file.name.split(".").pop()
          const path = `${profile.business_id}/facturas/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error } = await supabase.storage.from("documents").upload(path, row.file)
          if (!error) fileUrl = path
        }

        const fd = new FormData()
        if (row.supplier_id) fd.append("supplier_id", row.supplier_id)
        else fd.append("supplier_name", row.supplier_name!)
        fd.append("invoice_number", row.invoice_number)
        fd.append("invoice_date", row.invoice_date)
        fd.append("base_amount", String(row.base_amount))
        fd.append("vat_rate", String(row.vat_rate ?? 10))
        if (row.concept) fd.append("concept", row.concept)
        fd.append("is_deductible", "true")
        if (fileUrl) fd.append("file_url", fileUrl)

        await createInvoice(fd)
        updateRow(row.id, { saved: true })
        saved++
        setSavingProgress(Math.round((saved / total) * 100))
      } catch { /* continúa con la siguiente */ }
    }
    setStep("done")
    toast.success(`¡${saved} factura${saved !== 1 ? "s" : ""} importada${saved !== 1 ? "s" : ""}!`)
  }

  async function saveOtherDocs() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = user
      ? await supabase.from("profiles").select("business_id").eq("id", user.id).single()
      : { data: null }

    let saved = 0
    for (const row of otherRows) {
      let fileUrl: string | undefined
      if (profile?.business_id) {
        const ext = row.file.name.split(".").pop() ?? "pdf"
        const path = `${profile.business_id}/otros/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from("documents").upload(path, row.file)
        if (!error) fileUrl = path
      }
      const fd = new FormData()
      fd.append("original_filename", row.file.name)
      if (row.detectionReason) fd.append("reason", row.detectionReason)
      if (row.documentType) fd.append("detected_type", row.documentType)
      if (fileUrl) fd.append("file_url", fileUrl)
      if (row.supplier_name) fd.append("supplier_name", row.supplier_name)
      const res = await saveOtherDocument(fd)
      if (!res?.error) saved++
    }
    toast.success(`${saved} documento${saved !== 1 ? "s" : ""} guardado${saved !== 1 ? "s" : ""} en Otros documentos`)
  }

  const invoiceRows = rows.filter((r) => r.documentType !== "income_report" && r.documentType !== "other")
  const otherRows = rows.filter((r) => r.documentType === "other" || r.documentType === "income_report")
  const readyCount = invoiceRows.filter((r) => r.status === "done" && r.invoice_number && r.invoice_date && r.base_amount && (r.supplier_id || r.supplier_name)).length
  const src = SOURCES[source]
  const SrcIcon = src.icon

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── MODAL: documentos que no son facturas ── */}
      {showOtherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border shadow-2xl p-6 max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <Inbox className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-bold">Documentos detectados</p>
                <p className="text-xs text-muted-foreground">No son facturas de proveedor</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Se han detectado <strong className="text-foreground">{otherRows.length} documento{otherRows.length !== 1 ? "s" : ""}</strong> que no son facturas de proveedor.
              Los enviaremos a <strong className="text-emerald-700 dark:text-emerald-400">Otros documentos</strong> dentro del apartado de Facturas para que no se pierdan.
            </p>
            <ul className="space-y-1">
              {otherRows.map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{r.file.name}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowOtherModal(false)}>
              Entendido
            </Button>
          </div>
        </div>
      )}

      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/facturas"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Importar facturas</h1>
          <p className="text-muted-foreground text-sm">Importa todas tus facturas de una vez — sin escribir nada</p>
        </div>
      </div>

      {/* ── ELEGIR FUENTE ── */}
      {step === "source" && (
        <div className="space-y-4">
          <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">¿Dónde tienes tus facturas?</p>

          <div className="grid grid-cols-1 gap-3">
            {(Object.entries(SOURCES) as [Source, typeof SOURCES.drive][]).map(([key, s]) => {
              const Icon = s.icon
              const active = source === key
              return (
                <button
                  key={key}
                  onClick={() => setSource(key)}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all hover:scale-[1.01] ${
                    active ? `${s.border} ${s.bg}` : "border-border hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${active ? s.bg : "bg-muted"} border ${active ? s.border : "border-transparent"}`}>
                    <Icon className={`h-6 w-6 ${active ? s.color : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className={`font-bold ${active ? s.color : ""}`}>{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.subtitle}</p>
                  </div>
                  {active && <CheckCircle className={`ml-auto h-5 w-5 shrink-0 ${s.color}`} />}
                </button>
              )
            })}
          </div>

          <Button className="w-full" size="lg" onClick={() => setStep("drop")}>
            Continuar con {src.title}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* ── INSTRUCCIONES + DROP ── */}
      {step === "drop" && (
        <div className="space-y-4">
          {/* Instrucciones */}
          <div className={`rounded-2xl border ${src.border} ${src.bg} p-5 space-y-4`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${src.border}`}>
                <SrcIcon className={`h-5 w-5 ${src.color}`} />
              </div>
              <div>
                <p className="font-bold">{src.title}</p>
                <p className="text-xs text-muted-foreground">{src.subtitle}</p>
              </div>
              <button onClick={() => setStep("source")} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {src.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{s.emoji}</span>
                  <div className="flex-1">
                    <span className="text-sm leading-snug">{s.text}</span>
                  </div>
                  {i < src.steps.length - 1 && (
                    <span className="text-xs text-muted-foreground shrink-0 mt-0.5">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Zona de drop */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragging(false)
              startProcessing(Array.from(e.dataTransfer.files))
            }}
            className={`rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
              dragging ? "border-primary bg-primary/10 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
            onClick={() => zipRef.current?.click()}
          >
            <input ref={zipRef} type="file" accept=".zip,.pdf" multiple className="hidden"
              onChange={(e) => { if (e.target.files) startProcessing(Array.from(e.target.files)) }} />
            <input ref={folderRef} type="file" accept=".pdf" multiple className="hidden"
              // @ts-ignore
              webkitdirectory=""
              onChange={(e) => { if (e.target.files) startProcessing(Array.from(e.target.files)) }} />

            <div className="flex flex-col items-center gap-3">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${dragging ? "bg-primary/20" : "bg-muted"}`}>
                {dragging
                  ? <CheckCircle className="h-8 w-8 text-primary" />
                  : <FolderOpen className={`h-8 w-8 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
                }
              </div>
              <div>
                <p className="font-bold text-lg">{dragging ? "¡Suelta aquí!" : "Arrastra el archivo aquí"}</p>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Admite: carpeta ZIP de Google Drive · varios PDFs · carpeta del ordenador
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => zipRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl border-2 bg-card hover:bg-muted p-3 text-sm font-semibold transition-all hover:scale-[1.01]">
              <FileText className="h-4 w-4 text-primary" />
              Seleccionar ZIP o PDFs
            </button>
            <button onClick={() => folderRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl border-2 bg-card hover:bg-muted p-3 text-sm font-semibold transition-all hover:scale-[1.01]">
              <FolderOpen className="h-4 w-4 text-amber-500" />
              Seleccionar carpeta
            </button>
          </div>
        </div>
      )}

      {/* ── PROCESANDO ── */}
      {step === "processing" && (
        <div className="rounded-3xl border bg-card p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="font-bold text-xl">Leyendo {rows.length} factura{rows.length !== 1 ? "s" : ""}...</h2>
            <p className="text-muted-foreground text-sm">Extrayendo datos de cada PDF automáticamente</p>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
                {r.status === "reading" && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />}
                {r.status === "done" && <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                {r.status === "error" && <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                {r.status === "pending" && <div className="h-3.5 w-3.5 rounded-full border-2 border-border shrink-0" />}
                <span className="text-xs truncate flex-1">{r.file.name}</span>
                {r.total_amount && <span className="text-xs font-bold text-primary shrink-0">{fmt(r.total_amount)}</span>}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{rows.filter((r) => r.status === "done" || r.status === "error").length} de {rows.length} procesadas</span>
            </div>
            <div className="rounded-full bg-muted h-2.5 overflow-hidden">
              <div className="h-full bg-primary transition-all rounded-full"
                style={{ width: `${(rows.filter((r) => r.status !== "pending" && r.status !== "reading").length / rows.length) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── PULIENDO ── */}
      {step === "polishing" && (
        <div className="rounded-3xl border bg-card p-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-full bg-violet-100 dark:bg-violet-900/40 animate-pulse" />
              <Sparkles className="absolute inset-0 m-auto h-10 w-10 text-violet-500" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-xl">Puliendo los detalles...</h2>
            <p className="text-muted-foreground text-sm mt-1">Completando lo que falta en cada factura</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round((polishProgress / 100) * rows.length)} de {rows.length} revisadas</span>
              <span>{polishProgress}%</span>
            </div>
            <div className="rounded-full bg-muted h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all rounded-full"
                style={{ width: `${polishProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── REVISAR ── */}
      {step === "review" && (
        <div className="space-y-4">
          {/* Resumen facturas */}
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
            <div>
              <p className="font-bold">{readyCount} factura{readyCount !== 1 ? "s" : ""} listas para guardar</p>
              <p className="text-xs text-muted-foreground">
                {invoiceRows.filter((r) => r.status === "error").length > 0
                  ? `${invoiceRows.filter((r) => r.status === "error").length} no se pudieron leer — revísalas abajo`
                  : "Todo correcto. Pulsa guardar para añadirlas al sistema."}
              </p>
            </div>
            <Button onClick={saveAll} disabled={readyCount === 0}>
              Guardar todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Sección otros documentos */}
          {otherRows.length > 0 && (
            <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <Inbox className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-emerald-800 dark:text-emerald-200">Otros documentos detectados</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Estos documentos no son facturas de proveedor y se guardarán en <strong>Otros documentos</strong> dentro del apartado de Facturas.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                {otherRows.map((row) => (
                  <div key={row.id} className="flex flex-col gap-0.5 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/20 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs flex-1 truncate font-medium">{row.file.name}</span>
                    </div>
                    {row.detectionReason && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 pl-5">{row.detectionReason}</p>
                    )}
                  </div>
                ))}
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={saveOtherDocs}
              >
                <Inbox className="h-4 w-4 mr-2" />
                Guardar en Otros documentos
              </Button>
            </div>
          )}

          {/* Lista facturas */}
          <div className="space-y-2">
            {invoiceRows.map((row) => {
              const missingNum = !row.invoice_number
              const missingDate = !row.invoice_date
              const hasWarnings = missingNum || missingDate || !row.supplier_name
              return (
              <div key={row.id} className={[
                "rounded-2xl border overflow-hidden",
                row.status === "error" ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" :
                hasWarnings ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : "bg-card"
              ].join(" ")}>
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-black/5 transition-colors"
                  onClick={() => updateRow(row.id, { expanded: !row.expanded })}>
                  {row.status === "done" && !hasWarnings
                    ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    : <AlertCircle className={`h-4 w-4 shrink-0 ${hasWarnings ? "text-amber-500" : "text-orange-500"}`} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">
                        {row.supplier_name
                          ? row.supplier_name
                          : <span className="text-amber-700 dark:text-amber-400">⚠ Proveedor no detectado</span>}
                      </p>
                      {/* Enlace directo al PDF — abre en pestaña nueva */}
                      <a
                        href={URL.createObjectURL(row.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 text-[10px] font-bold text-primary hover:text-primary/70 underline underline-offset-2 transition-colors"
                      >
                        Ver PDF
                      </a>
                    </div>
                    <p className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className={missingNum ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}>
                        {missingNum ? "⚠ Nº no detectado" : row.invoice_number}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className={missingDate ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}>
                        {missingDate ? "⚠ Fecha no detectada" : row.invoice_date}
                      </span>
                      {row.error && <span className="text-orange-500">· {row.error}</span>}
                    </p>
                  </div>
                  {row.total_amount && <span className="text-sm font-bold text-primary shrink-0">{fmt(row.total_amount)}</span>}
                  {row.expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </div>

                {row.expanded && (
                  <div className="px-4 pb-4 pt-3 border-t bg-muted/10 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Proveedor</label>
                      <Select value={row.supplier_id ?? ""} onValueChange={(v) => { if (v) updateRow(row.id, { supplier_id: v as string }) }}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={row.supplier_name ?? "Seleccionar..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {!row.supplier_id && row.supplier_name && (
                        <p className="text-xs text-primary">Se creará: <strong>{row.supplier_name}</strong></p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Nº Factura</label>
                      <Input value={row.invoice_number ?? ""} onChange={(e) => updateRow(row.id, { invoice_number: e.target.value })} className="h-8 text-xs" placeholder="F-2024-001" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Fecha</label>
                      <Input type="date" value={row.invoice_date ?? ""} onChange={(e) => updateRow(row.id, { invoice_date: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Base imponible (€)</label>
                      <Input type="number" step="0.01" value={row.base_amount ?? ""} onChange={(e) => updateRow(row.id, { base_amount: parseFloat(e.target.value) })} className="h-8 text-xs" />
                    </div>
                    {row.rawText && (
                      <div className="col-span-2 space-y-1">
                        <details>
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">🔍 Ver texto extraído del PDF (debug)</summary>
                          <pre className="mt-1 text-[10px] bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">{row.rawText}</pre>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
            })}
          </div>

          <Button onClick={saveAll} className="w-full" size="lg" disabled={readyCount === 0}>
            Guardar {readyCount} factura{readyCount !== 1 ? "s" : ""} en Workie
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* ── GUARDANDO ── */}
      {step === "saving" && (
        <div className="rounded-3xl border bg-card p-10 text-center space-y-5">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <div>
            <h2 className="font-bold text-xl">Guardando facturas...</h2>
            <p className="text-muted-foreground text-sm mt-1">{savingProgress}% completado</p>
          </div>
          <div className="rounded-full bg-muted h-3 overflow-hidden">
            <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${savingProgress}%` }} />
          </div>
        </div>
      )}

      {/* ── LISTO ── */}
      {step === "done" && (
        <div className="rounded-3xl border bg-card p-10 text-center space-y-5">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-green-100 dark:bg-green-900/40">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-2xl">¡Todo listo!</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Tus facturas están organizadas en Workie.<br />El Modelo 303 ya refleja todos los datos.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild><Link href="/facturas">Ver facturas</Link></Button>
            <Button asChild><Link href="/facturas/modelo-303">Ver Modelo 303 →</Link></Button>
          </div>
        </div>
      )}
    </div>
  )
}
