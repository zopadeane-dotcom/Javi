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

const schema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  business_name: z.string().min(2, "El nombre del negocio es obligatorio"),
  cif: z.string().min(9, "El CIF debe tener 9 caracteres").max(9),
})
type FormData = z.infer<typeof schema>

function WorkieLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="56" height="56" rx="16" fill="url(#logoGradR)" />
      <path d="M13 17L20.5 39L28 24L35.5 39L43 17" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="logoGradR" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.58 0.16 172)" />
          <stop offset="100%" stopColor="oklch(0.42 0.14 195)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          business_name: data.business_name,
          cif: data.cif,
          role: "admin",
        },
      },
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, oklch(0.14 0.030 225) 0%, oklch(0.18 0.040 215) 50%, oklch(0.16 0.045 200) 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, oklch(0.90 0.10 172) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.15 172), transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.15 172), transparent 70%)" }} />

        <div className="relative flex-1 flex flex-col items-center justify-center px-14 text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl blur-2xl opacity-40 scale-110"
                  style={{ background: "oklch(0.55 0.15 172)" }} />
                <WorkieLogo size={72} />
              </div>
            </div>
            <h1 className="text-white font-black tracking-tight leading-none mb-1"
              style={{ fontSize: "3.2rem", letterSpacing: "-0.04em" }}>
              Workie
            </h1>
            <p className="font-semibold tracking-wide"
              style={{ color: "oklch(0.70 0.12 172)", fontSize: "1rem" }}>
              Trabajamos por ti.
            </p>
          </div>

          <div className="space-y-3 mb-8 max-w-xs">
            <p className="text-white/90 font-semibold leading-snug"
              style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}>
              Empieza gratis hoy mismo.
            </p>
            <p className="text-white/40 text-sm leading-relaxed">
              En menos de 2 minutos tienes tu negocio configurado y listo para operar.
            </p>
          </div>

          <div className="space-y-2.5 w-full max-w-xs">
            {["Sin permanencia ni compromisos", "Todos los módulos incluidos", "Soporte en español", "Actualizado con la ley española"].map((t) => (
              <div key={t} className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "oklch(0.52 0.14 172 / 0.3)" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="oklch(0.75 0.12 172)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-white/60 text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative px-14 pb-8 text-center">
          <p className="text-white/20 text-xs">© 2026 Workie · Legislación española</p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-3 lg:hidden">
            <WorkieLogo size={40} />
            <span className="font-bold text-xl">Workie</span>
          </div>

          <div>
            <h2 className="font-bold text-foreground" style={{ fontSize: "1.6rem", letterSpacing: "-0.025em" }}>
              Crea tu cuenta
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Regístra tu negocio y empieza a gestionar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Tu nombre completo</Label>
              <Input id="full_name" placeholder="Ana García" {...register("full_name")} />
              {errors.full_name && <p className="text-destructive text-xs">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Mínimo 6 caracteres" {...register("password")} />
              {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="business_name">Nombre del negocio</Label>
                <Input id="business_name" placeholder="Bar El Ejemplo" {...register("business_name")} />
                {errors.business_name && <p className="text-destructive text-xs">{errors.business_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cif">CIF / NIF</Label>
                <Input id="cif" placeholder="B12345678" {...register("cif")} />
                {errors.cif && <p className="text-destructive text-xs">{errors.cif.message}</p>}
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading || isSubmitting}>
              {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
