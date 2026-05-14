"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createInvoice } from "@/lib/actions/invoices"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle, AlertCircle, RotateCcw, Plus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { NuevoProveedorModal } from "@/components/facturas/nuevo-proveedor-modal"
import { FileUploadZone } from "@/components/facturas/file-upload-zone"

const schema = z.object({
  supplier_id: z.string().min(1, "Selecciona un proveedor"),
  invoice_number: z.string().min(1, "Número de factura obligatorio"),
  invoice_date: z.string().min(1, "Fecha obligatoria"),
  base_amount: z.number().positive("Importe debe ser positivo"),
  vat_rate: z.number(),
  concept: z.string().optional(),
  is_deductible: z.boolean(),
})
type FormData = z.infer<typeof schema>

type Step = "upload" | "extracting" | "review"

interface Extracted {
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

const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)

export default function NuevaFacturaPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extracted, setExtracted] = useState<Extracted | null>(null)
  const [hasAI, setHasAI] = useState(true)
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [showProveedorModal, setShowProveedorModal] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState("")

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vat_rate: 10, is_deductible: true },
  })

  const baseAmount = watch("base_amount") ?? 0
  const vatRate = watch("vat_rate") ?? 10
  const vat = parseFloat((baseAmount * (vatRate / 100)).toFixed(2))
  const total = parseFloat((baseAmount + vat).toFixed(2))

  useEffect(() => {
    createClient().from("suppliers").select("id, name").order("name").then(({ data }) => setSuppliers(data ?? []))
  }, [])

  function handleSupplierCreated(s: { id: string; name: string }) {
    setSuppliers((prev) => [...prev, s].sort((a, b) => a.name.localeCompare(b.name)))
    setSelectedSupplierId(s.id)
    setValue("supplier_id", s.id)
  }

  async function handleFileReady(file: File | null) {
    setUploadedFile(file)
    if (!file) return

    setStep("extracting")

    try {
      const fd = new FormData()
      fd.append("file", file)
      const resp = await fetch("/api/extract-invoice", { method: "POST", body: fd })
      const json = await resp.json()

      if (json.error === "no_api_key") {
        setHasAI(false)
        setStep("review")
        return
      }

      if (json.success && json.data) {
        const d = json.data as Extracted
        setExtracted(d)

        // Rellenar el formulario automáticamente
        if (d.invoice_number) setValue("invoice_number", d.invoice_number)
        if (d.invoice_date) setValue("invoice_date", d.invoice_date)
        if (d.base_amount) setValue("base_amount", d.base_amount)
        if (d.vat_rate) setValue("vat_rate", d.vat_rate)
        if (d.concept) setValue("concept", d.concept)

        // Buscar el proveedor existente o marcarlo como nuevo
        if (d.supplier_name) {
          const found = suppliers.find((s) =>
            s.name.toLowerCase().includes(d.supplier_name!.toLowerCase()) ||
            d.supplier_name!.toLowerCase().includes(s.name.toLowerCase())
          )
          if (found) {
            setSelectedSupplierId(found.id)
            setValue("supplier_id", found.id)
          }
        }
        setStep("review")
      } else {
        toast.error("No se pudo leer la factura automáticamente. Rellena los datos a mano.")
        setStep("review")
      }
    } catch {
      toast.error("Error al procesar la factura.")
      setStep("review")
    }
  }

  async function onSubmit(data: FormData) {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== "") fd.append(k, String(v)) })
    if (uploadedFile) fd.append("file", uploadedFile)

    const result = await createInvoice(fd)
    if (result?.error) { toast.error(result.error); return }
    toast.success("¡Factura registrada correctamente!")
    router.push("/facturas")
  }

  return (
    <>
      {showProveedorModal && (
        <NuevoProveedorModal onCreated={handleSupplierCreated} onClose={() => setShowProveedorModal(false)} />
      )}

      <div className="max-w-xl mx-auto space-y-6">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/facturas"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nueva factura</h1>
            <p className="text-muted-foreground text-sm">Sube la factura y la IA rellena todo</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {[
            { id: "upload", label: "1. Subir" },
            { id: "extracting", label: "2. IA lee" },
            { id: "review", label: "3. Revisar" },
          ].map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                step === s.id
                  ? "bg-primary text-primary-foreground"
                  : ["upload", "extracting", "review"].indexOf(step) > i
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {["upload", "extracting", "review"].indexOf(step) > i
                  ? <CheckCircle className="h-3 w-3" />
                  : <span>{i + 1}</span>
                }
                {s.label.split(". ")[1]}
              </div>
              {i < 2 && <div className="h-px w-4 bg-border" />}
            </div>
          ))}
        </div>

        {/* ── PASO 1: SUBIR ── */}
        {step === "upload" && (
          <div className="rounded-3xl border bg-card p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h2 className="font-bold text-lg">Sube tu factura</h2>
              <p className="text-muted-foreground text-sm">
                La IA leerá el PDF o la foto y rellenará todos los campos automáticamente.<br />
                Solo tendrás que revisar y confirmar.
              </p>
            </div>
            <FileUploadZone onFileReady={handleFileReady} />
            <button
              type="button"
              onClick={() => setStep("review")}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Prefiero rellenar a mano →
            </button>
          </div>
        )}

        {/* ── PASO 2: EXTRAYENDO ── */}
        {step === "extracting" && (
          <div className="rounded-3xl border bg-card p-10 text-center space-y-5">
            <div className="flex justify-center">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-primary/40 animate-spin" style={{ animationDuration: "2s" }} />
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-lg">La IA está leyendo tu factura...</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Extrayendo proveedor, importes, IVA y fecha automáticamente.
              </p>
            </div>
          </div>
        )}

        {/* ── PASO 3: REVISAR ── */}
        {step === "review" && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Banner IA */}
            {extracted && hasAI && (
              <div className="rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary">¡La IA ha rellenado los datos!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Revisa que todo sea correcto antes de guardar.</p>
                </div>
                <button type="button" onClick={() => setStep("upload")} className="ml-auto text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            )}

            {!hasAI && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  La extracción automática no está activada aún. Rellena los datos manualmente.{" "}
                  <span className="font-semibold">Añade tu clave de Anthropic para activar la IA.</span>
                </p>
              </div>
            )}

            {/* Datos extraídos del proveedor (info) */}
            {extracted?.supplier_name && (
              <div className="rounded-2xl bg-muted/40 border px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos detectados del emisor</p>
                <p className="text-sm font-semibold">{extracted.supplier_name}</p>
                {extracted.supplier_nif && <p className="text-xs text-muted-foreground font-mono">NIF: {extracted.supplier_nif}</p>}
              </div>
            )}

            <div className="rounded-2xl border bg-card p-5 space-y-4">

              {/* Proveedor */}
              <div className="space-y-1.5">
                <Label>Proveedor *</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedSupplierId}
                    onValueChange={(v) => { if (v) { setSelectedSupplierId(v as string); setValue("supplier_id", v as string) } }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={extracted?.supplier_name ? `Buscar "${extracted.supplier_name}"...` : "Selecciona un proveedor..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowProveedorModal(true)} className="gap-1.5 shrink-0">
                    <Plus className="h-3.5 w-3.5" />
                    Nuevo
                  </Button>
                </div>
                {errors.supplier_id && <p className="text-destructive text-xs">{errors.supplier_id.message}</p>}
              </div>

              {/* Nº y fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invoice_number">Nº factura *</Label>
                  <Input id="invoice_number" placeholder="F-2024-001" {...register("invoice_number")} />
                  {errors.invoice_number && <p className="text-destructive text-xs">{errors.invoice_number.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invoice_date">Fecha *</Label>
                  <Input id="invoice_date" type="date" {...register("invoice_date")} />
                  {errors.invoice_date && <p className="text-destructive text-xs">{errors.invoice_date.message}</p>}
                </div>
              </div>

              {/* Importes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="base_amount">Base imponible (€) *</Label>
                  <Input id="base_amount" type="number" step="0.01" {...register("base_amount", { valueAsNumber: true })} />
                  {errors.base_amount && <p className="text-destructive text-xs">{errors.base_amount.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>IVA *</Label>
                  <Select
                    defaultValue={String(extracted?.vat_rate ?? 10)}
                    value={String(vatRate)}
                    onValueChange={(v) => { if (v) setValue("vat_rate", parseFloat(v as string)) }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% — Exento</SelectItem>
                      <SelectItem value="4">4% — Superreducido</SelectItem>
                      <SelectItem value="10">10% — Hostelería ✓</SelectItem>
                      <SelectItem value="21">21% — General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resumen importes */}
              {baseAmount > 0 && (
                <div className="rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/15 p-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Base</p>
                    <p className="font-bold text-sm">{fmt(baseAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IVA {vatRate}%</p>
                    <p className="font-bold text-sm">{fmt(vat)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold text-base text-primary">{fmt(total)}</p>
                  </div>
                </div>
              )}

              {/* Concepto */}
              <div className="space-y-1.5">
                <Label htmlFor="concept">Concepto</Label>
                <Textarea id="concept" placeholder="Ej: Compra de productos alimenticios" {...register("concept")} />
              </div>

              {/* Deducible */}
              <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 px-4 py-3">
                <Checkbox id="is_deductible" defaultChecked onCheckedChange={(v) => setValue("is_deductible", !!v)} />
                <div>
                  <Label htmlFor="is_deductible" className="font-semibold text-green-800 dark:text-green-300 cursor-pointer">IVA deducible</Label>
                  <p className="text-xs text-green-600 dark:text-green-400">Se incluirá en el cálculo del Modelo 303</p>
                </div>
              </div>

              {/* Archivo adjunto */}
              {!uploadedFile && (
                <div className="space-y-1.5">
                  <Label>Adjuntar factura (opcional)</Label>
                  <FileUploadZone onFileReady={setUploadedFile} />
                </div>
              )}
              {uploadedFile && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-xl bg-muted/50 px-3 py-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{uploadedFile.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("upload")}>
                <ArrowLeft className="h-4 w-4 mr-2" />Volver
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar factura"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
