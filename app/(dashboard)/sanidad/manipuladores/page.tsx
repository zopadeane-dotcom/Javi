import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { format, differenceInDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Plus, Award, AlertTriangle } from "lucide-react"

function statusBadge(expiryDate: string | null, status: string) {
  if (status === "caducado" || (expiryDate && differenceInDays(new Date(expiryDate), new Date()) < 0)) {
    return <Badge variant="destructive">Caducado</Badge>
  }
  if (expiryDate) {
    const days = differenceInDays(new Date(expiryDate), new Date())
    if (days < 60) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Vence en {days}d</Badge>
    }
    return <Badge className="bg-green-100 text-green-800 border-green-200">Vigente</Badge>
  }
  return <Badge variant="secondary">Sin caducidad</Badge>
}

export default async function ManipuladoresPage() {
  const supabase = await createClient()
  const profile = await requireAdmin()

  const { data: certs } = await supabase
    .from("food_handler_certificates")
    .select("*, employees(full_name, position)")
    .eq("business_id", profile.business_id!)
    .order("expiry_date", { ascending: true, nullsFirst: false })

  const caducados = certs?.filter((c) =>
    c.expiry_date && differenceInDays(new Date(c.expiry_date), new Date()) < 0
  ).length ?? 0

  const proximosVencer = certs?.filter((c) =>
    c.expiry_date &&
    differenceInDays(new Date(c.expiry_date), new Date()) >= 0 &&
    differenceInDays(new Date(c.expiry_date), new Date()) < 60
  ).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Formación de manipuladores</h1>
          <p className="text-muted-foreground text-sm">
            Certificados de manipulación de alimentos del personal
          </p>
        </div>
        <Button asChild>
          <Link href="/sanidad/manipuladores/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Añadir certificado
          </Link>
        </Button>
      </div>

      {(caducados > 0 || proximosVencer > 0) && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
          <div className="text-sm text-orange-800">
            {caducados > 0 && (
              <p><strong>{caducados} certificado{caducados > 1 ? "s" : ""} caducado{caducados > 1 ? "s" : ""}.</strong> Actualizar con urgencia.</p>
            )}
            {proximosVencer > 0 && (
              <p><strong>{proximosVencer} certificado{proximosVencer > 1 ? "s" : ""}</strong> vence{proximosVencer > 1 ? "n" : ""} en menos de 60 días.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total certificados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{certs?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-orange-600">Próximos a vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{proximosVencer}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground text-red-600">Caducados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{caducados}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabajador</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Nº Certificado</TableHead>
                <TableHead>Fecha obtención</TableHead>
                <TableHead>Fecha caducidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!certs?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No hay certificados registrados
                  </TableCell>
                </TableRow>
              )}
              {certs?.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.employees?.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.employees?.position}</TableCell>
                  <TableCell className="font-mono text-sm">{c.certificate_number ?? "—"}</TableCell>
                  <TableCell>{format(new Date(c.obtained_date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    {c.expiry_date ? format(new Date(c.expiry_date), "dd/MM/yyyy") : "Sin caducidad"}
                  </TableCell>
                  <TableCell>{statusBadge(c.expiry_date, c.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/sanidad/manipuladores/${c.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
