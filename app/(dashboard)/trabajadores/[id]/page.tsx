"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { updateEmployee, deactivateEmployee } from "@/lib/actions/employees"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, UserX, Smartphone } from "lucide-react"
import Link from "next/link"
import { format, differenceInMinutes } from "date-fns"
import { es } from "date-fns/locale"

const schema = z.object({
  full_name: z.string().min(2),
  dni: z.string().length(9),
  social_security_number: z.string().optional(),
  position: z.string().min(1),
  contract_type: z.enum(["indefinido", "temporal", "formacion", "practicas", "obra_servicio"]),
  start_date: z.string(),
  end_date: z.string().optional(),
  weekly_hours: z.number().min(1).max(60),
  hourly_rate: z.number().optional(),
})

type FormData = z.infer<typeof schema>

const contractLabels: Record<string, string> = {
  indefinido: "Indefinido", temporal: "Temporal", formacion: "Formación",
  practicas: "Prácticas", obra_servicio: "Obra/Servicio",
}

export default function EmpleadoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [employee, setEmployee] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from("employees").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setEmployee(data)
        reset({
          full_name: data.full_name,
          dni: data.dni,
          social_security_number: data.social_security_number ?? "",
          position: data.position,
          contract_type: data.contract_type,
          start_date: data.start_date,
          end_date: data.end_date ?? "",
          weekly_hours: data.weekly_hours,
          hourly_rate: data.hourly_rate ?? undefined,
        })
      }
    })
    supabase.from("time_records").select("*").eq("employee_id", id)
      .order("date", { ascending: false }).limit(30).then(({ data }) => setRecords(data ?? []))
  }, [id, reset])

  async function onSubmit(data: FormData) {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== "") fd.append(k, String(v)) })
    const result = await updateEmployee(id, fd)
    if (result?.error) toast.error(result.error)
    else toast.success("Datos actualizados")
  }

  async function handleDeactivate() {
    if (!confirm("¿Dar de baja a este trabajador?")) return
    setLoading(true)
    const result = await deactivateEmployee(id)
    if (result?.error) toast.error(result.error)
    else { toast.success("Trabajador dado de baja"); router.push("/trabajadores") }
    setLoading(false)
  }

  function calcHours(checkIn: string, checkOut: string | null) {
    if (!checkOut) return "En turno"
    const mins = differenceInMinutes(new Date(checkOut), new Date(checkIn))
    return `${Math.floor(mins / 60)}h ${mins % 60}min`
  }

  if (!employee) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">Cargando...</div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/trabajadores"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{employee.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={employee.is_active ? "default" : "secondary"}>
                {employee.is_active ? "Activo" : "Inactivo"}
              </Badge>
              <span className="text-sm text-muted-foreground">{employee.position}</span>
            </div>
          </div>
        </div>
        {employee.is_active && (
          <div className="flex gap-2">
            {!employee.user_id && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/trabajadores/${id}/invitar`}>
                  <Smartphone className="h-4 w-4 mr-2" />Invitar a la app
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDeactivate} disabled={loading}
              className="text-red-600 border-red-200 hover:bg-red-50">
              <UserX className="h-4 w-4 mr-2" />Dar de baja
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="fichajes">Fichajes</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="mt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Datos personales</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <Label>Nombre completo</Label>
                  <Input {...register("full_name")} />
                </div>
                <div className="space-y-1">
                  <Label>DNI / NIE</Label>
                  <Input {...register("dni")} />
                </div>
                <div className="space-y-1">
                  <Label>Nº Seguridad Social</Label>
                  <Input {...register("social_security_number")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Datos laborales</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Puesto</Label>
                  <Input {...register("position")} />
                </div>
                <div className="space-y-1">
                  <Label>Tipo de contrato</Label>
                  <Select defaultValue={employee.contract_type}
                    onValueChange={(v) => { if (v) setValue("contract_type", (v as string) as FormData["contract_type"]) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(contractLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Fecha de alta</Label>
                  <Input type="date" {...register("start_date")} />
                </div>
                <div className="space-y-1">
                  <Label>Fecha de baja</Label>
                  <Input type="date" {...register("end_date")} />
                </div>
                <div className="space-y-1">
                  <Label>Horas semanales</Label>
                  <Input type="number" step="0.5" {...register("weekly_hours", { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label>Tarifa por hora (€)</Label>
                  <Input type="number" step="0.01" {...register("hourly_rate", { valueAsNumber: true })} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="fichajes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Últimos 30 fichajes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {records.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Sin fichajes registrados</p>
              ) : (
                <div className="divide-y">
                  {records.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <div>
                        <p className="font-medium capitalize">
                          {format(new Date(r.date), "EEEE d MMM", { locale: es })}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(r.check_in), "HH:mm")} →{" "}
                          {r.check_out ? format(new Date(r.check_out), "HH:mm") : "En turno"}
                        </p>
                      </div>
                      <Badge variant="secondary">{calcHours(r.check_in, r.check_out)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
