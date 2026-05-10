"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createHaccpTemplate } from "@/lib/actions/sanidad"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NuevaPlantillaPage() {
  const router = useRouter()
  const [controlType, setControlType] = useState("temperatura")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("control_type", controlType)
    const result = await createHaccpTemplate(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Punto de control creado")
      router.push("/sanidad/appcc")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sanidad/appcc"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo punto de control</h1>
          <p className="text-muted-foreground text-sm">Configura un punto de control APPCC</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Configuración</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nombre del punto *</Label>
              <Input id="name" name="name" placeholder="Ej: Cámara frigorífica 1" required />
            </div>

            <div className="space-y-1">
              <Label>Tipo de control *</Label>
              <Select defaultValue="temperatura" onValueChange={(v) => { if (v) setControlType(v as string) }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temperatura">Temperatura</SelectItem>
                  <SelectItem value="limpieza">Limpieza y desinfección</SelectItem>
                  <SelectItem value="plagas">Plagas (DDD)</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" placeholder="¿Qué se controla en este punto?" />
            </div>

            {controlType === "temperatura" && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="min_value">Mín. aceptable</Label>
                  <Input id="min_value" name="min_value" type="number" step="0.1" placeholder="Ej: 0" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="max_value">Máx. aceptable</Label>
                  <Input id="max_value" name="max_value" type="number" step="0.1" placeholder="Ej: 8" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="unit">Unidad</Label>
                  <Input id="unit" name="unit" placeholder="°C" defaultValue="°C" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/sanidad/appcc">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Crear punto de control"}
          </Button>
        </div>
      </form>
    </div>
  )
}
