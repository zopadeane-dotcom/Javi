import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Plus, AlertTriangle, Download } from "lucide-react"

const ALLERGENS = [
  { key: "gluten", label: "Gluten" },
  { key: "crustaceans", label: "Crustáceos" },
  { key: "eggs", label: "Huevos" },
  { key: "fish", label: "Pescado" },
  { key: "peanuts", label: "Cacahuetes" },
  { key: "soy", label: "Soja" },
  { key: "dairy", label: "Lácteos" },
  { key: "nuts", label: "Frutos secos" },
  { key: "celery", label: "Apio" },
  { key: "mustard", label: "Mostaza" },
  { key: "sesame", label: "Sésamo" },
  { key: "sulphites", label: "SO₂/Sulfitos" },
  { key: "lupin", label: "Altramuces" },
  { key: "molluscs", label: "Moluscos" },
]

export default async function AlergenosPage() {
  const supabase = await createClient()
  const profile = await requireAdmin()

  const { data: products } = await supabase
    .from("allergen_products")
    .select("*")
    .eq("business_id", profile.business_id!)
    .order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Control de Alérgenos</h1>
          <p className="text-muted-foreground text-sm">
            Los 14 alérgenos obligatorios — Reglamento UE 1169/2011
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/api/pdf/alergenos" download>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </a>
          </Button>
          <Button asChild>
            <Link href="/sanidad/alergenos/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo plato
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Producto</TableHead>
                {ALLERGENS.map((a) => (
                  <TableHead key={a.key} className="text-center text-xs min-w-[70px]">
                    {a.label}
                  </TableHead>
                ))}
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products?.length && (
                <TableRow>
                  <TableCell colSpan={ALLERGENS.length + 2} className="text-center py-12 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No hay productos registrados
                  </TableCell>
                </TableRow>
              )}
              {products?.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  {ALLERGENS.map((a) => (
                    <TableCell key={a.key} className="text-center">
                      {p[a.key] ? (
                        <span className="text-red-600 font-bold text-lg" title={a.label}>✓</span>
                      ) : (
                        <span className="text-muted-foreground text-lg">·</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/sanidad/alergenos/${p.id}`}>Editar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground bg-muted rounded-lg p-4 space-y-1">
        <p className="font-medium text-foreground">14 alérgenos de declaración obligatoria</p>
        <p>Según el Reglamento (UE) 1169/2011 y el Real Decreto 126/2015, los establecimientos de restauración
        deben informar a los consumidores sobre los alérgenos presentes en sus platos, ya sea de forma escrita
        o verbal con soporte documental.</p>
      </div>
    </div>
  )
}
