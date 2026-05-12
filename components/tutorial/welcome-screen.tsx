"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, X } from "lucide-react"

interface Props {
  userName: string
  onStartTour: () => void
  onSkip: () => void
}

export function WelcomeScreen({ userName, onStartTour, onSkip }: Props) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  function handleAction(fn: () => void) {
    setLeaving(true)
    setTimeout(fn, 400)
  }

  const features = [
    { emoji: "👥", label: "Trabajadores y fichajes", desc: "Cumple el RDL 8/2019 sin esfuerzo" },
    { emoji: "🧾", label: "Facturas y Modelo 303", desc: "IVA soportado listo para la AEAT" },
    { emoji: "🌡️", label: "APPCC y alérgenos", desc: "Inspecciones sanitarias cubiertas" },
    { emoji: "📄", label: "Exportar a PDF", desc: "Informes firmables en un click" },
  ]

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-400 ease-out
        ${visible && !leaving ? "opacity-100" : "opacity-0"}
      `}
      style={{ backdropFilter: "blur(2px)" }}
    >
      {/* Fondo degradado */}
      <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-[oklch(0.25_0.06_200)]" />

      {/* Partículas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/20 animate-pulse"
            style={{
              width: `${[120, 80, 200, 60, 150, 90][i]}px`,
              height: `${[120, 80, 200, 60, 150, 90][i]}px`,
              top: `${[10, 60, 30, 80, 5, 70][i]}%`,
              left: `${[5, 80, 50, 20, 70, 40][i]}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + i * 0.5}s`,
              opacity: 0.15,
            }}
          />
        ))}
      </div>

      {/* Botón cerrar */}
      <button
        onClick={() => handleAction(onSkip)}
        className="absolute top-5 right-5 text-white/40 hover:text-white/80 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Contenido */}
      <div
        className={`relative z-10 max-w-lg w-full mx-4 text-center transition-all duration-400 ease-out
          ${visible && !leaving ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
        `}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-white font-bold text-4xl shadow-2xl shadow-primary/40">
              W
            </div>
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 shadow-lg">
              <Sparkles className="h-3 w-3 text-yellow-800" />
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-4xl font-bold text-white mb-2">
          Hola, {userName.split(" ")[0]} 👋
        </h1>
        <p className="text-2xl font-semibold text-primary mb-1">
          Workie
        </p>
        <p className="text-white/60 text-lg mb-8">
          Trabajamos por ti.
        </p>

        {/* Features grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {features.map(({ emoji, label, desc }) => (
            <div
              key={label}
              className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 text-left hover:bg-white/15 transition-colors"
            >
              <span className="text-2xl">{emoji}</span>
              <p className="text-white font-medium text-sm mt-2">{label}</p>
              <p className="text-white/50 text-xs mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleAction(onStartTour)}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-white font-semibold py-3.5 text-base shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            Empezar el tour guiado
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleAction(onSkip)}
            className="text-white/40 text-sm hover:text-white/70 transition-colors py-1"
          >
            Explorar por mi cuenta
          </button>
        </div>
      </div>
    </div>
  )
}
