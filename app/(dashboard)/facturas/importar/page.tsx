"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { createInvoice, createSupplier } from "@/lib/actions/invoices"
import {
  FolderOpen, Upload, CheckCircle, AlertCircle, Loader2,
  ArrowLeft, ArrowRight, FileText, Trash2, ChevronDown, ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

type FileStatus = "pending" | "reading" | "done" | "error"

interface InvoiceRow {
  id: string
  file: File
  status: FileStatus
  error?: string
  // Extraídos
  supplier_name?: string
  supplier_nif?: string
  invoice_number?: string
  invoice_date?: string
  base_amount?: number
  vat_rate?: number
  total_amount?: number
  concept?: string
  // Para el formulario
  supplier_id?: string
  saved?: boolean
  expanded?: boolean
}

type Step = "drop" | "processing" | "review" | "saving" | "done"

const fmt = (n?: number) => n != null ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n) : "—"

export default function ImportarFacturasPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("drop")
  const [rows, setRows] = useState<InvoiceRow[]>([])
  const [dragging, setDragging] = useState(false)
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [savingProgress, setSavingProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    createClient().from("suppliers").select("id, name").order("name").then(({ data }) => setSuppliers(data ?? []))
  }, [])

  function addFiles(files: File[]) {
    const pdfs = files.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
    if (pdfs.length === 0) { toast.error("Solo se admiten archivos PDF"); return }
    const newRows: InvoiceRow[] = pdfs.map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      status: "pending",
    }))
    setRows(newRows)
    processAll(newRows)
  }

  async function processAll(initial: InvoiceRow[]) {
    setStep("processing")
    const updated = [...initial]

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
          // Intentar encontrar proveedor existente
          let supplier_id: string | undefined
          if (d.supplier_name && suppliers.length > 0) {
            const found = suppliers.find((s) =>
              s.name.toLowerCase().includes((d.supplier_name ?? "").toLowerCase().split(" ")[0]) ||
              (d.supplier_name ?? "").toLowerCase().includes(s.name.toLowerCase().split(" ")[0])
            )
            if (found) supplier_id = found.id
          }

          updated[i] = {
            ...updated[i],
            status: "done",
            supplier_name: d.supplier_name,
            supplier_nif: d.supplier_nif,
            invoice_number: d.invoice_number,
            invoice_date: d.invoice_date,
            base_amount: d.base_amount,
            vat_rate: d.vat_rate ?? 10,
            total_amount: d.total_amount,
            concept: d.concept,
            supplier_id,
          }
        } else {
          updated[i] = { ...updated[i], status: json.scanned ? "error" : "done", error: json.scanned ? "PDF escaneado — rellenar a mano" : undefined }
        }
      } catch {
        updated[i] = { ...updated[i], status: "error", error: "Error al leer el archivo" }
      }

      setRows([...updated])
      await new Promise((r) => setTimeout(r, 80))
    }

    setStep("review")
  }

  const updateRow = useCallback((id: string, changes: Partial<InvoiceRow>) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, ...changes } : r))
  }, [])

  async function saveAll() {
    setStep("saving")
    let saved = 0

    for (const row of rows) {
      if (row.saved) continue

      try {
        // Si no tiene proveedor asignado pero sí nombre, crearlo automáticamente
        let supplierId = row.supplier_id
        if (!supplierId && row.supplier_name) {
          const fd = new FormData()
          fd.append("name", row.supplier_name)
          if (row.supplier_nif) fd.append("nif", row.supplier_nif)
          const res = await createSupplier(fd)
          if (res?.id) {
            supplierId = res.id as string
            setSuppliers((prev) => [...prev, { id: supplierId!, name: row.supplier_name! }])
          }
        }

        if (!supplierId || !row.invoice_number || !row.invoice_date || !row.base_amount) continue

        const fd = new FormData()
        fd.append("supplier_id", supplierId)
        fd.append("invoice_number", row.invoice_number)
        fd.append("invoice_date", row.invoice_date)
        fd.append("base_amount", String(row.base_amount))
        fd.append("vat_rate", String(row.vat_rate ?? 10))
        if (row.concept) fd.append("concept", row.concept)
        fd.append("is_deductible", "true")
        fd.append("file", row.file)

        await createInvoice(fd)
        updateRow(row.id, { saved: true })
        saved++
      } catch { /* continúa con la siguiente */ }

      setSavingProgress(Math.round((saved / rows.length) * 100))
    }

    setStep("done")
    toast.success(`¡${saved} factura${saved !== 1 ? "s" : ""} importada${saved !== 1 ? "s" : ""} correctamente!`)
  }

  const doneCount = rows.filter((r) => r.status === "done").length
  const readyToSave = rows.filter((r) => r.status === "done" && r.invoice_number && r.invoice_date && r.base_amount && (r.supplier_id || r.supplier_name)).length

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/facturas"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Importar carpeta de facturas</h1>
          <p className="text-muted-foreground text-sm">Sube todas tus facturas de una vez — las leemos y organizamos automáticamente</p>
        </div>
      </div>

      {/* ── PASO 1: SOLTAR ARCHIVOS ── */}
      {step === "drop" && (
        <div className="space-y-4">
          {/* Zona principal */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const files = Array.from(e.dataTransfer.files)
              addFiles(files)
            }}
            className={`rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-200 cursor-pointer ${
              dragging ? "border-primary bg-primary/10 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
            onClick={() => folderRef.current?.click()}
          >
            <input
              ref={folderRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              // @ts-ignore
              webkitdirectory=""
              onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
            />
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
            />

            <div className="flex flex-col items-center gap-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-3xl transition-colors ${
                dragging ? "bg-primary/20" : "bg-muted"
              }`}>
                <FolderOpen className={`h-10 w-10 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-bold text-xl">{dragging ? "¡Suelta aquí!" : "Arrastra tu carpeta de facturas"}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  O haz click para seleccionar todos los PDFs
                </p>
              </div>
            </div>
          </div>

          {/* Opciones */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => folderRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 bg-card hover:bg-muted transition-all p-4 text-sm font-semibold hover:scale-[1.01]"
            >
              <FolderOpen className="h-5 w-5 text-amber-500" />
              Seleccionar carpeta completa
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 bg-card hover:bg-muted transition-all p-4 text-sm font-semibold hover:scale-[1.01]"
            >
              <Upload className="h-5 w-5 text-primary" />
              Seleccionar varios PDFs
            </button>
          </div>

          {/* Info */}
          <div className="rounded-2xl bg-muted/40 border p-4 space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">¿Cómo funciona?</p>
            <div className="space-y-1.5">
              {[
                "Selecciona la carpeta donde tienes guardadas tus facturas de proveedores",
                "Workie lee cada PDF automáticamente y extrae todos los datos",
                "Revisas los resultados de un vistazo y confirmas con un click",
                "El Modelo 303 se calcula solo con todos los datos importados",
              ].map((t, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold mt-0.5">{i + 1}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 2: PROCESANDO ── */}
      {step === "processing" && (
        <div className="rounded-3xl border bg-card p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              </div>
            </div>
            <h2 className="font-bold text-xl">Leyendo {rows.length} factura{rows.length !== 1 ? "s" : ""}...</h2>
            <p className="text-muted-foreground text-sm">Extrayendo datos de cada PDF automáticamente</p>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
                {r.status === "reading" && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
                {r.status === "done" && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                {r.status === "error" && <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />}
                {r.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-border shrink-0" />}
                <span className="text-sm truncate flex-1">{r.file.name}</span>
                {r.status === "done" && r.total_amount && (
                  <span className="text-xs font-semibold text-primary shrink-0">{fmt(r.total_amount)}</span>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-full bg-muted h-2 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(rows.filter((r) => r.status !== "pending" && r.status !== "reading").length / rows.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── PASO 3: REVISAR ── */}
      {step === "review" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{doneCount} de {rows.length} facturas leídas correctamente</p>
              <p className="text-xs text-muted-foreground">{readyToSave} listas para guardar</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setRows([]); setStep("drop") }}>
                Volver a empezar
              </Button>
              <Button onClick={saveAll} disabled={readyToSave === 0}>
                Guardar {readyToSave} factura{readyToSave !== 1 ? "s" : ""}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className={`rounded-2xl border overflow-hidden transition-all ${
                row.status === "error" ? "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20" : "bg-card"
              }`}>
                {/* Fila resumen */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => updateRow(row.id, { expanded: !row.expanded })}
                >
                  {row.status === "done"
                    ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    : <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {row.supplier_name ?? row.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.invoice_number ?? "Nº no detectado"} · {row.invoice_date ?? "Fecha no detectada"}
                    </p>
                  </div>
                  {row.total_amount && (
                    <span className="text-sm font-bold text-primary shrink-0">{fmt(row.total_amount)}</span>
                  )}
                  {row.expanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                </div>

                {/* Detalle expandible */}
                {row.expanded && (
                  <div className="px-4 pb-4 border-t bg-muted/20 pt-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Proveedor</label>
                      <div className="flex gap-2">
                        <Select
                          value={row.supplier_id ?? ""}
                          onValueChange={(v) => { if (v) updateRow(row.id, { supplier_id: v as string }) }}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue placeholder={row.supplier_name ?? "Seleccionar..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {!row.supplier_id && row.supplier_name && (
                        <p className="text-xs text-primary">Se creará automáticamente: <strong>{row.supplier_name}</strong></p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Nº Factura</label>
                      <Input
                        value={row.invoice_number ?? ""}
                        onChange={(e) => updateRow(row.id, { invoice_number: e.target.value })}
                        className="h-8 text-xs"
                        placeholder="F-2024-001"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Fecha</label>
                      <Input
                        type="date"
                        value={row.invoice_date ?? ""}
                        onChange={(e) => updateRow(row.id, { invoice_date: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Base imponible</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={row.base_amount ?? ""}
                        onChange={(e) => updateRow(row.id, { base_amount: parseFloat(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                    {row.error && (
                      <div className="col-span-2 text-xs text-orange-600">{row.error}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button onClick={saveAll} className="w-full" disabled={readyToSave === 0} size="lg">
            Guardar {readyToSave} factura{readyToSave !== 1 ? "s" : ""} en Workie
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
            <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${savingProgress}%` }} />
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
            <h2 className="font-bold text-xl">¡Todo importado!</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Tus facturas están en Workie. El Modelo 303 ya refleja los nuevos datos.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/facturas">Ver facturas</Link>
            </Button>
            <Button asChild>
              <Link href="/facturas/modelo-303">Ver Modelo 303</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
