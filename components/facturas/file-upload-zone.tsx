"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Link2, X, FileText, Image, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  onFileReady: (file: File | null) => void
}

export function FileUploadZone({ onFileReady }: Props) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [driveUrl, setDriveUrl] = useState("")
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [urlError, setUrlError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function setNewFile(f: File) {
    setFile(f)
    onFileReady(f)
    setShowUrlInput(false)
  }

  function clearFile() {
    setFile(null)
    onFileReady(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setNewFile(dropped)
  }, [])

  function onPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const f = item.getAsFile()
        if (f) setNewFile(f)
        return
      }
    }
  }

  async function importFromUrl() {
    if (!driveUrl.trim()) return
    setLoadingUrl(true)
    setUrlError("")

    try {
      // Convertir enlace de Google Drive al enlace de descarga directa
      let downloadUrl = driveUrl.trim()
      const driveMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (driveMatch) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`
      }

      const resp = await fetch("/api/import-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: downloadUrl }),
      })

      if (!resp.ok) {
        const err = await resp.json()
        setUrlError(err.error ?? "No se pudo importar el archivo")
        setLoadingUrl(false)
        return
      }

      const blob = await resp.blob()
      const ext = blob.type.includes("pdf") ? "pdf" : "jpg"
      const f = new File([blob], `factura-drive.${ext}`, { type: blob.type })
      setNewFile(f)
      setDriveUrl("")
    } catch {
      setUrlError("No se pudo importar. Asegúrate de que el enlace es público.")
    }
    setLoadingUrl(false)
  }

  const fileIcon = file?.type.includes("pdf") ? FileText : Image

  if (file) {
    return (
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          {file.type.includes("pdf")
            ? <FileText className="h-5 w-5 text-primary" />
            : <Image className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · Listo para subir</p>
        </div>
        <CheckCircle className="h-5 w-5 text-primary shrink-0" />
        <button type="button" onClick={clearFile} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3" onPaste={onPaste}>
      {/* Zona drag & drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 p-6 text-center
          ${dragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setNewFile(f) }}
        />
        <div className="flex flex-col items-center gap-2">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${dragging ? "bg-primary/20" : "bg-muted"}`}>
            <Upload className={`h-5 w-5 transition-colors ${dragging ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {dragging ? "Suelta aquí" : "Arrastra la factura aquí"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              o haz click para seleccionar · PDF o imagen · También puedes pegar (Ctrl+V)
            </p>
          </div>
        </div>
      </div>

      {/* Opciones alternativas */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-xl border hover:border-primary/30 hover:bg-primary/5"
        >
          <Link2 className="h-3.5 w-3.5" />
          Importar desde Google Drive
        </button>
      </div>

      {showUrlInput && (
        <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">Enlace de Google Drive</p>
            <p className="text-xs text-muted-foreground">
              El archivo debe estar compartido como <strong>"Cualquiera con el enlace puede ver"</strong>.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="text-xs"
            />
            <button
              type="button"
              onClick={importFromUrl}
              disabled={loadingUrl || !driveUrl.trim()}
              className="shrink-0 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {loadingUrl ? "Importando..." : "Importar"}
            </button>
          </div>
          {urlError && <p className="text-xs text-destructive">{urlError}</p>}
        </div>
      )}
    </div>
  )
}
