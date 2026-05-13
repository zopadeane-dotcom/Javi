"use client"

import { useEffect, useState } from "react"
import { ArrowRight, X, Sparkles } from "lucide-react"

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
    setTimeout(fn, 380)
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
        className={`absolute inset-0 backdrop-blur-md transition-opacity duration-380 ${visible && !leaving ? "opacity-100" : "opacity-0"}`}
        style={{ background: "oklch(0.08 0.02 225 / 0.85)" }}
        onClick={() => handleAction(onSkip)}
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transition-all duration-380 ease-out
          ${visible && !leaving ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"}
        `}
        style={{ background: "oklch(0.185 0.035 225)" }}
      >
        {/* Cerrar */}
        <button
          onClick={() => handleAction(onSkip)}
          className="absolute top-4 right-4 z-10 text-white/30 hover:text-white/70 transition-colors p-1"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Cabecera — logo grande */}
        <div className="relative px-8 pt-12 pb-8 text-center overflow-hidden">
          {/* Círculos decorativos de fondo */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, oklch(0.52 0.14 172), transparent)" }} />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-15"
              style={{ background: "radial-gradient(circle, oklch(0.52 0.14 172), transparent)" }} />
          </div>

          {/* Logo principal */}
          <div className="relative inline-flex flex-col items-center mb-6">
            <div className="relative mb-4">
              {/* Anillo exterior brillante */}
              <div
                className="absolute inset-0 rounded-3xl animate-pulse"
                style={{
                  background: "oklch(0.52 0.14 172 / 0.3)",
                  transform: "scale(1.15)",
                  filter: "blur(8px)",
                }}
              />
              {/* Logo W */}
              <div
                className="relative flex h-24 w-24 items-center justify-center rounded-3xl text-white font-black shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, oklch(0.55 0.15 172), oklch(0.45 0.13 190))",
                  fontSize: "2.8rem",
                  letterSpacing: "-0.04em",
                  boxShadow: "0 20px 60px oklch(0.52 0.14 172 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.2)",
                }}
              >
                W
              </div>
              {/* Estrella */}
              <div
                className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full shadow-lg"
                style={{ background: "oklch(0.85 0.15 85)" }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: "oklch(0.45 0.12 85)" }} />
              </div>
            </div>

            {/* Nombre */}
            <h1
              className="text-white font-black tracking-tight leading-none"
              style={{ fontSize: "3rem", letterSpacing: "-0.04em" }}
            >
              Workie
            </h1>
            {/* Tagline */}
            <p
              className="font-semibold mt-1.5"
              style={{ color: "oklch(0.65 0.12 172)", fontSize: "1rem", letterSpacing: "0.01em" }}
            >
              Trabajamos por ti.
            </p>
          </div>

          {/* Saludo */}
          <p className="text-white/70 text-sm leading-relaxed">
            Hola, <span className="text-white font-semibold">{userName.split(" ")[0]}</span> 👋
            <br />Todo listo para gestionar tu negocio.
          </p>
        </div>

        {/* Cuerpo */}
        <div className="bg-white px-8 pb-7 pt-6 space-y-5 rounded-t-3xl">
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
          <div className="space-y-2">
            <button
              onClick={() => handleAction(onStartTour)}
              className="flex items-center justify-center gap-2 w-full rounded-xl text-white font-bold py-3.5 text-sm shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, oklch(0.52 0.14 172), oklch(0.45 0.13 190))",
                boxShadow: "0 8px 24px oklch(0.52 0.14 172 / 0.35)",
                letterSpacing: "0.01em",
              }}
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
