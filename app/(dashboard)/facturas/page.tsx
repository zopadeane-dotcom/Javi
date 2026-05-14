import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { InvoiceFilters } from "@/components/facturas/invoice-filters"
import { AutomationButton } from "@/components/facturas/automation-popup"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Plus, FileText, FolderOpen } from "lucide-react"

function formatEur(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
}

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; quarter?: string }>
}) {
  const supabase = await createClient()
  const profile = await requireAdmin()

  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const year = parseInt(params.year ?? String(currentYear))

  let query = supabase
    .from("invoices")
    .select("*, suppliers(name)")
    .eq("business_id", profile.business_id!)
    .eq("year", year)
    .order("invoice_date", { ascending: false })

  if (params.quarter) {
    query = query.eq("quarter", parseInt(params.quarter))
  }

  const { data: invoices } = await query

  const totalBase = invoices?.reduce((s, i) => s + i.base_amount, 0) ?? 0
  const totalVat = invoices?.reduce((s, i) => s + i.vat_amount, 0) ?? 0
  const totalDeductible = invoices?.filter((i) => i.is_deductible).reduce((s, i) => s + i.vat_amount, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturas</h1>
          <p className="text-muted-foreground text-sm">Facturas de proveedores — {year}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AutomationButton />
          <Button variant="outline" asChild>
            <Link href="/facturas/modelo-303">Modelo 303</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/facturas/importar">
              <FolderOpen className="h-4 w-4 mr-2" />
              Importar carpeta
            </Link>
          </Button>
          <Button asChild>
            <Link href="/facturas/nueva">
              <Plus className="h-4 w-4 mr-2" />
              Nueva factura
            </Link>
          </Button>
        </div>
      </div>

      <InvoiceFilters year={year} currentYear={currentYear} quarter={params.quarter} />

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Base imponible total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEur(totalBase)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IVA soportado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEur(totalVat)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IVA deducible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatEur(totalDeductible)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nº Factura</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Deducible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!invoices?.length && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No hay facturas en este periodo
                  </TableCell>
                </TableRow>
              )}
              {invoices?.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell>{format(new Date(inv.invoice_date), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.suppliers?.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{inv.concept ?? "—"}</TableCell>
                  <TableCell className="text-right">{formatEur(inv.base_amount)}</TableCell>
                  <TableCell className="text-right">{formatEur(inv.vat_amount)} ({inv.vat_rate}%)</TableCell>
                  <TableCell className="text-right font-medium">{formatEur(inv.total_amount)}</TableCell>
                  <TableCell>
                    <Badge variant={inv.is_deductible ? "default" : "secondary"}>
                      {inv.is_deductible ? "Sí" : "No"}
                    </Badge>
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
