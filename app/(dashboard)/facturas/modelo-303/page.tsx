import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText, TrendingDown, Receipt, Info, ArrowRight, CheckCircle2 } from "lucide-react"

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

  const quarters = [1, 2, 3, 4] as const
  const quarterData = quarters.map((q) => {
    const qInvoices = invoices.filter((i) => i.quarter === q)
    const baseTotal = qInvoices.reduce((s, i) => s + i.base_amount, 0)
    const vatTotal = qInvoices.reduce((s, i) => s + i.vat_amount, 0)
    const vatDeductible = qInvoices
      .filter((i) => i.is_deductible)
      .reduce((s, i) => s + i.vat_amount, 0)
    return { q, baseTotal, vatTotal, vatDeductible, count: qInvoices.length }
  })

  const yearBase = quarterData.reduce((s, q) => s + q.baseTotal, 0)
  const yearVat = quarterData.reduce((s, q) => s + q.vatTotal, 0)
  const yearDeductible = quarterData.reduce((s, q) => s + q.vatDeductible, 0)
  const hasInvoices = invoices.length > 0

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modelo 303</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Resumen de IVA soportado para la declaración trimestral · AEAT
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
            <Link
              key={y}
              href={`?year=${y}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                y === year
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {y}
            </Link>
          ))}
        </div>
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
      <div className="grid grid-cols-3 gap-4">
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
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5 space-y-1">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-xs font-medium">IVA deducible {year}</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatEur(yearDeductible)}</p>
        </div>
      </div>

      {/* Trimestres */}
      <div className="space-y-3">
        {quarterData.map(({ q, baseTotal, vatTotal, vatDeductible, count }) => (
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

            {/* Filas */}
            <div className="divide-y">
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">Base imponible de compras</span>
                <span className="font-medium">{formatEur(baseTotal)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted-foreground">IVA soportado (cuotas soportadas)</span>
                <span className="font-medium">{formatEur(vatTotal)}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-sm bg-green-50">
                <div>
                  <span className="font-semibold text-green-800">IVA deducible</span>
                  <span className="ml-2 text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                    Casilla 28
                  </span>
                </div>
                <span className="font-bold text-green-700 text-base">{formatEur(vatDeductible)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aviso legal */}
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
        <p>
          <strong>Aviso:</strong> Este resumen es orientativo e incluye solo el IVA soportado (compras).
          El Modelo 303 también requiere el IVA repercutido (ventas). Consulta siempre con tu asesor fiscal.
        </p>
      </div>
    </div>
  )
}
