import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { TrendingUp } from "lucide-react"
import { VentasActions } from "./ventas-client"

function formatEur(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
}

const quarterMonths: Record<number, string> = {
  1: "Enero — Marzo",
  2: "Abril — Junio",
  3: "Julio — Septiembre",
  4: "Octubre — Diciembre",
}

const sourceLabels: Record<string, string> = {
  sumup: "SumUp",
  square: "Square",
  tpv: "TPV",
  efectivo: "Efectivo",
  manual: "Manual",
}

export default async function VentasPage() {
  const supabase = await createClient()
  const profile = await requireAdmin()

  const year = new Date().getFullYear()

  const { data: recordsRaw } = await supabase
    .from("sales_records")
    .select("id, period_start, period_end, source, total_sales, vat_rate, vat_amount, base_amount, notes, year, quarter")
    .eq("business_id", profile.business_id!)
    .eq("year", year)
    .order("period_start", { ascending: false })

  const records = (recordsRaw ?? []) as {
    id: string
    period_start: string
    period_end: string
    source: string
    total_sales: number
    vat_rate: number
    vat_amount: number
    base_amount: number
    notes: string | null
    year: number
    quarter: number
  }[]

  const quarters = [1, 2, 3, 4] as const
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)

  const quarterData = quarters.map((q) => {
    const qRecords = records.filter((r) => r.quarter === q)
    const totalSales = qRecords.reduce((s, r) => s + r.total_sales, 0)
    const totalVat = qRecords.reduce((s, r) => s + r.vat_amount, 0)
    return { q, records: qRecords, totalSales, totalVat }
  })

  const yearTotalSales = records.reduce((s, r) => s + r.total_sales, 0)
  const yearTotalVat = records.reduce((s, r) => s + r.vat_amount, 0)
  const currentQData = quarterData.find((q) => q.q === currentQuarter)

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Cabecera + botón + formulario inline */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ventas</h1>
            <p className="text-muted-foreground text-sm mt-1">IVA repercutido — tus ingresos</p>
          </div>
          <VentasActions />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-medium">Total ventas {year}</p>
          </div>
          <p className="text-2xl font-bold">{formatEur(yearTotalSales)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-medium">IVA repercutido {year}</p>
          </div>
          <p className="text-2xl font-bold">{formatEur(yearTotalVat)}</p>
        </div>
        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800/40 p-5 space-y-1">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-medium">T{currentQuarter} — IVA repercutido</p>
          </div>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
            {formatEur(currentQData?.totalVat ?? 0)}
          </p>
        </div>
      </div>

      {/* Trimestres */}
      <div className="space-y-3">
        {quarterData.map(({ q, records: qRecords, totalSales, totalVat }) => (
          <div key={q} className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
              <div>
                <p className="font-semibold text-sm">Trimestre {q} (T{q})</p>
                <p className="text-xs text-muted-foreground">{quarterMonths[q]}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${qRecords.length > 0 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" : "bg-muted text-muted-foreground"}`}>
                {qRecords.length} {qRecords.length === 1 ? "registro" : "registros"}
              </span>
            </div>

            {qRecords.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                Sin registros de ventas para este trimestre
              </div>
            ) : (
              <div className="divide-y">
                {qRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sourceLabels[r.source] ?? r.source}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.period_start} — {r.period_end}
                        {r.notes && <span className="ml-2 italic">{r.notes}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{formatEur(r.total_sales)}</p>
                      <p className="text-xs text-rose-600 dark:text-rose-400">IVA: {formatEur(r.vat_amount)}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-3 text-sm bg-rose-50 dark:bg-rose-950/20">
                  <span className="font-semibold text-rose-800 dark:text-rose-200">Total T{q}</span>
                  <div className="text-right">
                    <p className="font-bold text-rose-700 dark:text-rose-300">{formatEur(totalSales)}</p>
                    <p className="text-xs text-rose-600 dark:text-rose-400">IVA repercutido: {formatEur(totalVat)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}
