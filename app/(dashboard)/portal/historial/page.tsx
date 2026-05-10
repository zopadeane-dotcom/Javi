"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, differenceInMinutes, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { Clock } from "lucide-react"

export default function HistorialPage() {
  const [records, setRecords] = useState<any[]>([])
  const [totalHours, setTotalHours] = useState(0)
  const [mes, setMes] = useState(format(new Date(), "yyyy-MM"))

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: emp } = await supabase.from("employees").select("id").eq("user_id", user.id).single()
      if (!emp) return

      const [year, month] = mes.split("-").map(Number)
      const from = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd")
      const to = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd")

      const { data } = await supabase.from("time_records")
        .select("*").eq("employee_id", emp.id)
        .gte("date", from).lte("date", to)
        .order("date", { ascending: false })

      setRecords(data ?? [])
      const total = (data ?? []).reduce((s: number, r: any) => {
        if (!r.check_out) return s
        return s + differenceInMinutes(new Date(r.check_out), new Date(r.check_in))
      }, 0)
      setTotalHours(total)
    }
    load()
  }, [mes])

  const totalH = Math.floor(totalHours / 60)
  const totalM = totalHours % 60

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Mis fichajes</h1>
        <p className="text-muted-foreground text-sm">Historial de entradas y salidas</p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Mes:</label>
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm" />
      </div>

      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total trabajado este mes</p>
          <p className="text-2xl font-bold">{totalH}h {totalM}min</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">Sin fichajes en este mes</p>
          ) : (
            <div className="divide-y">
              {records.map((r) => {
                const mins = r.check_out ? differenceInMinutes(new Date(r.check_out), new Date(r.check_in)) : null
                return (
                  <div key={r.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-medium capitalize text-sm">
                        {format(new Date(r.date), "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Entrada: {format(new Date(r.check_in), "HH:mm")}
                        {r.check_out && ` · Salida: ${format(new Date(r.check_out), "HH:mm")}`}
                      </p>
                    </div>
                    {mins !== null ? (
                      <Badge variant="secondary">{Math.floor(mins / 60)}h {mins % 60}min</Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">En turno</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
