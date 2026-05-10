"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Props {
  year: number
  currentYear: number
  quarter?: string
}

export function InvoiceFilters({ year, currentYear, quarter }: Props) {
  return (
    <div className="flex gap-3 flex-wrap items-center">
      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">Año:</label>
        <select
          value={year}
          className="border rounded-md px-3 py-1.5 text-sm"
          onChange={(e) => {
            const url = new URL(window.location.href)
            url.searchParams.set("year", e.target.value)
            window.location.href = url.toString()
          }}
        >
          {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-1">
        {([null, 1, 2, 3, 4] as (number | null)[]).map((q) => (
          <Link
            key={q ?? "all"}
            href={q ? `?year=${year}&quarter=${q}` : `?year=${year}`}
            className={`inline-flex items-center justify-center rounded-lg border px-2.5 h-8 text-sm font-medium transition-all ${
              (quarter === String(q)) || (!quarter && q === null)
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-background border-border hover:bg-muted"
            }`}
          >
            {q ? `T${q}` : "Todo"}
          </Link>
        ))}
      </div>
    </div>
  )
}
