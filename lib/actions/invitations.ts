"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function generateInviteCode() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles").select("business_id, role").eq("id", user.id).single()
  if (!profile || (profile as any).role !== "admin") return { error: "Sin permisos" }

  const { data: business } = await supabase
    .from("businesses").select("name").eq("id", (profile as any).business_id).single()

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      business_id: (profile as any).business_id,
      business_name: (business as any)?.name ?? "Mi negocio",
    })
    .select("code")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/trabajadores")
  return { code: (data as any).code }
}

export async function registerWithInvite(formData: FormData) {
  const supabase = await createClient()

  const code = (formData.get("code") as string)?.trim().toUpperCase()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("full_name") as string

  if (!code || !email || !password || !fullName) return { error: "Rellena todos los campos" }

  // Verificar que el código existe y no está usado
  const { data: invite, error: inviteError } = await supabase
    .from("invitations")
    .select("id, business_id, business_name, used, expires_at")
    .eq("code", code)
    .single()

  if (inviteError || !invite) return { error: "Código de invitación no válido" }
  if ((invite as any).used) return { error: "Este código ya ha sido utilizado" }
  if (new Date((invite as any).expires_at) < new Date()) return { error: "Este código ha caducado" }

  // Registrar al trabajador
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "employee",
        business_id: (invite as any).business_id,
        invite_code: code,
      },
    },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: "Error al crear la cuenta" }

  // Vincular perfil al negocio
  await supabase.from("profiles").update({
    business_id: (invite as any).business_id,
    role: "employee",
    full_name: fullName,
  }).eq("id", authData.user.id)

  // Marcar invitación como usada
  await supabase.from("invitations").update({ used: true }).eq("id", (invite as any).id)

  return { success: true, businessName: (invite as any).business_name }
}
