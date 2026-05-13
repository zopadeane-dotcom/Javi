"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowRight, ArrowLeft, X, CheckCircle, TrendingDown, Users, Clock, FileText, Thermometer } from "lucide-react"

/* ─── Previews visuales por paso ─── */

function PreviewDashboard() {
  return (
    <div className="grid grid-cols-2 gap-1.5 text-xs">
      {[
        { icon: Users, label: "Trabajadores activos", value: "4", color: "text-violet-600 bg-violet-50" },
        { icon: FileText, label: "Facturas T2", value: "12", color: "text-blue-600 bg-blue-50" },
        { icon: Thermometer, label: "APPCC hoy", value: "✓", color: "text-green-600 bg-green-50" },
        { icon: Clock, label: "En turno ahora", value: "2", color: "text-amber-600 bg-amber-50" },
      ].map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-2.5 py-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-400 text-[10px] leading-tight truncate">{label}</p>
            <p className="text-gray-800 font-bold text-sm leading-tight">{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function PreviewTrabajadores() {
  const workers = [
    { name: "Ana García", role: "Camarera", status: "Activo" },
    { name: "Luis Martín", role: "Cocinero", status: "En turno" },
    { name: "Sara López", role: "Barra", status: "Activo" },
  ]
  return (
    <div className="space-y-1.5">
      {workers.map((w) => (
        <div key={w.name} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-xs">
              {w.name[0]}
            </div>
            <div>
              <p className="text-gray-800 font-medium text-xs">{w.name}</p>
              <p className="text-gray-400 text-[10px]">{w.role}</p>
            </div>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            w.status === "En turno" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>{w.status}</span>
        </div>
      ))}
    </div>
  )
}

function PreviewFichajes() {
  const records = [
    { name: "Ana García", in: "08:02", out: "16:15", h: "8h 13min" },
    { name: "Luis Martín", in: "09:00", out: null, h: "En turno" },
    { name: "Sara López", in: "12:30", out: "20:45", h: "8h 15min" },
  ]
  return (
    <div className="space-y-1.5">
      {records.map((r) => (
        <div key={r.name} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-3 py-2">
          <div>
            <p className="text-gray-800 font-medium text-xs">{r.name}</p>
            <p className="text-gray-400 text-[10px]">Entrada {r.in} · {r.out ? `Salida ${r.out}` : "Aún trabajando"}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            r.out === null ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-600"
          }`}>{r.h}</span>
        </div>
      ))}
    </div>
  )
}

function PreviewFacturas() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl bg-white border border-gray-100 p-3 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-800 font-semibold text-xs">Makro España S.A.</p>
            <p className="text-gray-400 text-[10px]">Nº F-2024-0891 · 08/05/2026</p>
          </div>
          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Deducible</span>
        </div>
        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-gray-100">
          <div>
            <p className="text-[9px] text-gray-400">Base</p>
            <p className="text-xs font-bold text-gray-700">842,50 €</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400">IVA 10%</p>
            <p className="text-xs font-bold text-gray-700">84,25 €</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400">Total</p>
            <p className="text-xs font-bold text-primary">926,75 €</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-green-50 border border-green-200 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-[10px] text-green-700 font-semibold">IVA deducible T2 (Casilla 28)</p>
            <p className="text-[9px] text-green-600">Listo para el Modelo 303 de la AEAT</p>
          </div>
        </div>
        <p className="text-sm font-extrabold text-green-700">312,40 €</p>
      </div>
    </div>
  )
}

function PreviewSanidad() {
  const allergens = ["Gluten ✓", "Lácteos ✓", "Huevos ✓", "Frutos secos —"]
  return (
    <div className="space-y-1.5">
      <div className="rounded-xl bg-white border border-gray-100 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-800 font-semibold text-xs">🌡️ Cámara frigorífica 1</p>
          <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">3,2 °C · OK</span>
        </div>
        <p className="text-[9px] text-gray-400">Rango aceptable: 0–8 °C · Registrado hoy 08:15</p>
      </div>
      <div className="rounded-xl bg-white border border-gray-100 p-3">
        <p className="text-gray-800 font-semibold text-xs mb-1.5">🥗 Ensalada César — Alérgenos</p>
        <div className="flex flex-wrap gap-1">
          {allergens.map((a) => (
            <span key={a} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              a.includes("✓") ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-400"
            }`}>{a}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewFinal() {
  return (
    <div className="flex flex-col items-center justify-center py-3 space-y-2">
      <div className="flex gap-2">
        {["👥", "⏱️", "🧾", "🛡️"].map((e) => (
          <div key={e} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-gray-100 text-xl shadow-sm">
            {e}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 text-center">Todo en un solo lugar. Sin papeles. Sin estrés.</p>
    </div>
  )
}

/* ─── Pasos ─── */

interface Step {
  target?: string
  title: string
  description: string
  tip: string
  emoji: string
  preview: React.ReactNode
  side?: "right" | "left" | "top" | "bottom"
}

const STEPS: Step[] = [
  {
    emoji: "🏠",
    title: "Tu centro de control",
    description: "El Dashboard te muestra de un vistazo lo más importante: trabajadores activos, facturas del trimestre, controles sanitarios de hoy y el estado de los certificados.",
    tip: "Si aparece un número en rojo, algo requiere atención urgente.",
    preview: <PreviewDashboard />,
  },
  {
    target: "[data-tour='trabajadores']",
    emoji: "👥",
    title: "Gestión de trabajadores",
    description: "Registra a todo tu equipo con todos sus datos laborales. Workie lleva el control de contratos, bajas y horas.",
    tip: "Tras dar de alta a un trabajador puedes invitarle a fichar desde su propio móvil.",
    preview: <PreviewTrabajadores />,
    side: "right",
  },
  {
    target: "[data-tour='fichajes']",
    emoji: "⏱️",
    title: "Fichajes y registro horario",
    description: "El Real Decreto-ley 8/2019 obliga a registrar la jornada de todos los trabajadores. Aquí tienes el historial y puedes exportar informes PDF firmables.",
    tip: "Cada trabajador puede fichar desde su móvil con su cuenta de Workie.",
    preview: <PreviewFichajes />,
    side: "right",
  },
  {
    target: "[data-tour='facturas']",
    emoji: "🧾",
    title: "Facturas y Modelo 303",
    description: "Registra cada factura de tus proveedores. Workie calcula el IVA al 10% (hostelería) o 21% y lo agrupa por trimestre para la declaración.",
    tip: "El IVA deducible de la casilla 28 lo calcula Workie automáticamente. Solo tienes que copiarlo en la AEAT.",
    preview: <PreviewFacturas />,
    side: "right",
  },
  {
    target: "[data-tour='sanidad']",
    emoji: "🛡️",
    title: "Módulo de Sanidad",
    description: "APPCC, carta de alérgenos, fichas de proveedores y certificados de manipuladores. Todo lo que pide una inspección sanitaria.",
    tip: "La carta de alérgenos es obligatoria por ley desde 2015. Exporta el PDF y cuélgala en el local.",
    preview: <PreviewSanidad />,
    side: "right",
  },
  {
    emoji: "🎉",
    title: "¡Ya lo tienes todo!",
    description: "Workie está hecho para que no tengas que pensar en el papeleo. Tú registras, Workie organiza. Pulsa el botón ⓘ en cualquier momento para repetir este tour.",
    tip: "Empieza añadiendo tus trabajadores y tu primera factura. ¡En 5 minutos lo tienes todo en marcha!",
    preview: <PreviewFinal />,
  },
]

/* ─── Lógica de posicionamiento ─── */

interface Rect { top: number; left: number; width: number; height: number }

function getTooltipPosition(
  spot: { top: number; left: number; width: number; height: number } | null,
  side?: string
): React.CSSProperties {
  if (!spot) {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
  }

  const TOOLTIP_W = 360
  const GAP = 20
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200
  const vh = typeof window !== "undefined" ? window.innerHeight : 800

  if (side === "right") {
    const left = spot.left + spot.width + GAP
    const top = Math.min(
      Math.max(spot.top + spot.height / 2 - 200, 16),
      vh - 420
    )
    // Si no cabe a la derecha, ir al centro
    if (left + TOOLTIP_W > vw - 16) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    }
    return { top, left }
  }

  return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
}

/* ─── Componente principal ─── */

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

  const tooltipStyle = getTooltipPosition(spotStyle, current.side)

  return (
    <div className="fixed inset-0 z-[199]">

      {/* Fondo oscuro con agujero */}
      {spotStyle ? (
        <div
          className="absolute inset-0 bg-black/60"
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
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Borde del spotlight */}
      {spotStyle && (
        <div
          className="absolute rounded-xl border-2 border-primary pointer-events-none transition-all duration-300"
          style={{
            ...spotStyle,
            boxShadow: "0 0 0 4px oklch(0.52 0.14 172 / 0.20), 0 0 24px oklch(0.52 0.14 172 / 0.15)",
          }}
        />
      )}

      {/* Bocadillo */}
      <div
        className={`absolute z-10 w-[360px] transition-all duration-200 ease-out
          ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
        style={tooltipStyle}
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

          {/* Cabecera */}
          <div className="bg-gradient-to-br from-[oklch(0.185_0.035_225)] to-[oklch(0.30_0.06_210)] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-xl shrink-0">
                  {current.emoji}
                </div>
                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-0.5">
                    {step + 1} / {STEPS.length}
                  </p>
                  <p className="text-white font-bold text-lg leading-tight" style={{ letterSpacing: "-0.02em" }}>
                    {current.title}
                  </p>
                </div>
              </div>
              <button onClick={finish} className="text-white/30 hover:text-white/70 transition-colors p-1 ml-1 shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Descripción */}
          <div className="px-5 pt-4 pb-3">
            <p className="text-gray-700 leading-relaxed text-[0.95rem]">
              {current.description}
            </p>
          </div>

          {/* Preview visual */}
          <div className="px-5 pb-3">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
              {current.preview}
            </div>
          </div>

          {/* Tip */}
          <div className="px-5 pb-4">
            <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-4 flex gap-3">
              <span className="text-xl shrink-0 mt-0.5">💡</span>
              <p className="text-amber-900 text-[0.92rem] leading-relaxed font-semibold">
                {current.tip}
              </p>
            </div>
          </div>

          {/* Footer navegación */}
          <div className="px-5 pb-5 flex items-center justify-between border-t border-gray-100 pt-3">
            <div className="flex gap-1.5 items-center">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === step ? "w-5 h-2 bg-primary" : i < step ? "w-2 h-2 bg-primary/30" : "w-2 h-2 bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => goTo(step - 1)}
                  className="flex items-center gap-1 text-[0.75rem] text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-gray-100 font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Atrás
                </button>
              )}
              {isLast ? (
                <button
                  onClick={finish}
                  className="flex items-center gap-1.5 text-[0.75rem] font-semibold bg-primary text-white px-4 py-1.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  ¡Empezar!
                </button>
              ) : (
                <button
                  onClick={() => goTo(step + 1)}
                  className="flex items-center gap-1.5 text-[0.75rem] font-semibold bg-primary text-white px-4 py-1.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
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
