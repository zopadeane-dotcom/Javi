import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText, TrendingDown, TrendingUp, Receipt, Info, ArrowRight, CheckCircle2 } from "lucide-react"

function formatEur(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
}

const quarterMonths: Record<number, string> = {
  1: "Enero — Marzo",
  2: "Abril — Junio",
  3: "Julio — Septiembre",
  4: "Octubre — Diciembre",
}

export default async function Modelo303Page({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const supabase = await createClient()
  const profile = await requireAdmin()

  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))
  const currentYear = new Date().getFullYear()

  // Años con facturas + año actual siempre visible
  const { data: yearsWithData } = await supabase
    .from("invoices")
    .select("year")
    .eq("business_id", profile.business_id!)
  const availableYears = [...new Set([currentYear, ...(yearsWithData?.map((i: any) => i.year) ?? [])])]
    .sort((a, b) => b - a)

  const { data: invoicesRaw } = await supabase
    .from("invoices")
    .select("base_amount, vat_amount, vat_rate, is_deductible, quarter")
    .eq("business_id", profile.business_id!)
    .eq("year", year)

  const invoices = (invoicesRaw ?? []) as {
    base_amount: number
    vat_amount: number
    vat_rate: number
    is_deductible: boolean
    quarter: number
  }[]

  const { data: salesRaw } = await supabase
    .from("sales_records")
    .select("total_sales, vat_amount, quarter")
    .eq("business_id", profile.business_id!)
    .eq("year", year)

  const sales = (salesRaw ?? []) as {
    total_sales: number
    vat_amount: number
    quarter: number
  }[]

  const quarters = [1, 2, 3, 4] as const
  const quarterData = quarters.map((q) => {
    const qInvoices = invoices.filter((i) => i.quarter === q)
    const baseTotal = qInvoices.reduce((s, i) => s + i.base_amount, 0)
    const vatTotal = qInvoices.reduce((s, i) => s + i.vat_amount, 0)
    const vatDeductible = qInvoices
      .filter((i) => i.is_deductible)
      .reduce((s, i) => s + i.vat_amount, 0)
    const qSales = sales.filter((s) => s.quarter === q)
    const salesTotal = qSales.reduce((s, r) => s + r.total_sales, 0)
    const salesVat = qSales.reduce((s, r) => s + r.vat_amount, 0)
    return { q, baseTotal, vatTotal, vatDeductible, count: qInvoices.length, salesTotal, salesVat }
  })

  const yearBase = quarterData.reduce((s, q) => s + q.baseTotal, 0)
  const yearVat = quarterData.reduce((s, q) => s + q.vatTotal, 0)
  const yearDeductible = quarterData.reduce((s, q) => s + q.vatDeductible, 0)
  const yearSalesVat = quarterData.reduce((s, q) => s + q.salesVat, 0)
  const hasInvoices = invoices.length > 0

  return (
    <div className="flex gap-8 items-start">

      {/* Contenido principal */}
      <div className="flex-1 min-w-0 space-y-8">

      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold">Modelo 303</h1>
        <p className="text-muted-foreground text-sm mt-1">
          IVA soportado · Declaración trimestral AEAT
        </p>
      </div>

      {/* Guía rápida */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-200" />
            <p className="text-sm font-medium text-blue-200">¿Cómo funciona?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                text: "Registra cada factura que recibes de tus proveedores en Workie",
              },
              {
                step: "2",
                text: "Workie calcula el IVA automáticamente y lo agrupa por trimestre",
              },
              {
                step: "3",
                text: "Copia el IVA deducible en la casilla 28 del Modelo 303 de la AEAT",
              },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-3 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                  {step}
                </span>
                <p className="text-sm text-blue-100 leading-snug">{text}</p>
              </div>
            ))}
          </div>
          {!hasInvoices && (
            <Link
              href="/facturas/nueva"
              className="inline-flex items-center gap-2 mt-2 bg-white text-blue-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Receipt className="h-4 w-4" />
              Registrar primera factura
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* KPIs anuales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <p className="text-xs font-medium">Base imponible {year}</p>
          </div>
          <p className="text-2xl font-bold">{formatEur(yearBase)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingDown className="h-4 w-4" />
            <p className="text-xs font-medium">IVA soportado {year}</p>
          </div>
          <p className="text-2xl font-bold">{formatEur(yearVat)}</p>
        </div>
        <div className="rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800/40 p-5 space-y-1">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-xs font-medium">IVA deducible {year}</p>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatEur(yearDeductible)}</p>
        </div>
        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800/40 p-5 space-y-1">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-medium">IVA repercutido {year}</p>
          </div>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{formatEur(yearSalesVat)}</p>
        </div>
      </div>

      {/* Trimestres */}
      <div className="space-y-3">
        {quarterData.map(({ q, baseTotal, vatTotal, vatDeductible, count, salesTotal, salesVat }) => {
          const resultado = salesVat - vatDeductible
          return (
          <div
            key={q}
            className="rounded-xl border bg-card overflow-hidden"
          >
            {/* Cabecera trimestre */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
              <div>
                <p className="font-semibold text-sm">Trimestre {q} (T{q})</p>
                <p className="text-xs text-muted-foreground">{quarterMonths[q]}</p>
              </div>
              <Badge variant={count > 0 ? "default" : "secondary"}>
                {count} {count === 1 ? "factura" : "facturas"}
              </Badge>
            </div>

            {/* Filas IVA soportado */}
            <div className="divide-y">
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">Base imponible de compras</span>
                <span className="font-medium">{formatEur(baseTotal)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">IVA soportado (cuotas soportadas)</span>
                <span className="font-medium">{formatEur(vatTotal)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-sm bg-green-50 dark:bg-green-950/20">
                <div>
                  <span className="font-semibold text-green-800 dark:text-green-200">IVA deducible</span>
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    Casilla 28
                  </span>
                </div>
                <span className="font-bold text-green-700 dark:text-green-300 text-base">{formatEur(vatDeductible)}</span>
              </div>

              {/* IVA repercutido (ventas) */}
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">Total ventas (IVA repercutido)</span>
                <span className="font-medium">{formatEur(salesTotal)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-sm bg-rose-50 dark:bg-rose-950/20">
                <div>
                  <span className="font-semibold text-rose-800 dark:text-rose-200">IVA repercutido</span>
                  <span className="ml-2 text-xs text-rose-600 dark:text-rose-400 font-medium bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
                    Casilla 01/03
                  </span>
                </div>
                <span className="font-bold text-rose-700 dark:text-rose-300 text-base">{formatEur(salesVat)}</span>
              </div>

              {/* Resultado */}
              <div className={`flex items-center justify-between px-5 py-3 text-sm ${resultado >= 0 ? "bg-amber-50 dark:bg-amber-950/20" : "bg-blue-50 dark:bg-blue-950/20"}`}>
                <div>
                  <span className={`font-bold ${resultado >= 0 ? "text-amber-800 dark:text-amber-200" : "text-blue-800 dark:text-blue-200"}`}>
                    {resultado >= 0 ? "A pagar" : "A devolver"}
                  </span>
                  <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${resultado >= 0 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"}`}>
                    IVA rep. − IVA deducible
                  </span>
                </div>
                <span className={`font-bold text-base ${resultado >= 0 ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300"}`}>
                  {formatEur(Math.abs(resultado))}
                </span>
              </div>
            </div>
          </div>
          )
        })}
      </div>

      {/* Aviso legal */}
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
        <p>
          <strong>Aviso:</strong> Este resumen es orientativo e incluye solo el IVA soportado (compras).
          El Modelo 303 también requiere el IVA repercutido (ventas). Consulta siempre con tu asesor fiscal.
        </p>
      </div>

      </div>{/* fin contenido principal */}

      {/* Años — columna derecha pegada al borde */}
      <div className="flex flex-col items-center gap-2 shrink-0 sticky top-6">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Años</p>
        {availableYears.map((y) => (
          <Link
            key={y}
            href={`?year=${y}`}
            className={`flex items-center justify-center w-28 rounded-2xl py-3 text-2xl font-black tabular-nums transition-all duration-150 ${
              y === year
                ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                : "bg-primary/10 text-primary/40 hover:bg-primary/20 hover:text-primary/70"
            }`}
          >
            {y}
          </Link>
        ))}
      </div>

    </div>
  )
}
