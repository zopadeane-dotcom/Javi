"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Search, Calendar, ChevronLeft, ChevronRight, Building2, X } from "lucide-react"

interface Props {
  year: number
  currentYear: number
  quarter?: string
  suppliers: { id: string; name: string }[]
  activeSupplier?: string
  search?: string
}

const QUARTER_COLORS = [
  { q: null, label: "Todo", bg: "bg-muted", active: "bg-slate-700 text-white" },
  { q: 1, label: "T1", bg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40", active: "bg-sky-500 text-white border-transparent" },
  { q: 2, label: "T2", bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40", active: "bg-emerald-500 text-white border-transparent" },
  { q: 3, label: "T3", bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40", active: "bg-amber-500 text-white border-transparent" },
  { q: 4, label: "T4", bg: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40", active: "bg-violet-500 text-white border-transparent" },
]

export function InvoiceFilters({ year, currentYear, quarter, suppliers, activeSupplier, search }: Props) {
  const router = useRouter()
  const [searchVal, setSearchVal] = useState(search ?? "")

  const buildUrl = useCallback((overrides: Record<string, string | null>) => {
    const params = new URLSearchParams()
    const base: Record<string, string | null> = {
      year: String(year),
      quarter: quarter ?? null,
      supplier: activeSupplier ?? null,
      search: search ?? null,
      ...overrides,
    }
    Object.entries(base).forEach(([k, v]) => { if (v) params.set(k, v) })
    return `/facturas?${params.toString()}`
  }, [year, quarter, activeSupplier, search])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(buildUrl({ search: searchVal || null }))
  }

  return (
    <div className="space-y-3">
      {/* Fila 1: Año + Trimestres */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Selector de año */}
        <div className="flex items-center gap-1 rounded-2xl border bg-card shadow-sm px-1 py-1">
          <button
            onClick={() => router.push(buildUrl({ year: String(year - 1) }))}
            className="flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold tabular-nums">{year}</span>
          </div>
          <button
            onClick={() => router.push(buildUrl({ year: String(year + 1) }))}
            disabled={year >= currentYear}
            className="flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Trimestres */}
        <div className="flex items-center gap-1 rounded-2xl border bg-card shadow-sm p-1">
          {QUARTER_COLORS.map(({ q, label, bg, active }) => {
            const isActive = q === null ? !quarter : quarter === String(q)
            return (
              <button
                key={label}
                onClick={() => router.push(buildUrl({ quarter: q ? String(q) : null }))}
                className={`flex items-center justify-center rounded-xl px-3 h-7 text-xs font-bold border transition-all duration-150 ${
                  isActive ? active : `${bg} hover:opacity-80`
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Búsqueda por código */}
        <form onSubmit={handleSearch} className="flex items-center gap-1 rounded-2xl border bg-card shadow-sm px-3 py-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Código de factura..."
            className="bg-transparent text-sm outline-none w-36 placeholder:text-muted-foreground/60 py-0.5"
          />
          {searchVal && (
            <button
              type="button"
              onClick={() => { setSearchVal(""); router.push(buildUrl({ search: null })) }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Fila 2: Filtro por proveedor */}
      {suppliers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            Proveedor:
          </div>
          <button
            onClick={() => router.push(buildUrl({ supplier: null }))}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all duration-150 ${
              !activeSupplier
                ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            Todos
          </button>
          {suppliers.map((s) => {
            const isActive = activeSupplier === s.name
            return (
              <button
                key={s.id}
                onClick={() => router.push(buildUrl({ supplier: isActive ? null : s.name }))}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {s.name}
                {isActive && <X className="h-3 w-3" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
