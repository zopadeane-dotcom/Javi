"use client"

import { useState } from "react"
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
import {
  ArrowLeft, ArrowRight, CheckCircle, RotateCcw,
  FileText, Image as ImageIcon, AlertCircle, Loader2,
} from "lucide-react"
import Link from "next/link"
import { FileUploadZone } from "@/components/facturas/file-upload-zone"

const schema = z.object({
  invoice_number: z.string().min(1, "Número de factura obligatorio"),
  invoice_date: z.string().min(1, "Fecha obligatoria"),
  base_amount: z.number().positive("Importe debe ser positivo"),
  vat_rate: z.number(),
  concept: z.string().optional(),
  is_deductible: z.boolean(),
})
type FormData = z.infer<typeof schema>
type Step = "upload" | "reading" | "review"

const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)

export default function NuevaFacturaPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isImage, setIsImage] = useState(false)
  const [isScanned, setIsScanned] = useState(false)
  const [fieldsFound, setFieldsFound] = useState(0)
  const [debugText, setDebugText] = useState<string | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vat_rate: 10, is_deductible: true },
  })

  const baseAmount = watch("base_amount") ?? 0
  const vatRate = watch("vat_rate") ?? 10
  const vat = parseFloat((baseAmount * (vatRate / 100)).toFixed(2))
  const total = parseFloat((baseAmount + vat).toFixed(2))

  async function handleFileReady(file: File | null) {
    setUploadedFile(file)
    if (!file) return

    const isImg = file.type.startsWith("image/")
    setIsImage(isImg)

    if (isImg) {
      setImagePreview(URL.createObjectURL(file))
    }

    setStep("reading")

    try {
      const fd = new FormData()
      fd.append("file", file)
      const resp = await fetch("/api/extract-invoice", { method: "POST", body: fd })
      const json = await resp.json()

      if (json.rawText) setDebugText(json.rawText)

      if (json.success) {
        const d = json.data
        let found = 0

        if (d.invoice_number) { setValue("invoice_number", d.invoice_number); found++ }
        if (d.invoice_date) { setValue("invoice_date", d.invoice_date); found++ }
        if (d.base_amount) { setValue("base_amount", d.base_amount); found++ }
        if (d.vat_rate) { setValue("vat_rate", d.vat_rate); found++ }
        if (d.concept) { setValue("concept", d.concept); found++ }

        setFieldsFound(found)
        setIsScanned(json.scanned ?? false)
      }
    } catch {
      // Si falla la extracción, seguimos con el formulario manual
    }

    setStep("review")
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

  const steps = [
    { id: "upload", label: "Subir" },
    { id: "reading", label: "Leyendo" },
    { id: "review", label: "Revisar" },
  ]
  const currentIdx = steps.findIndex((s) => s.id === step)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/facturas"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva factura</h1>
          <p className="text-muted-foreground text-sm">Sube el PDF y rellenamos los datos solos</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              step === s.id ? "bg-primary text-primary-foreground"
              : currentIdx > i ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
            }`}>
              {currentIdx > i ? <CheckCircle className="h-3 w-3" /> : <span>{i + 1}</span>}
              {s.label}
            </div>
            {i < steps.length - 1 && <div className="h-px w-4 bg-border" />}
          </div>
        ))}
      </div>

      {/* ── PASO 1: SUBIR ── */}
      {step === "upload" && (
        <div className="rounded-3xl border bg-card p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <FileText className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h2 className="font-bold text-lg">Sube la factura</h2>
            <p className="text-muted-foreground text-sm">
              Si es un PDF digital, leemos los datos automáticamente.<br />
              Si es una foto, te mostramos la imagen al lado para que lo copies fácilmente.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 px-3 py-2.5">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-green-800 dark:text-green-300 font-medium">PDF digital → automático</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 px-3 py-2.5">
              <ImageIcon className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="text-blue-800 dark:text-blue-300 font-medium">Foto → imagen al lado</span>
            </div>
          </div>

          <FileUploadZone onFileReady={handleFileReady} />

          <button
            type="button"
            onClick={() => setStep("review")}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Sin archivo, rellenar a mano →
          </button>
        </div>
      )}

      {/* ── PASO 2: LEYENDO ── */}
      {step === "reading" && (
        <div className="rounded-3xl border bg-card p-10 text-center space-y-5">
          <div className="flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
              <Loader2 className="h-9 w-9 text-primary animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-lg">Leyendo la factura...</h2>
            <p className="text-muted-foreground text-sm mt-1">Extrayendo importes, IVA y fecha.</p>
          </div>
        </div>
      )}

      {/* ── PASO 3: REVISAR ── */}
      {step === "review" && (
        <div className={`grid gap-6 ${isImage && imagePreview ? "lg:grid-cols-2" : "grid-cols-1"}`}>

          {isImage && imagePreview && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">📄 Tu factura</p>
              <div className="rounded-2xl border overflow-hidden bg-muted sticky top-4">
                <img src={imagePreview} alt="Factura" className="w-full object-contain max-h-[600px]" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Banner resultado */}
            {uploadedFile && !isImage && (
              <div className={`rounded-2xl px-4 py-3 flex items-start gap-3 ${
                fieldsFound >= 3
                  ? "bg-primary/5 border border-primary/20"
                  : isScanned
                  ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40"
                  : "bg-muted/50 border"
              }`}>
                {fieldsFound >= 3
                  ? <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  : <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                }
                <div className="flex-1">
                  {fieldsFound >= 3 && (
                    <>
                      <p className="text-sm font-semibold text-primary">
                        ¡{fieldsFound} campo{fieldsFound > 1 ? "s" : ""} rellenado{fieldsFound > 1 ? "s" : ""} automáticamente!
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Revisa que todo sea correcto.</p>
                    </>
                  )}
                  {isScanned && (
                    <>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">PDF escaneado (imagen)</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">No se puede leer el texto automáticamente. Rellena los datos manualmente.</p>
                    </>
                  )}
                  {!isScanned && fieldsFound < 3 && fieldsFound > 0 && (
                    <>
                      <p className="text-sm font-semibold">Datos parcialmente extraídos</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Revisa y completa los campos que faltan.</p>
                    </>
                  )}
                  {fieldsFound === 0 && !isScanned && (
                    <p className="text-sm font-semibold">No se encontraron datos automáticamente</p>
                  )}
                </div>
                <button type="button" onClick={() => setStep("upload")} className="text-muted-foreground hover:text-foreground shrink-0">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            )}

            {isImage && imagePreview && (
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 px-4 py-3 flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Mira la imagen</strong> de la izquierda y copia los datos aquí.
                </p>
              </div>
            )}

            <div className="rounded-2xl border bg-card p-5 space-y-4">

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
                  <Input id="base_amount" type="number" step="0.01" placeholder="0.00" {...register("base_amount", { valueAsNumber: true })} />
                  {errors.base_amount && <p className="text-destructive text-xs">{errors.base_amount.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>IVA *</Label>
                  <Select value={String(vatRate)} onValueChange={(v) => { if (v) setValue("vat_rate", parseFloat(v)) }}>
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

              {/* Resumen */}
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
                  <p className="text-xs text-green-600 dark:text-green-400">Se incluirá en el Modelo 303</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("upload")}>
                <ArrowLeft className="h-4 w-4 mr-1" />Volver
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar factura"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
