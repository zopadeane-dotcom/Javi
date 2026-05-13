"use client"

import { useState } from "react"
import { generateInviteCode } from "@/lib/actions/invitations"
import { Button } from "@/components/ui/button"
import { Link2, Copy, CheckCircle, X } from "lucide-react"

export function InviteButton() {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [show, setShow] = useState(false)

  async function generate() {
    setLoading(true)
    const result = await generateInviteCode()
    if (result?.code) {
      setCode(result.code)
      setShow(true)
    }
    setLoading(false)
  }

  const link = typeof window !== "undefined" && code
    ? `${window.location.origin}/unirse?codigo=${code}`
    : ""

  function copy() {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button variant="outline" onClick={generate} disabled={loading}>
        <Link2 className="h-4 w-4 mr-2" />
        {loading ? "Generando..." : "Invitar trabajador"}
      </Button>

      {show && code && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border">
            <div className="bg-gradient-to-r from-primary to-[oklch(0.45_0.13_190)] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-0.5">Invitación generada</p>
                  <p className="text-white font-bold text-lg">Código para tu trabajador</p>
                </div>
                <button onClick={() => setShow(false)} className="text-white/50 hover:text-white p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-3">Código de acceso</p>
                <div className="inline-flex items-center gap-3 rounded-2xl bg-muted px-6 py-3">
                  <span className="font-mono font-black text-3xl tracking-[0.2em] text-foreground">
                    {code}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Enlace completo</p>
                <p className="text-xs text-muted-foreground break-all font-mono">{link}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={copy} className="gap-2">
                  {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? "¡Copiado!" : "Copiar enlace"}
                </Button>
                <Button onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "Únete a Workie", url: link })
                  } else {
                    copy()
                  }
                }} className="gap-2">
                  <Link2 className="h-4 w-4" />
                  Compartir
                </Button>
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                💡 Manda este enlace por WhatsApp a tu trabajador. Solo puede usarse una vez y caduca en 30 días.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
