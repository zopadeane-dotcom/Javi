import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Plus, Truck } from "lucide-react"
import { differenceInDays } from "date-fns"

function auditBadge(nextAuditDate: string | null) {
  if (!nextAuditDate) return <Badge variant="secondary">Sin fecha</Badge>
  const days = differenceInDays(new Date(nextAuditDate), new Date())
  if (days < 0) return <Badge variant="destructive">Vencida</Badge>
  if (days < 30) return <Badge className="bg-orange-100 text-orange-800 border-orange-200">En {days}d</Badge>
  return <Badge variant="outline">{format(new Date(nextAuditDate), "dd/MM/yyyy")}</Badge>
}

export default async function ProveedoresSanidadPage() {
  const supabase = await createClient()
  const profile = await requireAdmin()

  const { data: sheets } = await supabase
    .from("supplier_sheets")
    .select("*, suppliers(name, nif)")
    .eq("business_id", profile.business_id!)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fichas de proveedores</h1>
          <p className="text-muted-foreground text-sm">
            Registro sanitario RGSEAA y homologación de proveedores
          </p>
        </div>
        <Button asChild>
          <Link href="/sanidad/proveedores/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nueva ficha
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>NIF/CIF</TableHead>
                <TableHead>RGSEAA</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Próx. auditoría</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!sheets?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No hay fichas de proveedores
                  </TableCell>
                </TableRow>
              )}
              {sheets?.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.suppliers?.name}</TableCell>
                  <TableCell className="font-mono text-sm">{s.suppliers?.nif ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{s.rgseaa_number ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {s.supplied_products ?? "—"}
                  </TableCell>
                  <TableCell>{auditBadge(s.next_audit_date)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/sanidad/proveedores/${s.id}`}>Ver</Link>
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
