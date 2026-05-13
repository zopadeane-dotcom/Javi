import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getProfile } from "@/lib/auth"
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import {
  Users, FileText, Thermometer, Award, AlertTriangle, Clock,
  ArrowRight, CheckCircle, UserPlus, Receipt, ClipboardCheck, Calculator,
  TrendingUp, ShieldCheck,
} from "lucide-react"

function formatEur(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
}

function greeting(name: string) {
  const h = new Date().getHours()
  if (h < 13) return `Buenos días, ${name} ☀️`
  if (h < 20) return `Buenas tardes, ${name} 👋`
  return `Buenas noches, ${name} 🌙`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  if (profile.role === "employee") redirect("/portal/fichar")

  const businessId = profile.business_id!
  const { data: business } = await supabase
    .from("businesses").select("name").eq("id", businessId).single()

  const today = format(new Date(), "yyyy-MM-dd")
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  const currentYear = new Date().getFullYear()

  const [
    { data: employees },
    { data: openRecords },
    { data: invoices },
    { data: certs },
    { data: haccpControls },
  ] = await Promise.all([
    supabase.from("employees").select("id, is_active, full_name, position").eq("business_id", businessId),
    supabase.from("time_records").select("id, employees(full_name, position)").eq("business_id", businessId).eq("date", today).is("check_out", null),
    supabase.from("invoices").select("total_amount, quarter, year").eq("business_id", businessId).eq("year", currentYear).eq("quarter", currentQuarter),
    supabase.from("food_handler_certificates").select("id, expiry_date, employees(full_name)").eq("business_id", businessId),
    supabase.from("haccp_controls").select("id, status, control_date").eq("business_id", businessId).eq("control_date", today),
  ])

  const activeEmployees = employees?.filter((e) => e.is_active).length ?? 0
  const quarterTotal = invoices?.reduce((s, i) => s + i.total_amount, 0) ?? 0
  const certAlerts = certs?.filter((c) => {
    if (!c.expiry_date) return false
    return differenceInDays(new Date(c.expiry_date), new Date()) < 60
  }) ?? []
  const incidencias = haccpControls?.filter((c) => c.status === "incidencia").length ?? 0
  const businessName = (business as any)?.name ?? "Mi negocio"
  const firstName = profile.full_name.split(" ")[0]

  const kpis = [
    {
      label: "Trabajadores activos",
      value: activeEmployees,
      sub: `${openRecords?.length ?? 0} en turno ahora`,
      icon: Users,
      iconBg: "bg-violet-100 dark:bg-violet-900/40",
      iconColor: "text-violet-600 dark:text-violet-400",
      href: "/trabajadores",
      ok: true,
    },
    {
      label: `Facturas T${currentQuarter}`,
      value: invoices?.length ?? 0,
      sub: formatEur(quarterTotal),
      icon: FileText,
      iconBg: "bg-sky-100 dark:bg-sky-900/40",
      iconColor: "text-sky-600 dark:text-sky-400",
      href: "/facturas",
      ok: true,
    },
    {
      label: "APPCC hoy",
      value: haccpControls?.length ?? 0,
      sub: incidencias > 0 ? `${incidencias} incidencia${incidencias > 1 ? "s" : ""}` : "Todo correcto",
      icon: Thermometer,
      iconBg: incidencias > 0 ? "bg-red-100 dark:bg-red-900/40" : "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: incidencias > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
      href: "/sanidad/appcc",
      ok: incidencias === 0,
    },
    {
      label: "Cert. manipuladores",
      value: certs?.length ?? 0,
      sub: certAlerts.length > 0 ? `${certAlerts.length} alerta${certAlerts.length > 1 ? "s" : ""}` : "Al día",
      icon: Award,
      iconBg: certAlerts.length > 0 ? "bg-orange-100 dark:bg-orange-900/40" : "bg-teal-100 dark:bg-teal-900/40",
      iconColor: certAlerts.length > 0 ? "text-orange-600 dark:text-orange-400" : "text-teal-600 dark:text-teal-400",
      href: "/sanidad/manipuladores",
      ok: certAlerts.length === 0,
    },
  ]

  const quickActions = [
    { href: "/trabajadores/nuevo", icon: UserPlus, label: "Añadir trabajador", desc: "Nuevo contrato", gradient: "from-violet-500 to-purple-600" },
    { href: "/facturas/nueva", icon: Receipt, label: "Nueva factura", desc: "Proveedor", gradient: "from-sky-500 to-blue-600" },
    { href: "/sanidad/appcc/nuevo", icon: ClipboardCheck, label: "Control APPCC", desc: "Registrar hoy", gradient: "from-emerald-500 to-teal-600" },
    { href: "/facturas/modelo-303", icon: Calculator, label: "Modelo 303", desc: "Resumen IVA", gradient: "from-amber-500 to-orange-600" },
  ]

  return (
    <div className="space-y-8">

      {/* ── HEADER ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-muted-foreground text-sm capitalize mb-1">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: "1.9rem", letterSpacing: "-0.03em" }}>
            {greeting(firstName)}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">{businessName}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Cumplimiento normativo activo
        </div>
      </div>

      {/* ── ALERTAS ── */}
      {(certAlerts.length > 0 || incidencias > 0) && (
        <div className="space-y-2">
          {certAlerts.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800/40">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-300">
                <strong>{certAlerts.length} certificado{certAlerts.length > 1 ? "s" : ""}</strong> próximos a vencer:{" "}
                {certAlerts.map((c: any) => c.employees?.full_name).join(", ")}.{" "}
                <Link href="/sanidad/manipuladores" className="underline font-semibold">Revisar →</Link>
              </AlertDescription>
            </Alert>
          )}
          {incidencias > 0 && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800/40">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-300">
                <strong>{incidencias} incidencia{incidencias > 1 ? "s" : ""} APPCC</strong> registradas hoy.{" "}
                <Link href="/sanidad/appcc" className="underline font-semibold">Revisar →</Link>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, iconBg, iconColor, href, ok }) => (
          <Link
            key={label}
            href={href}
            className="group relative rounded-2xl border bg-[oklch(0.96_0.018_172)] dark:bg-[oklch(0.20_0.025_172)] border-[oklch(0.90_0.025_172)] dark:border-[oklch(0.28_0.030_172)] p-5 hover:shadow-md transition-all duration-200 hover:scale-[1.02] overflow-hidden"
          >
            {/* Acento de color arriba */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl ${ok ? "bg-primary" : certAlerts.length > 0 || incidencias > 0 ? "bg-orange-400" : "bg-primary"}`} />

            <div className="flex items-start justify-between mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${ok ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-orange-100 dark:bg-orange-900/40"}`}>
                {ok
                  ? <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  : <AlertTriangle className="h-3 w-3 text-orange-500" />
                }
              </div>
            </div>

            <p className="font-extrabold leading-none mb-1" style={{ fontSize: "2rem", letterSpacing: "-0.03em" }}>
              {value}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className={`text-xs mt-1 font-medium ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}>
              {sub}
            </p>
          </Link>
        ))}
      </div>

      {/* ── FILA INFERIOR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Fichajes de hoy — ocupa 3/5 */}
        <div className="lg:col-span-3 rounded-2xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="font-semibold text-sm">Fichajes de hoy</p>
            </div>
            <Link href="/trabajadores/horarios" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {!openRecords?.length ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-3">
                <Clock className="h-5 w-5 text-muted-foreground opacity-40" />
              </div>
              <p className="text-sm text-muted-foreground">Nadie en turno ahora mismo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(openRecords as any[]).slice(0, 4).map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/50 dark:bg-muted/20 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-sm">
                    {r.employees?.full_name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{r.employees?.full_name}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full shrink-0">
                    En turno
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accesos rápidos — ocupa 2/5 */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="font-semibold text-sm">Accesos rápidos</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(({ href, icon: Icon, label, desc, gradient }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col gap-2 rounded-xl p-3 transition-all duration-200 hover:scale-[1.03] overflow-hidden relative"
                style={{ background: `linear-gradient(135deg, oklch(0.96 0.02 172), oklch(0.94 0.03 172))` }}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-sm`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
