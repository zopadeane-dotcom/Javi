import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { MonthPicker } from "@/components/horarios/month-picker"
import { ExportPdfButton } from "@/components/horarios/export-pdf-button"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Plus, Clock } from "lucide-react"

function formatTime(iso: string | null) {
  if (!iso) return "—"
  return format(new Date(iso), "HH:mm")
}

function calcHours(checkIn: string, checkOut: string | null): string {
  if (!checkOut) return "En turno"
  const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 3600000
  return `${diff.toFixed(2)}h`
}

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; empleado?: string }>
}) {
  const supabase = await createClient()
  const profile = await requireAdmin()

  const params = await searchParams
  const mesParam = params.mes ?? format(new Date(), "yyyy-MM")
  const [year, month] = mesParam.split("-").map(Number)
  const from = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd")
  const to = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd")

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("business_id", profile.business_id!)
    .eq("is_active", true)
    .order("full_name")

  const { data: records } = await supabase
    .from("time_records")
    .select("*, employees(full_name)")
    .eq("business_id", profile.business_id!)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .order("check_in", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fichajes</h1>
          <p className="text-muted-foreground text-sm">
            Registro de horas — {format(new Date(year, month - 1), "MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportPdfButton
            employees={(employees ?? []).map((e: any) => ({ id: e.id, full_name: e.full_name }))}
            mes={mesParam}
          />
          <Button asChild>
            <Link href="/trabajadores/horarios/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Añadir fichaje
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtro de mes */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Mes:</label>
        <MonthPicker value={mesParam} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Trabajador</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!records?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Sin fichajes en este periodo
                  </TableCell>
                </TableRow>
              )}
              {records?.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {format(new Date(r.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">{r.employees?.full_name}</TableCell>
                  <TableCell>{formatTime(r.check_in)}</TableCell>
                  <TableCell>{formatTime(r.check_out)}</TableCell>
                  <TableCell>
                    {r.check_out ? (
                      <Badge variant="secondary">{calcHours(r.check_in, r.check_out)}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">En turno</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.notes ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
