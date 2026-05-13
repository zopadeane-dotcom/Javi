"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users } from "lucide-react"

const schema = z.object({
  email: z.string().email("Email no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})
type FormData = z.infer<typeof schema>

function WorkieLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="56" height="56" rx="16" fill="url(#logoGrad)" />
      <path
        d="M13 17L20.5 39L28 24L35.5 39L43 17"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.58 0.16 172)" />
          <stop offset="100%" stopColor="oklch(0.42 0.14 195)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const features = [
  { icon: "⏱️", text: "Fichajes legales (RDL 8/2019)" },
  { icon: "🧾", text: "Facturas y Modelo 303" },
  { icon: "🌡️", text: "APPCC y alérgenos" },
  { icon: "📄", text: "Informes PDF firmables" },
]

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      setError("Email o contraseña incorrectos")
      setLoading(false)
      return
    }
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">

      {/* ── PANEL IZQUIERDO — MARCA ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, oklch(0.14 0.030 225) 0%, oklch(0.18 0.040 215) 50%, oklch(0.16 0.045 200) 100%)" }}
      >
        {/* Patrón de puntos sutil */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, oklch(0.90 0.10 172) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Círculos de acento */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.15 172), transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.15 172), transparent 70%)" }} />

        {/* Contenido centrado */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-14 text-center">

          {/* Logo */}
          <div className="mb-8">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-3xl blur-2xl opacity-40 scale-110"
                  style={{ background: "oklch(0.55 0.15 172)" }}
                />
                <WorkieLogo size={72} />
              </div>
            </div>
            <h1
              className="text-white font-black tracking-tight leading-none mb-1"
              style={{ fontSize: "3.2rem", letterSpacing: "-0.04em" }}
            >
              Workie
            </h1>
            <p
              className="font-semibold tracking-wide"
              style={{ color: "oklch(0.70 0.12 172)", fontSize: "1rem" }}
            >
              Trabajamos por ti.
            </p>
          </div>

          {/* Claim principal */}
          <div className="space-y-3 mb-10 max-w-xs">
            <p
              className="text-white/90 font-semibold leading-snug"
              style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}
            >
              Todo el papeleo de tu bar o restaurante, en un solo lugar.
            </p>
            <p className="text-white/40 text-sm leading-relaxed">
              Diseñado para la hostelería española. Cumplimiento normativo sin complicaciones.
            </p>
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            {features.map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left"
                style={{ background: "oklch(1 0 0 / 0.06)", border: "1px solid oklch(1 0 0 / 0.08)" }}
              >
                <span className="text-base">{icon}</span>
                <span className="text-white/70 text-xs font-medium leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative px-14 pb-8 text-center">
          <p className="text-white/20 text-xs">
            © 2026 Workie · Legislación española
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO — FORMULARIO ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-7">

          {/* Logo mobile */}
          <div className="flex items-center gap-3 lg:hidden">
            <WorkieLogo size={40} />
            <span className="font-bold text-xl">Workie</span>
          </div>

          <div>
            <h2 className="font-bold text-foreground" style={{ fontSize: "1.6rem", letterSpacing: "-0.025em" }}>
              Bienvenido de nuevo
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Accede a tu cuenta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? "Entrando..." : "Iniciar sesión"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">o</span>
            </div>
          </div>

          <Link
            href="/unirse"
            className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all py-3 text-sm font-semibold text-primary"
          >
            <Users className="h-4 w-4" />
            Soy trabajador — Tengo un código de invitación
          </Link>

          <p className="text-sm text-muted-foreground text-center">
            ¿Eres el propietario del negocio?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Crear cuenta gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
