import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { InvoiceFilters } from "@/components/facturas/invoice-filters"
import { AutomationButton } from "@/components/facturas/automation-popup"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, FileText, FolderOpen, TrendingUp, Receipt, BadgePercent, Clock, ArrowRight, Inbox } from "lucide-react"

function formatEur(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
}

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; quarter?: string; supplier?: string; search?: string }>
}) {
  const supabase = await createClient()
  const profile = await requireAdmin()

  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const year = parseInt(params.year ?? String(currentYear))

  // Lista de proveedores para el filtro
  const { data: supplierList } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("business_id", profile.business_id!)
    .order("name")

  // Última factura subida (sin filtros)
  const { data: lastInvoices } = await supabase
    .from("invoices")
    .select("*, suppliers(name)")
    .eq("business_id", profile.business_id!)
    .order("created_at", { ascending: false })
    .limit(1)
  const lastInvoice = lastInvoices?.[0] ?? null

  // Query principal con filtros
  let query = supabase
    .from("invoices")
    .select("*, suppliers(name)")
    .eq("business_id", profile.business_id!)
    .eq("year", year)
    .order("invoice_date", { ascending: false })

  if (params.quarter) query = query.eq("quarter", parseInt(params.quarter))
  if (params.search) query = query.ilike("invoice_number", `%${params.search}%`)
  if (params.supplier) {
    const sup = supplierList?.find((s) => s.name === params.supplier)
    if (sup) query = query.eq("supplier_id", sup.id)
  }

  const { data: invoices } = await query

  // Otros documentos (no facturas de proveedor)
  const { data: otherDocs } = await supabase
    .from("other_documents")
    .select("id, original_filename, detected_type, reason, supplier_name, created_at")
    .eq("business_id", profile.business_id!)
    .order("created_at", { ascending: false })
    .limit(20)

  const totalBase = invoices?.reduce((s, i) => s + i.base_amount, 0) ?? 0
  const totalVat = invoices?.reduce((s, i) => s + i.vat_amount, 0) ?? 0
  const totalDeductible = invoices?.filter((i) => i.is_deductible).reduce((s, i) => s + i.vat_amount, 0) ?? 0

  return (
    <div className="space-y-6">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Facturas</h1>
          <p className="text-muted-foreground text-sm">Gestión de facturas de proveedores</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AutomationButton />
          <Button variant="outline" asChild className="gap-2">
            <Link href="/facturas/modelo-303">
              <BadgePercent className="h-4 w-4" />
              Modelo 303
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/facturas/importar">
              <FolderOpen className="h-4 w-4" />
              Importar
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/facturas/nueva">
              <Plus className="h-4 w-4" />
              Nueva factura
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <InvoiceFilters
        year={year}
        currentYear={currentYear}
        quarter={params.quarter}
        suppliers={supplierList ?? []}
        activeSupplier={params.supplier}
        search={params.search}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Base imponible", value: formatEur(totalBase), icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "IVA soportado", value: formatEur(totalVat), icon: Receipt, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "IVA deducible", value: formatEur(totalDeductible), icon: BadgePercent, color: "text-green-500", bg: "bg-green-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border bg-card p-5 flex items-center gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className="text-xl font-bold tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Última factura */}
      {lastInvoice && !params.search && !params.supplier && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Última factura subida</h2>
          </div>
          <div className="rounded-2xl border bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 p-4 flex items-center gap-4 flex-wrap">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{(lastInvoice as any).suppliers?.name ?? "Sin proveedor"}</p>
              <p className="text-xs text-muted-foreground">
                {lastInvoice.invoice_number} · {format(new Date(lastInvoice.invoice_date), "dd/MM/yyyy")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-primary text-lg tabular-nums">{formatEur(lastInvoice.total_amount)}</p>
              <p className="text-xs text-muted-foreground">IVA {lastInvoice.vat_rate}%</p>
            </div>
            <Badge variant={lastInvoice.is_deductible ? "default" : "secondary"} className="shrink-0">
              {lastInvoice.is_deductible ? "Deducible" : "No deducible"}
            </Badge>
          </div>
        </div>
      )}

      {/* Lista de facturas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {params.supplier ? `Facturas de ${params.supplier}` : params.search ? `Resultados: "${params.search}"` : "Todas las facturas"}
            {invoices?.length ? <span className="ml-2 text-xs bg-muted rounded-full px-2 py-0.5">{invoices.length}</span> : null}
          </h2>
        </div>

        {!invoices?.length ? (
          <div className="rounded-2xl border bg-card p-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No hay facturas en este período</p>
            <Button asChild size="sm" className="mt-4 gap-2">
              <Link href="/facturas/nueva"><Plus className="h-3.5 w-3.5" />Nueva factura</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nº Factura</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proveedor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Concepto</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">IVA</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">303</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {invoices.map((inv: any, i: number) => (
                    <tr key={inv.id} className={`transition-colors hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(inv.invoice_date), "dd/MM/yy")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-3 font-medium max-w-[140px] truncate">
                        {inv.suppliers?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate hidden md:table-cell">
                        {inv.concept ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatEur(inv.base_amount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                        {formatEur(inv.vat_amount)}<span className="text-xs ml-1 opacity-60">({inv.vat_rate}%)</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold">{formatEur(inv.total_amount)}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          inv.is_deductible
                            ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {inv.is_deductible ? "✓ Sí" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Otros documentos */}
      {otherDocs && otherDocs.length > 0 && (
        <div className="rounded-2xl overflow-hidden">
          <div className="bg-emerald-600 px-5 py-4 flex items-center gap-3">
            <Inbox className="h-5 w-5 text-white shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white">Otros documentos</p>
              <p className="text-xs text-emerald-100 mt-0.5">
                Documentos importados que no son facturas de proveedor — aquí no se pierden
              </p>
            </div>
            <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
              {otherDocs.length}
            </span>
          </div>
          <div className="border border-t-0 border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 divide-y divide-emerald-100 dark:divide-emerald-800/30">
            {otherDocs.map((doc: any) => (
              <div key={doc.id} className="flex items-start gap-3 px-5 py-3">
                <FileText className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 truncate">
                    {doc.original_filename}
                  </p>
                  {doc.reason && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{doc.reason}</p>
                  )}
                  {doc.supplier_name && (
                    <p className="text-xs text-emerald-500 dark:text-emerald-500 mt-0.5">
                      Entidad: {doc.supplier_name}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-emerald-500 shrink-0 mt-0.5 whitespace-nowrap">
                  {format(new Date(doc.created_at), "dd/MM/yy")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
