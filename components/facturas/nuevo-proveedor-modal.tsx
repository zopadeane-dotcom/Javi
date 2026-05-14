"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createSupplier } from "@/lib/actions/invoices"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Building2 } from "lucide-react"

interface Props {
  onCreated: (supplier: { id: string; name: string }) => void
  onClose: () => void
  defaultName?: string
  defaultNif?: string
}

export function NuevoProveedorModal({ onCreated, onClose, defaultName, defaultNif }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await createSupplier(fd)
    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success("Proveedor creado")
    // Refresh suppliers list in parent
    onCreated({ id: result.id as string, name: fd.get("name") as string })
    onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border">
        <div className="bg-gradient-to-r from-primary to-[oklch(0.44_0.14_195)] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <p className="text-white font-bold">Nuevo proveedor</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Nombre *</Label>
            <Input id="p-name" name="name" placeholder="Makro España S.A." required defaultValue={defaultName} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-nif">NIF / CIF</Label>
            <Input id="p-nif" name="nif" placeholder="A12345678" defaultValue={defaultNif} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-email">Email</Label>
              <Input id="p-email" name="email" type="email" placeholder="proveedor@ejemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-phone">Teléfono</Label>
              <Input id="p-phone" name="phone" placeholder="600 000 000" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Guardando..." : "Crear proveedor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
