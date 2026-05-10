import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Plus, Thermometer, AlertTriangle, CheckCircle } from "lucide-react"

const controlTypeLabel: Record<string, string> = {
  temperatura: "Temperatura",
  limpieza: "Limpieza",
  plagas: "Plagas (DDD)",
  otro: "Otro",
}

export default async function AppccPage() {
  const supabase = await createClient()
  const profile = await requireAdmin()

  const [{ data: templates }, { data: controls }] = await Promise.all([
    supabase
      .from("haccp_templates")
      .select("*")
      .eq("business_id", profile.business_id!)
      .order("name"),
    supabase
      .from("haccp_controls")
      .select("*, haccp_templates(name, unit)")
      .eq("business_id", profile.business_id!)
      .order("control_date", { ascending: false })
      .limit(50),
  ])

  const incidencias = controls?.filter((c) => c.status === "incidencia").length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">APPCC / HACCP</h1>
          <p className="text-muted-foreground text-sm">
            Registros de control — Reglamento (CE) 852/2004
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/sanidad/appcc/plantillas/nueva">+ Plantilla</Link>
          </Button>
          <Button asChild>
            <Link href="/sanidad/appcc/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo registro
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Puntos de control</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{templates?.filter((t) => t.is_active).length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registros (últimos 50)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{controls?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${incidencias > 0 ? "text-red-600" : "text-green-600"}`}>
              {incidencias}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="registros">
        <TabsList>
          <TabsTrigger value="registros">Registros</TabsTrigger>
          <TabsTrigger value="plantillas">Puntos de control</TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Punto de control</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!controls?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <Thermometer className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Sin registros aún
                      </TableCell>
                    </TableRow>
                  )}
                  {controls?.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>{format(new Date(c.control_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="font-medium">{c.haccp_templates?.name}</TableCell>
                      <TableCell>
                        {c.value !== null
                          ? `${c.value} ${c.haccp_templates?.unit ?? ""}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {c.status === "ok" ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />OK
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />Incidencia
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{c.notes ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plantillas" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Rango aceptable</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!templates?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay puntos de control configurados
                      </TableCell>
                    </TableRow>
                  )}
                  {templates?.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{controlTypeLabel[t.control_type]}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.min_value !== null || t.max_value !== null
                          ? `${t.min_value ?? "—"} — ${t.max_value ?? "—"} ${t.unit ?? ""}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.is_active ? "default" : "secondary"}>
                          {t.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
