"use client"

import { useState } from "react"
import { X, Mail, HardDrive, Sparkles, Zap, CheckCircle } from "lucide-react"

export function AutomationButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all px-3 py-2 text-sm font-semibold text-primary hover:scale-[1.02]"
      >
        <Zap className="h-4 w-4" />
        Automatizar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-background rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border">

            {/* Cabecera con X visible */}
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-base">Automatizar facturas</p>
                  <p className="text-muted-foreground text-xs">Olvídate del papeleo manual</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contenido compacto */}
            <div className="px-6 py-5 space-y-3">

              {/* Activo */}
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-sm text-primary">Lectura automática de PDFs</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Sube el PDF → proveedor, fecha e IVA se rellenan solos</p>
                </div>
              </div>

              {/* Drive */}
              <div className="rounded-2xl border p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
                  <HardDrive className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Google Drive</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Descarga la factura de Drive y arrástrala aquí</p>
                </div>
              </div>

              {/* Email */}
              <div className="rounded-2xl border p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
                  <Mail className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Email</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Descarga el PDF del correo y súbelo a Workie</p>
                </div>
              </div>

              {/* Próximamente */}
              <div className="rounded-2xl border border-dashed p-4 flex items-center gap-3 opacity-50">
                <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Sincronización automática</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Próximamente — Drive y correo conectados directo</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-xl bg-primary text-primary-foreground font-bold py-3 text-sm hover:bg-primary/90 transition-colors"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
