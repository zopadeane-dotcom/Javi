import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getProfile } from "@/lib/auth"
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import {
  Users, FileText, Thermometer, Award, AlertTriangle, Clock,
  ArrowRight, CheckCircle, UserPlus, Receipt, ClipboardCheck, Calculator,
} from "lucide-react"

function formatEur(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  // Empleados redirigen a su portal
  if (profile.role === "employee") redirect("/portal/fichar")

  const businessId = profile.business_id!
  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .single()

  const today = format(new Date(), "yyyy-MM-dd")
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd")
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  const currentYear = new Date().getFullYear()

  const [
    { data: employees },
    { data: openRecords },
    { data: invoices },
    { data: certs },
    { data: haccpControls },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, is_active")
      .eq("business_id", businessId),
    supabase
      .from("time_records")
      .select("id, employees(full_name)")
      .eq("business_id", businessId)
      .eq("date", today)
      .is("check_out", null),
    supabase
      .from("invoices")
      .select("total_amount, quarter, year")
      .eq("business_id", businessId)
      .eq("year", currentYear)
      .eq("quarter", currentQuarter),
    supabase
      .from("food_handler_certificates")
      .select("id, expiry_date, employees(full_name)")
      .eq("business_id", businessId),
    supabase
      .from("haccp_controls")
      .select("id, status, control_date")
      .eq("business_id", businessId)
      .eq("control_date", today),
  ])

  const activeEmployees = employees?.filter((e) => e.is_active).length ?? 0
  const quarterTotal = invoices?.reduce((s, i) => s + i.total_amount, 0) ?? 0

  const certAlerts = certs?.filter((c) => {
    if (!c.expiry_date) return false
    return differenceInDays(new Date(c.expiry_date), new Date()) < 60
  }) ?? []

  const incidencias = haccpControls?.filter((c) => c.status === "incidencia").length ?? 0

  const businessName = (business as any)?.name ?? "Mi negocio"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Buenos días, {profile.full_name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm capitalize">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} — {businessName}
        </p>
      </div>

      {/* Alertas */}
      {certAlerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{certAlerts.length} certificado{certAlerts.length > 1 ? "s" : ""} de manipulador</strong> próximos a vencer o caducados:{" "}
            {certAlerts.map((c: any) => c.employees?.full_name).join(", ")}.{" "}
            <Link href="/sanidad/manipuladores" className="underline">Revisar</Link>
          </AlertDescription>
        </Alert>
      )}

      {incidencias > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{incidencias} incidencia{incidencias > 1 ? "s" : ""} APPCC</strong> registradas hoy.{" "}
            <Link href="/sanidad/appcc" className="underline">Revisar</Link>
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trabajadores activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeEmployees}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {openRecords?.length ?? 0} en turno ahora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Facturas T{currentQuarter}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{invoices?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatEur(quarterTotal)} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">APPCC hoy</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{haccpControls?.length ?? 0}</p>
            {incidencias > 0 ? (
              <p className="text-xs text-red-600 mt-1">{incidencias} incidencia{incidencias > 1 ? "s" : ""}</p>
            ) : (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />Todo correcto
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cert. manipuladores</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{certs?.length ?? 0}</p>
            {certAlerts.length > 0 ? (
              <p className="text-xs text-orange-600 mt-1">{certAlerts.length} alerta{certAlerts.length > 1 ? "s" : ""}</p>
            ) : (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />Al día
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Fichajes de hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!openRecords?.length ? (
              <p className="text-sm text-muted-foreground">Nadie en turno en este momento</p>
            ) : (
              openRecords.slice(0, 4).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span>{r.employees?.full_name}</span>
                  <Badge variant="outline" className="text-green-600 border-green-300 text-xs">En turno</Badge>
                </div>
              ))
            )}
            <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground" asChild>
              <Link href="/trabajadores/horarios">
                Ver todos los fichajes <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="rounded-xl border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Accesos rápidos</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/trabajadores/nuevo", icon: UserPlus, label: "Añadir trabajador", color: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" },
              { href: "/facturas/nueva", icon: Receipt, label: "Nueva factura", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
              { href: "/sanidad/appcc/nuevo", icon: ClipboardCheck, label: "Control APPCC", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
              { href: "/facturas/modelo-303", icon: Calculator, label: "Modelo 303", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${color}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
