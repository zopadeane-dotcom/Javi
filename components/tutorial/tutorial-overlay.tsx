"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowRight, ArrowLeft, X, CheckCircle } from "lucide-react"

interface Step {
  target?: string
  title: string
  description: string
  example?: string
  emoji: string
}

const STEPS: Step[] = [
  {
    emoji: "🏠",
    title: "Tu centro de control",
    description: "El Dashboard te muestra de un vistazo lo más importante: trabajadores activos, facturas del trimestre, controles sanitarios de hoy y el estado de los certificados.",
    example: "💡 Si aparece un número en rojo, algo requiere atención urgente.",
  },
  {
    target: "[data-tour='trabajadores']",
    emoji: "👥",
    title: "Gestión de trabajadores",
    description: "Aquí registras a todo tu equipo: nombre, DNI, tipo de contrato, horas semanales... Todo lo necesario para cumplir la normativa laboral española.",
    example: "💡 Tras dar de alta a un trabajador puedes invitarle a la app para que fiche desde su móvil.",
  },
  {
    target: "[data-tour='fichajes']",
    emoji: "⏱️",
    title: "Fichajes y registro horario",
    description: "El Real Decreto-ley 8/2019 obliga a registrar la jornada de todos los trabajadores. Aquí tienes el historial completo y puedes exportar informes PDF firmables.",
    example: "💡 Cada trabajador puede fichar desde su propio móvil con su cuenta.",
  },
  {
    target: "[data-tour='facturas']",
    emoji: "🧾",
    title: "Facturas de proveedores",
    description: "Registra cada factura que recibes. Workie calcula el IVA automáticamente y lo agrupa por trimestre para el Modelo 303.",
    example: "💡 IVA al 10% para hostelería, 21% para el resto. Workie lo separa solo.",
  },
  {
    target: "[data-tour='sanidad']",
    emoji: "🛡️",
    title: "Módulo de Sanidad",
    description: "Cuatro herramientas de cumplimiento obligatorio: APPCC (temperaturas, limpieza, plagas), carta de alérgenos, fichas de proveedores y certificados de manipuladores.",
    example: "💡 La carta de alérgenos es obligatoria por ley desde 2015. Puedes imprimirla en PDF para colgarla en el local.",
  },
  {
    emoji: "🎉",
    title: "¡Ya lo tienes todo!",
    description: "Workie está hecho para que no tengas que pensar en el papeleo. Tú registras, Workie organiza. Pulsa el botón ⓘ en cualquier momento para volver a ver este tour.",
    example: "💡 Empieza añadiendo tus trabajadores y tu primera factura.",
  },
]

interface Rect { top: number; left: number; width: number; height: number }

export function TutorialOverlay({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const measureTarget = useCallback(() => {
    const sel = STEPS[step]?.target
    if (!sel) { setTargetRect(null); return }
    const el = document.querySelector(sel)
    if (!el) { setTargetRect(null); return }
    const r = el.getBoundingClientRect()
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    measureTarget()
    window.addEventListener("resize", measureTarget)
    return () => window.removeEventListener("resize", measureTarget)
  }, [measureTarget])

  function goTo(next: number) {
    if (animating) return
    setAnimating(true)
    setVisible(false)
    setTimeout(() => {
      setStep(next)
      setVisible(true)
      setAnimating(false)
    }, 200)
  }

  function finish() {
    setVisible(false)
    setTimeout(onFinish, 280)
  }

  const PAD = 10
  const spotStyle = targetRect
    ? {
        top: targetRect.top - PAD,
        left: targetRect.left - PAD,
        width: targetRect.width + PAD * 2,
        height: targetRect.height + PAD * 2,
      }
    : null

  return (
    <div className="fixed inset-0 z-[199]">
      {/* Fondo oscuro */}
      {spotStyle ? (
        <div
          className="absolute inset-0 bg-black/65"
          style={{
            clipPath: `polygon(
              0% 0%, 100% 0%, 100% 100%, 0% 100%,
              0% ${spotStyle.top}px,
              ${spotStyle.left}px ${spotStyle.top}px,
              ${spotStyle.left}px ${spotStyle.top + spotStyle.height}px,
              ${spotStyle.left + spotStyle.width}px ${spotStyle.top + spotStyle.height}px,
              ${spotStyle.left + spotStyle.width}px ${spotStyle.top}px,
              100% ${spotStyle.top}px,
              100% 100%, 0% 100%
            )`,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/65" />
      )}

      {/* Borde brillante alrededor del spotlight */}
      {spotStyle && (
        <div
          className="absolute rounded-xl border-2 border-primary pointer-events-none"
          style={{
            ...spotStyle,
            boxShadow: "0 0 0 4px oklch(0.52 0.14 172 / 0.25)",
            transition: "all 0.3s ease",
          }}
        />
      )}

      {/* Bocadillo — siempre centrado en pantalla */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-sm mx-4 transition-all duration-200 ease-out
            ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3"}
          `}
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Cabecera */}
            <div className="bg-gradient-to-r from-[oklch(0.185_0.035_225)] to-[oklch(0.30_0.06_210)] px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white/15 text-2xl"
                  >
                    {current.emoji}
                  </span>
                  <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
                      Paso {step + 1} de {STEPS.length}
                    </p>
                    <p
                      className="text-white font-bold leading-tight"
                      style={{ fontSize: "1rem", letterSpacing: "-0.01em" }}
                    >
                      {current.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={finish}
                  className="text-white/30 hover:text-white/70 transition-colors p-1 ml-2 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="px-6 py-5 space-y-3">
              <p
                className="text-gray-700 leading-relaxed"
                style={{ fontSize: "0.875rem" }}
              >
                {current.description}
              </p>
              {current.example && (
                <div className="flex gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-amber-800 leading-relaxed" style={{ fontSize: "0.8rem" }}>
                    {current.example}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex items-center justify-between">
              {/* Puntos de progreso */}
              <div className="flex gap-1.5 items-center">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === step
                        ? "w-5 h-2 bg-primary"
                        : i < step
                        ? "w-2 h-2 bg-primary/35"
                        : "w-2 h-2 bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Navegación */}
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => goTo(step - 1)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-2 rounded-xl hover:bg-gray-100 font-medium"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Atrás
                  </button>
                )}
                {isLast ? (
                  <button
                    onClick={finish}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    ¡Empezar!
                  </button>
                ) : (
                  <button
                    onClick={() => goTo(step + 1)}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                  >
                    Siguiente
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
