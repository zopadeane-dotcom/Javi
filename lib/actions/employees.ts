"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const employeeSchema = z.object({
  full_name: z.string().min(2),
  dni: z.string().min(9).max(9),
  social_security_number: z.string().optional(),
  position: z.string().min(1),
  contract_type: z.enum(["indefinido", "temporal", "formacion", "practicas", "obra_servicio"]),
  start_date: z.string(),
  end_date: z.string().optional(),
  weekly_hours: z.coerce.number().min(1).max(60).pipe(z.number()),
  hourly_rate: z.coerce.number().optional().pipe(z.number().optional()),
})

export async function createEmployee(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single()

  if (!profile?.business_id) return { error: "Negocio no encontrado" }

  const raw = Object.fromEntries(formData)
  const parsed = employeeSchema.safeParse(raw)
  if (!parsed.success) return { error: "Datos inválidos" }

  const { error } = await supabase.from("employees").insert({
    ...parsed.data,
    business_id: profile.business_id,
    end_date: parsed.data.end_date || null,
    social_security_number: parsed.data.social_security_number || null,
    hourly_rate: parsed.data.hourly_rate || null,
  })

  if (error) return { error: error.message }

  revalidatePath("/trabajadores")
  return { success: true }
}

export async function updateEmployee(id: string, formData: FormData) {
  const supabase = await createClient()
  const raw = Object.fromEntries(formData)
  const parsed = employeeSchema.safeParse(raw)
  if (!parsed.success) return { error: "Datos inválidos" }

  const { error } = await supabase
    .from("employees")
    .update({
      ...parsed.data,
      end_date: parsed.data.end_date || null,
      social_security_number: parsed.data.social_security_number || null,
      hourly_rate: parsed.data.hourly_rate || null,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/trabajadores")
  return { success: true }
}

export async function deactivateEmployee(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("employees")
    .update({ is_active: false })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/trabajadores")
  return { success: true }
}
