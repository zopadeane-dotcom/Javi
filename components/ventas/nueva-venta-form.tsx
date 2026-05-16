"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createSalesRecord } from "@/lib/actions/sales"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface NuevaVentaFormProps {
  onClose: () => void
}

export function NuevaVentaForm({ onClose }: NuevaVentaFormProps) {
  const [isPending, startTransition] = useTransition()
  const [source, setSource] = useState("manual")
  const [vatRate, setVatRate] = useState("10")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("source", source)
    formData.set("vat_rate", vatRate)

    startTransition(async () => {
      const result = await createSalesRecord(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Registro de ventas guardado")
        onClose()
      }
    })
  }

  return (
    <div className="rounded-2xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-rose-800 dark:text-rose-200">Nuevo registro de ventas</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Fuente */}
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Fuente</label>
            <Select value={source} onValueChange={(v) => { if (v) setSource(v) }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sumup">SumUp</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="tpv">TPV</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="manual">Otro / Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Período inicio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Período inicio</label>
            <Input
              type="date"
              name="period_start"
              required
              className="h-9 text-sm"
            />
          </div>

          {/* Período fin */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Período fin</label>
            <Input
              type="date"
              name="period_end"
              required
              className="h-9 text-sm"
            />
          </div>

          {/* Total ventas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Total ventas (€)</label>
            <Input
              type="number"
              name="total_sales"
              step="0.01"
              min="0"
              required
              placeholder="0,00"
              className="h-9 text-sm"
            />
          </div>

          {/* IVA aplicado */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">IVA aplicado %</label>
            <Select value={vatRate} onValueChange={(v) => { if (v) setVatRate(v) }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="4">4%</SelectItem>
                <SelectItem value="10">10%</SelectItem>
                <SelectItem value="21">21%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Notas (opcional)</label>
            <Textarea
              name="notes"
              rows={2}
              placeholder="Semana de Feria, promoción especial..."
              className="text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar registro"}
          </Button>
        </div>
      </form>
    </div>
  )
}
