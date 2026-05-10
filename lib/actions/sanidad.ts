"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createHaccpTemplate(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }
  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single()
  if (!profile?.business_id) return { error: "Negocio no encontrado" }

  const { error } = await supabase.from("haccp_templates").insert({
    business_id: (profile as any).business_id,
    name: formData.get("name") as string,
    control_type: formData.get("control_type") as string,
    description: (formData.get("description") as string) || null,
    min_value: formData.get("min_value") ? parseFloat(formData.get("min_value") as string) : null,
    max_value: formData.get("max_value") ? parseFloat(formData.get("max_value") as string) : null,
    unit: (formData.get("unit") as string) || null,
  })
  if (error) return { error: error.message }
  revalidatePath("/sanidad/appcc")
  return { success: true }
}

export async function createHaccpControl(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }
  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single()
  if (!profile?.business_id) return { error: "Negocio no encontrado" }

  const { error } = await supabase.from("haccp_controls").insert({
    business_id: (profile as any).business_id,
    template_id: formData.get("template_id") as string,
    recorded_by: user.id,
    control_date: formData.get("control_date") as string,
    value: formData.get("value") ? parseFloat(formData.get("value") as string) : null,
    status: formData.get("status") as string,
    notes: (formData.get("notes") as string) || null,
  })
  if (error) return { error: error.message }
  revalidatePath("/sanidad/appcc")
  return { success: true }
}

export async function createAllergenProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }
  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single()
  if (!profile?.business_id) return { error: "Negocio no encontrado" }

  const allergens = ["gluten","crustaceans","eggs","fish","peanuts","soy","dairy","nuts","celery","mustard","sesame","sulphites","lupin","molluscs"]
  const allergenValues = Object.fromEntries(allergens.map((a) => [a, formData.get(a) === "on"]))

  const { error } = await supabase.from("allergen_products").insert({
    business_id: (profile as any).business_id,
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    ...allergenValues,
  })
  if (error) return { error: error.message }
  revalidatePath("/sanidad/alergenos")
  return { success: true }
}

export async function updateAllergenProduct(id: string, formData: FormData) {
  const supabase = await createClient()
  const allergens = ["gluten","crustaceans","eggs","fish","peanuts","soy","dairy","nuts","celery","mustard","sesame","sulphites","lupin","molluscs"]
  const allergenValues = Object.fromEntries(allergens.map((a) => [a, formData.get(a) === "on"]))

  const { error } = await supabase.from("allergen_products").update({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    ...allergenValues,
  }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/sanidad/alergenos")
  return { success: true }
}

export async function createSupplierSheet(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }
  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single()
  if (!profile?.business_id) return { error: "Negocio no encontrado" }

  const { error } = await supabase.from("supplier_sheets").insert({
    business_id: (profile as any).business_id,
    supplier_id: formData.get("supplier_id") as string,
    rgseaa_number: (formData.get("rgseaa_number") as string) || null,
    supplied_products: (formData.get("supplied_products") as string) || null,
    last_audit_date: (formData.get("last_audit_date") as string) || null,
    next_audit_date: (formData.get("next_audit_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
  })
  if (error) return { error: error.message }
  revalidatePath("/sanidad/proveedores")
  return { success: true }
}

export async function createFoodHandlerCertificate(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }
  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single()
  if (!profile?.business_id) return { error: "Negocio no encontrado" }

  let file_url: string | null = null
  const file = formData.get("file") as File | null
  if (file && file.size > 0) {
    const ext = file.name.split(".").pop()
    const path = `${(profile as any).business_id}/manipuladores/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file)
    if (!uploadError) file_url = path
  }

  const { error } = await supabase.from("food_handler_certificates").insert({
    business_id: (profile as any).business_id,
    employee_id: formData.get("employee_id") as string,
    obtained_date: formData.get("obtained_date") as string,
    expiry_date: (formData.get("expiry_date") as string) || null,
    certificate_number: (formData.get("certificate_number") as string) || null,
    status: "vigente",
    file_url,
  })
  if (error) return { error: error.message }
  revalidatePath("/sanidad/manipuladores")
  return { success: true }
}
