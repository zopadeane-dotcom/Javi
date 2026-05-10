"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface Props {
  employees: { id: string; full_name: string }[]
  mes: string
}

export function ExportPdfButton({ employees, mes }: Props) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "")

  function download() {
    if (!employeeId) return
    window.open(`/api/pdf/fichajes?employee=${employeeId}&mes=${mes}`, "_blank")
  }

  if (!employees.length) return null

  return (
    <div className="flex gap-2 items-center">
      <Select value={employeeId} onValueChange={(v) => { if (v) setEmployeeId(v as string) }}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecciona trabajador" />
        </SelectTrigger>
        <SelectContent>
          {employees.map((e) => (
            <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={download} disabled={!employeeId}>
        <Download className="h-4 w-4 mr-2" />
        Exportar PDF
      </Button>
    </div>
  )
}
