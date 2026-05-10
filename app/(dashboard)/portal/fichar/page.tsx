"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { checkIn, checkOut } from "@/lib/actions/time-records"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Clock, LogIn, LogOut } from "lucide-react"

export default function FicharPage() {
  const [now, setNow] = useState(new Date())
  const [employee, setEmployee] = useState<any>(null)
  const [openRecord, setOpenRecord] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: emp } = await supabase
        .from("employees")
        .select("id, full_name, position, business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      setEmployee(emp)

      if (emp) {
        const today = format(new Date(), "yyyy-MM-dd")
        const { data: record } = await supabase
          .from("time_records")
          .select("id, check_in, check_out")
          .eq("employee_id", emp.id)
          .eq("date", today)
          .is("check_out", null)
          .maybeSingle()

        setOpenRecord(record)
      }
    }
    load()
  }, [])

  async function handleCheckIn() {
    if (!employee) return
    setLoading(true)
    const result = await checkIn(employee.id, employee.business_id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("¡Entrada registrada!")
      window.location.reload()
    }
    setLoading(false)
  }

  async function handleCheckOut() {
    if (!openRecord) return
    setLoading(true)
    const result = await checkOut(openRecord.id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("¡Salida registrada!")
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground text-sm capitalize">
          {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
        <p className="text-6xl font-mono font-bold tracking-widest mt-2">
          {format(now, "HH:mm:ss")}
        </p>
      </div>

      {employee && (
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">{employee.full_name}</CardTitle>
            <p className="text-muted-foreground text-sm">{employee.position}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {openRecord ? (
              <div className="text-center space-y-3">
                <Badge className="bg-green-100 text-green-800 border-green-200 text-sm px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  En turno desde {format(new Date(openRecord.check_in), "HH:mm")}
                </Badge>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full"
                  disabled={loading}
                  onClick={handleCheckOut}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  {loading ? "Registrando..." : "Registrar salida"}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Fuera de turno
                </Badge>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={loading}
                  onClick={handleCheckIn}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  {loading ? "Registrando..." : "Registrar entrada"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!employee && (
        <p className="text-muted-foreground">
          Tu cuenta no está vinculada a ningún trabajador. Contacta con el administrador.
        </p>
      )}
    </div>
  )
}
