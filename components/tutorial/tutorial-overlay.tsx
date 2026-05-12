"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { ArrowRight, ArrowLeft, X, CheckCircle } from "lucide-react"

interface Step {
  target?: string
  title: string
  description: string
  example?: string
  emoji: string
  tooltipSide?: "top" | "bottom" | "left" | "right"
}

const STEPS: Step[] = [
  {
    emoji: "🏠",
    title: "Tu centro de control",
    description: "Este es el Dashboard. De un vistazo ves cuántos trabajadores tienes activos, las facturas del trimestre, los controles de sanidad de hoy y el estado de los certificados.",
    example: "💡 Si ves un número en rojo, algo requiere tu atención urgente.",
  },
  {
    target: "[data-tour='trabajadores']",
    emoji: "👥",
    title: "Gestión de trabajadores",
    description: "Aquí registras a todo tu equipo: nombre, DNI, tipo de contrato, horas semanales... Todo lo que necesitas para cumplir con la normativa laboral española.",
    example: "💡 Cuando des de alta a un trabajador, puedes invitarle a la app para que fiche desde su móvil.",
    tooltipSide: "right",
  },
  {
    target: "[data-tour='fichajes']",
    emoji: "⏱️",
    title: "Fichajes y registro horario",
    description: "El Real Decreto-ley 8/2019 obliga a registrar la jornada de todos los trabajadores. Aquí tienes el historial completo y puedes exportar informes PDF firmables.",
    example: "💡 Cada trabajador puede fichar desde su propio móvil entrando con su cuenta.",
    tooltipSide: "right",
  },
  {
    target: "[data-tour='facturas']",
    emoji: "🧾",
    title: "Facturas de proveedores",
    description: "Registra cada factura que recibes de tus proveedores. Workie calcula el IVA automáticamente y lo agrupa por trimestre para que declares el Modelo 303 sin dolor de cabeza.",
    example: "💡 IVA al 10% para hostelería, 21% para el resto. Workie lo separa solo.",
    tooltipSide: "right",
  },
  {
    target: "[data-tour='sanidad']",
    emoji: "🛡️",
    title: "Módulo de Sanidad",
    description: "Cuatro herramientas de cumplimiento sanitario obligatorio: APPCC (temperaturas, limpieza, plagas), alérgenos de tus platos, fichas de proveedores homologados y certificados de manipuladores.",
    example: "💡 La carta de alérgenos es obligatoria por ley desde 2015. Puedes exportarla en PDF para colgarla en el local.",
    tooltipSide: "right",
  },
  {
    emoji: "🎉",
    title: "¡Ya lo sabes todo!",
    description: "Workie está diseñado para que no tengas que pensar en el papeleo. Registras, Workie organiza. ¿Tienes dudas? Pulsa el botón '?' en cualquier momento para relanzar este tour.",
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
    }, 220)
  }

  function finish() {
    setVisible(false)
    setTimeout(onFinish, 300)
  }

  const PAD = 12
  const spotStyle = targetRect
    ? {
        top: targetRect.top - PAD,
        left: targetRect.left - PAD,
        width: targetRect.width + PAD * 2,
        height: targetRect.height + PAD * 2,
      }
    : null

  // Posición del tooltip
  let tooltipStyle: React.CSSProperties = {}
  if (spotStyle) {
    const side = current.tooltipSide ?? "bottom"
    const GAP = 18
    if (side === "right") {
      tooltipStyle = {
        top: spotStyle.top + spotStyle.height / 2,
        left: spotStyle.left + spotStyle.width + GAP,
        transform: "translateY(-50%)",
      }
    } else {
      tooltipStyle = {
        top: spotStyle.top + spotStyle.height + GAP,
        left: "50%",
        transform: "translateX(-50%)",
      }
    }
  } else {
    tooltipStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    }
  }

  return (
    <div className="fixed inset-0 z-[199]" style={{ pointerEvents: "auto" }}>

      {/* Fondo oscuro — con agujero si hay target */}
      {spotStyle ? (
        <>
          {/* Cuatro franjas oscuras alrededor del spotlight */}
          <div className="absolute inset-0 bg-black/60" style={{
            clipPath: `polygon(
              0 0, 100% 0, 100% 100%, 0 100%,
              0 ${spotStyle.top}px,
              ${spotStyle.left}px ${spotStyle.top}px,
              ${spotStyle.left}px ${spotStyle.top + spotStyle.height}px,
              ${spotStyle.left + spotStyle.width}px ${spotStyle.top + spotStyle.height}px,
              ${spotStyle.left + spotStyle.width}px ${spotStyle.top}px,
              100% ${spotStyle.top}px,
              100% 100%, 0 100%
            )`,
          }} />
          {/* Borde brillante alrededor del elemento */}
          <div
            className="absolute rounded-2xl border-2 border-primary shadow-[0_0_0_4px_oklch(0.52_0.14_172/0.2)] transition-all duration-300"
            style={{ ...spotStyle, pointerEvents: "none" }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Tooltip / bocadillo */}
      <div
        className={`absolute z-10 w-80 transition-all duration-220 ease-out
          ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
        style={tooltipStyle}
      >
        {/* Flecha si tiene target a la derecha */}
        {spotStyle && current.tooltipSide === "right" && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2.5 w-0 h-0"
            style={{
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderRight: "10px solid white",
            }}
          />
        )}
        {/* Flecha si tiene target abajo */}
        {spotStyle && (!current.tooltipSide || current.tooltipSide === "bottom") && (
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2.5 w-0 h-0"
            style={{
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderBottom: "10px solid white",
            }}
          />
        )}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Cabecera */}
          <div className="bg-gradient-to-r from-sidebar to-[oklch(0.28_0.05_200)] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{current.emoji}</span>
                <span className="text-white font-bold text-base">{current.title}</span>
              </div>
              <button
                onClick={finish}
                className="text-white/40 hover:text-white/80 transition-colors ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">{current.description}</p>
            {current.example && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800 leading-relaxed">
                {current.example}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 flex items-center justify-between">
            {/* Puntos de progreso */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === step
                      ? "w-5 bg-primary"
                      : i < step
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {/* Navegación */}
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => goTo(step - 1)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Atrás
                </button>
              )}
              {isLast ? (
                <button
                  onClick={finish}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  ¡Empezar!
                </button>
              ) : (
                <button
                  onClick={() => goTo(step + 1)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
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
  )
}
