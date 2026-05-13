"use client"

import { useEffect, useState } from "react"
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
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  function handleAction(fn: () => void) {
    setLeaving(true)
    setTimeout(fn, 350)
  }

  const features = [
    { emoji: "👥", label: "Trabajadores y fichajes" },
    { emoji: "🧾", label: "Facturas y Modelo 303" },
    { emoji: "🌡️", label: "APPCC y alérgenos" },
    { emoji: "📄", label: "Exportar a PDF" },
  ]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Fondo */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-350 ${visible && !leaving ? "opacity-100" : "opacity-0"}`}
        onClick={() => handleAction(onSkip)}
      />

      {/* Modal card */}
      <div
        className={`relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-350 ease-out
          ${visible && !leaving ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}
        `}
      >
        {/* Cabecera con degradado */}
        <div className="relative bg-gradient-to-br from-[oklch(0.185_0.035_225)] to-[oklch(0.28_0.06_200)] px-8 pt-10 pb-8 text-center overflow-hidden">
          {/* Círculos decorativos */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/20" />
          <div className="absolute -bottom-4 -left-6 w-24 h-24 rounded-full bg-primary/10" />

          {/* Botón cerrar */}
          <button
            onClick={() => handleAction(onSkip)}
            className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Logo */}
          <div className="relative inline-flex mb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white font-bold text-3xl shadow-lg shadow-primary/40">
              W
            </div>
            <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400">
              <Sparkles className="h-3 w-3 text-yellow-700" />
            </div>
          </div>

          <p className="text-white/60 text-sm font-medium tracking-widest uppercase mb-1">Bienvenido a</p>
          <h1
            className="text-white font-extrabold mb-1"
            style={{ fontSize: "2.25rem", lineHeight: 1.1, letterSpacing: "-0.03em" }}
          >
            Workie
          </h1>
          <p className="text-primary font-medium text-base">
            Trabajamos por ti.
          </p>
        </div>

        {/* Cuerpo */}
        <div className="px-8 py-6 space-y-5">
          <p
            className="text-center font-semibold text-gray-800"
            style={{ fontSize: "1.05rem" }}
          >
            Hola, {userName.split(" ")[0]} 👋 Todo listo para gestionar tu negocio.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2">
            {features.map(({ emoji, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5"
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-xs font-medium text-gray-700 leading-snug">{label}</span>
              </div>
            ))}
          </div>

          {/* Botones */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleAction(onStartTour)}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-white font-semibold py-3 text-sm shadow-md shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ letterSpacing: "0.01em" }}
            >
              <Sparkles className="h-4 w-4" />
              Empezar el tour guiado
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAction(onSkip)}
              className="w-full text-gray-400 text-sm hover:text-gray-600 transition-colors py-2 font-medium"
            >
              Explorar por mi cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
