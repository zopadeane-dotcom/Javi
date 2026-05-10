"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { inviteEmployee } from "@/lib/actions/invite"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Smartphone, Key } from "lucide-react"
import Link from "next/link"

export default function InvitarTrabajadorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createClient().from("employees").select("*").eq("id", id).single()
      .then(({ data }) => setEmployee(data))
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("employee_id", id)
    fd.set("full_name", employee?.full_name ?? "")
    const result = await inviteEmployee(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Cuenta creada. El trabajador ya puede iniciar sesión.")
      router.push(`/trabajadores/${id}`)
    }
    setLoading(false)
  }

  if (!employee) return null

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/trabajadores/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Invitar a la app</h1>
          <p className="text-muted-foreground text-sm">{employee.full_name}</p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">¿Para qué sirve esto?</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Al crear una cuenta, <strong>{employee.full_name}</strong> podrá entrar a Workie
          con su móvil para fichar la entrada y salida, y consultar sus horas trabajadas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Credenciales de acceso</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email del trabajador *</Label>
              <Input id="email" name="email" type="email" placeholder="trabajador@email.com" required />
              <p className="text-xs text-muted-foreground">Usará este email para iniciar sesión</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña temporal *</Label>
              <Input id="password" name="password" type="text" placeholder="Mínimo 6 caracteres"
                minLength={6} required />
              <p className="text-xs text-muted-foreground">
                Dísela al trabajador. Podrá cambiarla después.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/trabajadores/${id}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </div>
      </form>
    </div>
  )
}
