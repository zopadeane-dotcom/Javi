"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const invoiceSchema = z.object({
  supplier_id: z.string().uuid().optional(),
  invoice_number: z.string().min(1),
  invoice_date: z.string().min(1),
  base_amount: z.coerce.number().positive().pipe(z.number()),
  vat_rate: z.coerce.number().pipe(z.number()),
  concept: z.string().optional(),
  is_deductible: z.coerce.boolean().default(true),
})

function calcQuarter(dateStr: string): 1 | 2 | 3 | 4 {
  const month = new Date(dateStr).getMonth() + 1
  return Math.ceil(month / 3) as 1 | 2 | 3 | 4
}

export async function createInvoice(formData: FormData) {
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
  const parsed = invoiceSchema.safeParse({
    ...raw,
    is_deductible: raw.is_deductible === "true" || raw.is_deductible === "on",
  })
  if (!parsed.success) return { error: "Datos inválidos" }

  const { base_amount, vat_rate } = parsed.data
  const vat_amount = parseFloat((base_amount * (vat_rate / 100)).toFixed(2))
  const total_amount = parseFloat((base_amount + vat_amount).toFixed(2))
  const year = new Date(parsed.data.invoice_date).getFullYear()
  const quarter = calcQuarter(parsed.data.invoice_date)

  // El archivo se sube desde el cliente; aquí solo recibimos la ruta
  const file_url = (formData.get("file_url") as string | null) || null

  // Resolver supplier_id: si no viene, crearlo desde supplier_name
  let supplier_id = parsed.data.supplier_id ?? null
  if (!supplier_id) {
    const supplierName = (formData.get("supplier_name") as string | null)?.trim()
    if (!supplierName) return { error: "Indica el nombre del proveedor" }

    // Buscar si ya existe con ese nombre
    const { data: existing } = await supabase
      .from("suppliers")
      .select("id")
      .eq("business_id", profile.business_id)
      .ilike("name", supplierName)
      .maybeSingle()

    if (existing) {
      supplier_id = existing.id
    } else {
      // Crear nuevo proveedor con el nombre extraído del PDF
      const { data: newS, error: sErr } = await supabase
        .from("suppliers")
        .insert({ business_id: profile.business_id, name: supplierName })
        .select("id")
        .single()
      if (sErr) return { error: sErr.message }
      supplier_id = newS.id
    }
  }

  const { error } = await supabase.from("invoices").insert({
    ...parsed.data,
    supplier_id,
    business_id: profile.business_id,
    vat_amount,
    total_amount,
    year,
    quarter,
    file_url,
    concept: parsed.data.concept || null,
  })

  if (error) return { error: error.message }

  revalidatePath("/facturas")
  return { success: true }
}

export async function saveOtherDocument(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles").select("business_id").eq("id", user.id).single()
  if (!profile?.business_id) return { error: "Negocio no encontrado" }

  const { error } = await supabase.from("other_documents").insert({
    business_id: profile.business_id,
    original_filename: formData.get("original_filename") as string,
    detected_type: (formData.get("detected_type") as string) || null,
    reason: (formData.get("reason") as string) || null,
    file_url: (formData.get("file_url") as string) || null,
    supplier_name: (formData.get("supplier_name") as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath("/facturas")
  return { success: true }
}

export async function createSupplier(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single()

  if (!profile?.business_id) return { error: "Negocio no encontrado" }

  const name = formData.get("name") as string
  const nif = formData.get("nif") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string

  const { data, error } = await supabase.from("suppliers").insert({
    business_id: profile.business_id,
    name,
    nif: nif || null,
    email: email || null,
    phone: phone || null,
  }).select("id").single()

  if (error) return { error: error.message }

  revalidatePath("/facturas/nueva")
  return { success: true, id: (data as any).id }
}
