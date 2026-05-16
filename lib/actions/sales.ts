"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

function calcQuarter(dateStr: string): 1 | 2 | 3 | 4 {
  const month = new Date(dateStr).getMonth() + 1
  return Math.ceil(month / 3) as 1 | 2 | 3 | 4
}

export async function createSalesRecord(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single()

  if (!profile?.business_id) return { error: "Negocio no encontrado" }

  const period_start = formData.get("period_start") as string
  const period_end = formData.get("period_end") as string
  const source = (formData.get("source") as string) || "manual"
  const total_sales = parseFloat(formData.get("total_sales") as string)
  const vat_rate = parseFloat(formData.get("vat_rate") as string)
  const notes = (formData.get("notes") as string) || null

  if (!period_start || !period_end || isNaN(total_sales) || isNaN(vat_rate)) {
    return { error: "Datos inválidos" }
  }

  // Cálculos IVA: cuota = total * tipo / (100 + tipo)
  const vat_amount = parseFloat((total_sales * vat_rate / (100 + vat_rate)).toFixed(2))
  const base_amount = parseFloat((total_sales - vat_amount).toFixed(2))

  const year = new Date(period_start).getFullYear()
  const quarter = calcQuarter(period_start)

  const { error } = await supabase.from("sales_records").insert({
    business_id: profile.business_id,
    period_start,
    period_end,
    source,
    total_sales,
    vat_rate,
    vat_amount,
    base_amount,
    notes,
    year,
    quarter,
  })

  if (error) return { error: error.message }

  revalidatePath("/ventas")
  revalidatePath("/facturas/modelo-303")
  return { success: true }
}
