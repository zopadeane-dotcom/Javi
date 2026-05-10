"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createFoodHandlerCertificate } from "@/lib/actions/sanidad"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Award } from "lucide-react"
import Link from "next/link"

export default function NuevoCertificadoPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<any[]>([])
  const [employeeId, setEmployeeId] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createClient().from("employees").select("id, full_name, position").eq("is_active", true).order("full_name")
      .then(({ data }) => setEmployees(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("employee_id", employeeId)
    const result = await createFoodHandlerCertificate(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Certificado registrado correctamente")
      router.push("/sanidad/manipuladores")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sanidad/manipuladores"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Añadir certificado</h1>
          <p className="text-muted-foreground text-sm">Certificado de manipulador de alimentos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Datos del certificado</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Trabajador *</Label>
              <Select onValueChange={(v) => { if (v) setEmployeeId(v as string) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un trabajador..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name} · {e.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="certificate_number">Número de certificado</Label>
              <Input id="certificate_number" name="certificate_number" placeholder="Ej: CM-2024-001234" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="obtained_date">Fecha de obtención *</Label>
                <Input id="obtained_date" name="obtained_date" type="date" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="expiry_date">Fecha de caducidad</Label>
                <Input id="expiry_date" name="expiry_date" type="date" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="file">Adjuntar certificado (PDF o imagen)</Label>
              <Input id="file" name="file" type="file" accept="application/pdf,image/*" />
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              Los certificados de manipulador de alimentos son obligatorios para todo el personal que
              manipule alimentos directamente. Guarda una copia física en el local.
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/sanidad/manipuladores">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading || !employeeId}>
            {loading ? "Guardando..." : "Guardar certificado"}
          </Button>
        </div>
      </form>
    </div>
  )
}
