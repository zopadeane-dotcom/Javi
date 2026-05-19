import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path")
  if (!path) return new NextResponse("Path requerido", { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 3600)
  if (error || !data) return new NextResponse("No se pudo generar el enlace", { status: 500 })

  return NextResponse.redirect(data.signedUrl)
}
