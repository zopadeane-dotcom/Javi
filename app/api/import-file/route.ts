import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: "URL requerida" }, { status: 400 })

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "No se pudo acceder al archivo. Comprueba que el enlace es público." },
        { status: 400 }
      )
    }

    const contentType = response.headers.get("content-type") ?? "application/octet-stream"
    if (!contentType.includes("pdf") && !contentType.includes("image")) {
      return NextResponse.json(
        { error: "Solo se admiten archivos PDF e imágenes." },
        { status: 400 }
      )
    }

    const buffer = await response.arrayBuffer()
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType },
    })
  } catch {
    return NextResponse.json({ error: "Error al importar el archivo." }, { status: 500 })
  }
}
