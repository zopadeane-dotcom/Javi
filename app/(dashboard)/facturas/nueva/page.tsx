"use client"

import { useState, useEffect, useRef } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus } from "lucide-react"
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

export default function NuevaFacturaPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [preview, setPreview] = useState({ vat: 0, total: 0 })
  const [showProveedorModal, setShowProveedorModal] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vat_rate: 10, is_deductible: true },
  })

  const baseAmount = watch("base_amount")
  const vatRate = watch("vat_rate")

  useEffect(() => {
    if (baseAmount && vatRate !== undefined) {
      const vat = parseFloat((baseAmount * (vatRate / 100)).toFixed(2))
      setPreview({ vat, total: parseFloat((baseAmount + vat).toFixed(2)) })
    }
  }, [baseAmount, vatRate])

  function loadSuppliers() {
    const supabase = createClient()
    supabase.from("suppliers").select("id, name").order("name").then(({ data }) => {
      setSuppliers(data ?? [])
    })
  }

  useEffect(() => { loadSuppliers() }, [])

  function handleSupplierCreated(s: { id: string; name: string }) {
    setSuppliers((prev) => [...prev, s].sort((a, b) => a.name.localeCompare(b.name)))
    setSelectedSupplierId(s.id)
    setValue("supplier_id", s.id)
  }

  async function onSubmit(data: FormData) {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== "") fd.append(k, String(v))
    })
    if (uploadedFile) fd.append("file", uploadedFile)

    const result = await createInvoice(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Factura registrada correctamente")
      router.push("/facturas")
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)

  return (
    <>
      {showProveedorModal && (
        <NuevoProveedorModal
          onCreated={handleSupplierCreated}
          onClose={() => setShowProveedorModal(false)}
        />
      )}

      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/facturas"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nueva factura</h1>
            <p className="text-muted-foreground text-sm">Registra una factura de proveedor</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader><CardTitle className="text-base">Datos de la factura</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Proveedor */}
              <div className="space-y-1 md:col-span-2">
                <Label>Proveedor *</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedSupplierId}
                    onValueChange={(v) => { if (v) { setSelectedSupplierId(v as string); setValue("supplier_id", v as string) } }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecciona un proveedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProveedorModal(true)}
                    className="gap-1.5 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nuevo
                  </Button>
                </div>
                {errors.supplier_id && <p className="text-destructive text-sm">{errors.supplier_id.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="invoice_number">Nº de factura *</Label>
                <Input id="invoice_number" placeholder="F-2024-001" {...register("invoice_number")} />
                {errors.invoice_number && <p className="text-destructive text-sm">{errors.invoice_number.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoice_date">Fecha de factura *</Label>
                <Input id="invoice_date" type="date" {...register("invoice_date")} />
                {errors.invoice_date && <p className="text-destructive text-sm">{errors.invoice_date.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="base_amount">Base imponible (€) *</Label>
                <Input id="base_amount" type="number" step="0.01" {...register("base_amount", { valueAsNumber: true })} />
                {errors.base_amount && <p className="text-destructive text-sm">{errors.base_amount.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Tipo de IVA *</Label>
                <Select defaultValue="10" onValueChange={(v) => { if (v) setValue("vat_rate", parseFloat(v as string)) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Exento)</SelectItem>
                    <SelectItem value="4">4% (Superreducido)</SelectItem>
                    <SelectItem value="10">10% (Reducido hostelería)</SelectItem>
                    <SelectItem value="21">21% (General)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {baseAmount > 0 && (
                <div className="md:col-span-2 rounded-xl bg-muted p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA ({vatRate}%)</span>
                    <span>{fmt(preview.vat)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{fmt(preview.total)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="concept">Concepto</Label>
                <Textarea id="concept" placeholder="Descripción del gasto..." {...register("concept")} />
              </div>

              <div className="flex items-center gap-2 md:col-span-2">
                <Checkbox id="is_deductible" defaultChecked onCheckedChange={(v) => setValue("is_deductible", !!v)} />
                <Label htmlFor="is_deductible">IVA deducible (para Modelo 303)</Label>
              </div>

              {/* Zona de subida mejorada */}
              <div className="space-y-1.5 md:col-span-2">
                <Label>Adjuntar factura</Label>
                <FileUploadZone onFileReady={setUploadedFile} />
              </div>

            </CardContent>
          </Card>

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/facturas">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Registrar factura"}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
