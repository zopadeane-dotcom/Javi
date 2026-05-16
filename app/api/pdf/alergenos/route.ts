import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { FichaAlergenosPDF } from "@/components/pdf/ficha-alergenos"
import { createElement } from "react"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single()
  if (!profile) return NextResponse.json({ error: "Sin perfil" }, { status: 403 })

  const [{ data: products }, { data: business }] = await Promise.all([
    supabase.from("allergen_products").select("*").eq("business_id", (profile as any).business_id).order("name"),
    supabase.from("businesses").select("name").eq("id", (profile as any).business_id).single(),
  ])

  let buffer: Buffer
  try {
    buffer = await renderToBuffer(
      createElement(FichaAlergenosPDF, {
        products: (products ?? []) as any,
        business: (business ?? { name: "Mi negocio" }) as any,
      }) as any
    )
  } catch (e: any) {
    return NextResponse.json({ error: `Error generando PDF: ${e?.message}` }, { status: 500 })
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="carta-alergenos.pdf"`,
    },
  })
}
