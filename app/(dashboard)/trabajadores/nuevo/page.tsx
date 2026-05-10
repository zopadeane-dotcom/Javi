"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createEmployee } from "@/lib/actions/employees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const schema = z.object({
  full_name: z.string().min(2, "Nombre obligatorio"),
  dni: z.string().length(9, "El DNI/NIE debe tener 9 caracteres"),
  social_security_number: z.string().optional(),
  position: z.string().min(1, "Puesto obligatorio"),
  contract_type: z.enum(["indefinido", "temporal", "formacion", "practicas", "obra_servicio"]),
  start_date: z.string().min(1, "Fecha de inicio obligatoria"),
  end_date: z.string().optional(),
  weekly_hours: z.number().min(1).max(60),
  hourly_rate: z.number().optional(),
})

type FormData = z.infer<typeof schema>

export default function NuevoTrabajadorPage() {
  const router = useRouter()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { contract_type: "indefinido", weekly_hours: 40 },
  })

  async function onSubmit(data: FormData) {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== "") fd.append(k, String(v))
    })
    const result = await createEmployee(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Trabajador añadido correctamente")
      router.push("/trabajadores")
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/trabajadores"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo trabajador</h1>
          <p className="text-muted-foreground text-sm">Rellena los datos del contrato</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && <p className="text-destructive text-sm">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="dni">DNI / NIE *</Label>
              <Input id="dni" placeholder="12345678A" {...register("dni")} />
              {errors.dni && <p className="text-destructive text-sm">{errors.dni.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="social_security_number">Nº Seguridad Social</Label>
              <Input id="social_security_number" {...register("social_security_number")} />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Datos laborales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="position">Puesto *</Label>
              <Input id="position" placeholder="Camarero/a, Cocinero/a..." {...register("position")} />
              {errors.position && <p className="text-destructive text-sm">{errors.position.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Tipo de contrato *</Label>
              <Select
                defaultValue="indefinido"
                onValueChange={(v) => { if (v) setValue("contract_type", (v as string) as FormData["contract_type"]) }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinido">Indefinido</SelectItem>
                  <SelectItem value="temporal">Temporal</SelectItem>
                  <SelectItem value="formacion">Formación</SelectItem>
                  <SelectItem value="practicas">Prácticas</SelectItem>
                  <SelectItem value="obra_servicio">Obra / Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="start_date">Fecha de alta *</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
              {errors.start_date && <p className="text-destructive text-sm">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="end_date">Fecha de baja</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="weekly_hours">Horas semanales *</Label>
              <Input id="weekly_hours" type="number" step="0.5" {...register("weekly_hours", { valueAsNumber: true })} />
              {errors.weekly_hours && <p className="text-destructive text-sm">{errors.weekly_hours.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="hourly_rate">Tarifa por hora (€)</Label>
              <Input id="hourly_rate" type="number" step="0.01" {...register("hourly_rate", { valueAsNumber: true })} />
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/trabajadores">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar trabajador"}
          </Button>
        </div>
      </form>
    </div>
  )
}
