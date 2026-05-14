"use client"

import { useState } from "react"
import { X, Mail, HardDrive, Sparkles, Zap, CheckCircle, ChevronRight } from "lucide-react"

export function AutomationButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all px-3 py-2 text-sm font-semibold text-primary hover:scale-[1.02]"
      >
        <Zap className="h-4 w-4" />
        Automatizar facturas
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border">

            {/* Cabecera */}
            <div className="relative overflow-hidden px-6 py-6"
              style={{ background: "linear-gradient(135deg, oklch(0.185 0.035 225), oklch(0.25 0.06 200))" }}>
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
                style={{ background: "radial-gradient(circle, oklch(0.55 0.15 172), transparent)" }} />
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/30">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">Automatizar facturas</p>
                  <p className="text-white/50 text-sm">Conecta tus fuentes y olvídate del papeleo</p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="px-6 py-5 space-y-4">

              {/* Lo que ya funciona */}
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold text-primary">Ya activo: IA que lee tus facturas</p>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Sube una foto o PDF de cualquier factura y la IA extrae automáticamente el proveedor,
                  fecha, importes e IVA. Solo tienes que revisar y confirmar.
                </p>
              </div>

              {/* Google Drive */}
              <div className="rounded-2xl border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
                    <HardDrive className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Google Drive</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Guarda tus facturas en una carpeta de Drive y súbelas directamente a Workie pegando el enlace.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 space-y-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Cómo hacerlo:</p>
                  <div className="space-y-1.5">
                    {[
                      "Guarda la factura en Google Drive",
                      "Haz click derecho → Compartir → \"Cualquiera con el enlace\"",
                      "Copia el enlace y pégalo en Workie al subir la factura",
                    ].map((step, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">{i + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="rounded-2xl border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
                    <Mail className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Correo electrónico</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cuando recibes una factura por email, descarga el adjunto y arrástralo directamente a Workie.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 space-y-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">El truco más rápido:</p>
                  <div className="space-y-1.5">
                    {[
                      "Abre el email con la factura",
                      "Descarga el PDF adjunto",
                      "Ve a Workie → Nueva factura → arrastra el PDF",
                      "La IA lo lee y rellena todo en segundos",
                    ].map((step, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 text-[10px] font-bold">{i + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Próximamente */}
              <div className="rounded-2xl border border-dashed p-4 flex items-center gap-3 opacity-60">
                <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Sincronización automática — Próximamente</p>
                  <p className="text-xs text-muted-foreground">
                    Conecta tu carpeta de Drive o tu correo y Workie importará las facturas solo, sin que hagas nada.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 text-sm hover:bg-primary/90 transition-colors"
              >
                Entendido, ¡a facturar!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
