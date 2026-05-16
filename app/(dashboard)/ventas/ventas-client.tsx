"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NuevaVentaForm } from "@/components/ventas/nueva-venta-form"

export function VentasActions() {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      <Button onClick={() => setShowForm((v) => !v)}>
        <Plus className="h-4 w-4 mr-2" />
        Registrar ventas
      </Button>

      {showForm && (
        <div className="mt-4">
          <NuevaVentaForm onClose={() => setShowForm(false)} />
        </div>
      )}
    </>
  )
}
