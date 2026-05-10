"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function checkIn(employeeId: string, businessId: string) {
  const supabase = await createClient()
  const now = new Date()

  const { error } = await supabase.from("time_records").insert({
    employee_id: employeeId,
    business_id: businessId,
    check_in: now.toISOString(),
    date: now.toISOString().split("T")[0],
  })

  if (error) return { error: error.message }

  revalidatePath("/trabajadores/horarios")
  revalidatePath("/portal/fichar")
  return { success: true }
}

export async function checkOut(recordId: string) {
  const supabase = await createClient()
  const now = new Date()

  const { error } = await supabase
    .from("time_records")
    .update({ check_out: now.toISOString() })
    .eq("id", recordId)

  if (error) return { error: error.message }

  revalidatePath("/trabajadores/horarios")
  revalidatePath("/portal/fichar")
  return { success: true }
}

export async function addManualRecord(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single()

  if (!profile?.business_id) return { error: "Negocio no encontrado" }

  const employeeId = formData.get("employee_id") as string
  const checkIn = formData.get("check_in") as string
  const checkOut = formData.get("check_out") as string
  const date = formData.get("date") as string
  const notes = formData.get("notes") as string

  const { error } = await supabase.from("time_records").insert({
    employee_id: employeeId,
    business_id: profile.business_id,
    check_in: checkIn,
    check_out: checkOut || null,
    date,
    notes: notes || null,
  })

  if (error) return { error: error.message }

  revalidatePath("/trabajadores/horarios")
  return { success: true }
}
