"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createHaccpControl } from "@/lib/actions/sanidad"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function NuevoControlPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<any[]>([])
  const [templateId, setTemplateId] = useState("")
  const [status, setStatus] = useState("ok")
  const [loading, setLoading] = useState(false)
  const today = format(new Date(), "yyyy-MM-dd")

  useEffect(() => {
    createClient().from("haccp_templates").select("*").eq("is_active", true).order("name")
      .then(({ data }) => setTemplates(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("template_id", templateId)
    fd.set("status", status)
    const result = await createHaccpControl(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Control registrado correctamente")
      router.push("/sanidad/appcc")
    }
    setLoading(false)
  }

  const selectedTemplate = templates.find((t) => t.id === templateId)

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sanidad/appcc"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo registro APPCC</h1>
          <p className="text-muted-foreground text-sm">Registra un control del día</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Datos del control</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Punto de control *</Label>
              <Select onValueChange={(v) => { if (v) setTemplateId(v as string) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un punto de control..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 && (
                    <SelectItem value="none" disabled>No hay plantillas. Crea una primero.</SelectItem>
                  )}
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="control_date">Fecha *</Label>
              <Input id="control_date" name="control_date" type="date" defaultValue={today} required />
            </div>

            {selectedTemplate?.control_type === "temperatura" && (
              <div className="space-y-1">
                <Label htmlFor="value">
                  Temperatura registrada ({selectedTemplate.unit ?? "°C"})
                  {selectedTemplate.min_value != null && selectedTemplate.max_value != null && (
                    <span className="text-muted-foreground ml-1 font-normal">
                      · Rango aceptable: {selectedTemplate.min_value} — {selectedTemplate.max_value}
                    </span>
                  )}
                </Label>
                <Input id="value" name="value" type="number" step="0.1" placeholder="Ej: 4.2" />
              </div>
            )}

            <div className="space-y-1">
              <Label>Resultado *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("ok")}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                    status === "ok"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Correcto
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("incidencia")}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                    status === "incidencia"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Incidencia
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea id="notes" name="notes" placeholder="Añade notas si hay alguna incidencia..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/sanidad/appcc">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading || !templateId}>
            {loading ? "Guardando..." : "Guardar registro"}
          </Button>
        </div>
      </form>
    </div>
  )
}
