import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

function formatEur(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
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

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Modelo 303 — IVA {year}</h1>
        <p className="text-muted-foreground text-sm">
          Resumen del IVA soportado para la declaración trimestral (AEAT)
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Base imponible anual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatEur(yearBase)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IVA soportado total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatEur(yearVat)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IVA deducible total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{formatEur(yearDeductible)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {quarterData.map(({ q, baseTotal, vatTotal, vatDeductible, count }) => (
          <Card key={q}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Trimestre {q} (T{q})</CardTitle>
                <Badge variant="secondary">{count} facturas</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Base imponible de compras</TableCell>
                    <TableCell className="text-right">{formatEur(baseTotal)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>IVA soportado (cuotas soportadas)</TableCell>
                    <TableCell className="text-right">{formatEur(vatTotal)}</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold text-green-700">
                    <TableCell>IVA deducible (casilla 28 del Modelo 303)</TableCell>
                    <TableCell className="text-right">{formatEur(vatDeductible)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4 text-sm text-amber-800 space-y-1">
          <p className="font-semibold">Aviso legal</p>
          <p>
            Este resumen es orientativo. El Modelo 303 debe presentarse ante la AEAT con los datos
            completos incluyendo IVA repercutido (ventas). Consulta con tu asesor fiscal.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
