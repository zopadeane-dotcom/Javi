"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createSupplierSheet } from "@/lib/actions/sanidad"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NuevaFichaProveedorPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierId, setSupplierId] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createClient().from("suppliers").select("id, name").order("name")
      .then(({ data }) => setSuppliers(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("supplier_id", supplierId)
    const result = await createSupplierSheet(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Ficha de proveedor creada")
      router.push("/sanidad/proveedores")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sanidad/proveedores"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva ficha de proveedor</h1>
          <p className="text-muted-foreground text-sm">Registro sanitario y homologación</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Datos sanitarios</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Proveedor *</Label>
              <div className="flex gap-2">
                <Select onValueChange={(v) => { if (v) setSupplierId(v as string) }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecciona un proveedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href="/facturas/proveedor/nuevo">+ Nuevo</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="rgseaa_number">Nº Registro Sanitario (RGSEAA)</Label>
              <Input id="rgseaa_number" name="rgseaa_number" placeholder="Ej: 26.03555/CO" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplied_products">Productos suministrados</Label>
              <Textarea id="supplied_products" name="supplied_products" placeholder="Ej: Carnes frescas, embutidos, lácteos..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="last_audit_date">Fecha última auditoría</Label>
                <Input id="last_audit_date" name="last_audit_date" type="date" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="next_audit_date">Próxima auditoría</Label>
                <Input id="next_audit_date" name="next_audit_date" type="date" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" placeholder="Observaciones adicionales..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/sanidad/proveedores">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading || !supplierId}>
            {loading ? "Guardando..." : "Guardar ficha"}
          </Button>
        </div>
      </form>
    </div>
  )
}
