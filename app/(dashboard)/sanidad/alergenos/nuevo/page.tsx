"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createAllergenProduct } from "@/lib/actions/sanidad"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const ALLERGENS = [
  { key: "gluten", label: "Gluten", desc: "Trigo, cebada, centeno, avena..." },
  { key: "crustaceans", label: "Crustáceos", desc: "Gambas, cangrejos, langosta..." },
  { key: "eggs", label: "Huevos", desc: "Y productos derivados" },
  { key: "fish", label: "Pescado", desc: "Y productos derivados" },
  { key: "peanuts", label: "Cacahuetes", desc: "Y productos derivados" },
  { key: "soy", label: "Soja", desc: "Y productos derivados" },
  { key: "dairy", label: "Lácteos", desc: "Leche y derivados" },
  { key: "nuts", label: "Frutos secos", desc: "Almendras, nueces, avellanas..." },
  { key: "celery", label: "Apio", desc: "Y productos derivados" },
  { key: "mustard", label: "Mostaza", desc: "Y productos derivados" },
  { key: "sesame", label: "Sésamo", desc: "Y productos derivados" },
  { key: "sulphites", label: "SO₂ / Sulfitos", desc: "> 10 mg/kg o 10 mg/l" },
  { key: "lupin", label: "Altramuces", desc: "Y productos derivados" },
  { key: "molluscs", label: "Moluscos", desc: "Mejillones, almejas, calamares..." },
]

export default function NuevoAlergenoPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  function toggle(key: string) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    ALLERGENS.forEach(({ key }) => {
      fd.set(key, selected[key] ? "on" : "off")
    })
    const result = await createAllergenProduct(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Plato/producto añadido correctamente")
      router.push("/sanidad/alergenos")
    }
    setLoading(false)
  }

  const count = Object.values(selected).filter(Boolean).length

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sanidad/alergenos"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo plato / producto</h1>
          <p className="text-muted-foreground text-sm">Marca los alérgenos que contiene</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nombre del plato o producto *</Label>
              <Input id="name" name="name" placeholder="Ej: Paella mixta, Tarta de queso..." required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea id="description" name="description" placeholder="Ingredientes principales, variantes..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Alérgenos presentes</CardTitle>
              {count > 0 && (
                <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-full">
                  {count} seleccionado{count > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Reglamento UE 1169/2011 — Marca todos los que apliquen
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALLERGENS.map(({ key, label, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                    selected[key]
                      ? "border-red-400 bg-red-50"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/40"
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center ${
                    selected[key] ? "bg-red-500 border-red-500" : "border-muted-foreground/40"
                  }`}>
                    {selected[key] && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${selected[key] ? "text-red-700" : ""}`}>{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/sanidad/alergenos">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar plato"}
          </Button>
        </div>
      </form>
    </div>
  )
}
