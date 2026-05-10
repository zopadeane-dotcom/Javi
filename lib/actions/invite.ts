"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function inviteEmployee(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase.from("profiles").select("business_id, role").eq("id", user.id).single()
  if (!profile || (profile as any).role !== "admin") return { error: "Sin permisos" }

  const email = formData.get("email") as string
  const employeeId = formData.get("employee_id") as string
  const tempPassword = formData.get("password") as string

  // Crear usuario en Supabase Auth
  const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      role: "employee",
      full_name: formData.get("full_name") as string,
    },
  })

  if (authError) return { error: authError.message }

  // Vincular el usuario al empleado
  await supabase.from("employees").update({ user_id: newUser.user.id }).eq("id", employeeId)

  // Actualizar perfil con business_id
  await supabase.from("profiles").update({
    business_id: (profile as any).business_id,
    role: "employee",
    full_name: formData.get("full_name") as string,
    email,
  }).eq("id", newUser.user.id)

  revalidatePath("/trabajadores")
  return { success: true }
}
