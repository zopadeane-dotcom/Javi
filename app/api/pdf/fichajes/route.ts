import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { InformeFichajesPDF } from "@/components/pdf/informe-fichajes"
import { createElement } from "react"
import { startOfMonth, endOfMonth, format } from "date-fns"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get("employee")
  const mes = searchParams.get("mes") ?? format(new Date(), "yyyy-MM")

  if (!employeeId) return NextResponse.json({ error: "employee requerido" }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single()
  if (!profile) return NextResponse.json({ error: "Sin perfil" }, { status: 403 })

  const [year, month] = mes.split("-").map(Number)
  const from = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd")
  const to = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd")

  const [{ data: employee }, { data: business }, { data: records }] = await Promise.all([
    supabase.from("employees").select("full_name, position, dni, weekly_hours").eq("id", employeeId).single(),
    supabase.from("businesses").select("name, cif").eq("id", (profile as any).business_id).single(),
    supabase.from("time_records").select("check_in, check_out, date, notes")
      .eq("employee_id", employeeId).gte("date", from).lte("date", to)
      .order("date", { ascending: true }),
  ])

  if (!employee || !business) return NextResponse.json({ error: "Datos no encontrados" }, { status: 404 })

  let buffer: Buffer
  try {
    buffer = await renderToBuffer(
      createElement(InformeFichajesPDF, {
        employee: employee as any,
        business: business as any,
        records: (records ?? []) as any,
        month: mes,
      }) as any
    )
  } catch (e: any) {
    return NextResponse.json({ error: `Error generando PDF: ${e?.message}` }, { status: 500 })
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fichajes-${mes}.pdf"`,
    },
  })
}
