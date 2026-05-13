"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { registerWithInvite } from "@/lib/actions/invitations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

const schema = z.object({
  code: z.string().min(6, "Código inválido"),
  full_name: z.string().min(2, "Nombre obligatorio"),
  email: z.string().email("Email no válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})
type FormData = z.infer<typeof schema>

function JoinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { code: searchParams.get("codigo") ?? "" },
  })

  useEffect(() => {
    const c = searchParams.get("codigo")
    if (c) setValue("code", c.toUpperCase())
  }, [searchParams, setValue])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    const fd = new FormData()
    fd.append("code", data.code.toUpperCase())
    fd.append("full_name", data.full_name)
    fd.append("email", data.email)
    fd.append("password", data.password)
    const result = await registerWithInvite(fd)
    if (result?.error) { setError(result.error); setLoading(false); return }
    setSuccess(result.businessName ?? "Tu negocio")
    setTimeout(() => router.push("/portal/fichar"), 2500)
  }

  if (success) {
    return (
      <div className="text-center space-y-4 max-w-sm mx-auto">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">¡Ya eres parte del equipo!</h1>
        <p className="text-muted-foreground">
          Te has unido a <strong>{success}</strong>. En un momento te redirigimos.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6 mx-auto">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-2xl shadow-lg">
            W
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-primary">
          <Users className="h-5 w-5" />
          <h1 className="text-xl font-bold">Unirse al equipo</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Tu jefe te ha invitado a Workie. Crea tu cuenta para empezar a fichar.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="space-y-1.5">
          <Label htmlFor="code">Código de invitación</Label>
          <Input
            id="code"
            placeholder="Ej: AB3F8C2D"
            className="font-mono text-center tracking-widest uppercase text-lg h-12"
            {...register("code")}
            onChange={(e) => setValue("code", e.target.value.toUpperCase())}
          />
          {errors.code && <p className="text-destructive text-xs">{errors.code.message}</p>}
          <p className="text-xs text-muted-foreground">Pídele el código a tu encargado</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="full_name">Tu nombre completo</Label>
          <Input id="full_name" placeholder="Ana García" {...register("full_name")} />
          {errors.full_name && <p className="text-destructive text-xs">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Tu email</Label>
          <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Elige una contraseña</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando cuenta..." : "Unirme al equipo"}
        </Button>
      </form>

      <p className="text-center">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
          <ArrowLeft className="h-3 w-3" />Volver al inicio de sesión
        </Link>
      </p>
    </div>
  )
}

export default function UnirsePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={<div className="text-muted-foreground">Cargando...</div>}>
        <JoinForm />
      </Suspense>
    </div>
  )
}
