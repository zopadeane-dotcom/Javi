import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, User } from "lucide-react"
import { InviteButton } from "@/components/trabajadores/invite-button"
import type { Employee } from "@/lib/supabase/types"

const contractLabels: Record<string, string> = {
  indefinido: "Indefinido",
  temporal: "Temporal",
  formacion: "Formación",
  practicas: "Prácticas",
  obra_servicio: "Obra/Servicio",
}

export default async function TrabajadoresPage() {
  const supabase = await createClient()
  const profile = await requireAdmin()

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("business_id", profile.business_id!)
    .order("full_name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trabajadores</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona el equipo del establecimiento
          </p>
        </div>
        <div className="flex gap-2">
          <InviteButton />
          <Button asChild>
            <Link href="/trabajadores/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Añadir trabajador
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {employees?.filter((e) => e.is_active).length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Indefinidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {employees?.filter((e) => e.is_active && e.contract_type === "indefinido").length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Temporales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {employees?.filter((e) => e.is_active && e.contract_type === "temporal").length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactivos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {employees?.filter((e) => !e.is_active).length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Horas/sem.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!employees?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No hay trabajadores registrados
                  </TableCell>
                </TableRow>
              )}
              {employees?.map((emp: Employee) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.full_name}</TableCell>
                  <TableCell className="font-mono text-sm">{emp.dni}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>{contractLabels[emp.contract_type]}</TableCell>
                  <TableCell>{emp.weekly_hours}h</TableCell>
                  <TableCell>
                    <Badge variant={emp.is_active ? "default" : "secondary"}>
                      {emp.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/trabajadores/${emp.id}`}>Ver</Link>
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
