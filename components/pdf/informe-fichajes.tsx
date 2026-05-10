import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { format, differenceInMinutes } from "date-fns"
import { es } from "date-fns/locale"

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a" },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280" },
  divider: { borderBottom: "1pt solid #e5e7eb", marginVertical: 16 },
  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  kpi: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 6, padding: 10, border: "1pt solid #e5e7eb" },
  kpiLabel: { fontSize: 8, color: "#6b7280", marginBottom: 3 },
  kpiValue: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "6 8", borderRadius: 4, marginBottom: 2 },
  tableHeaderText: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#6b7280", flex: 1 },
  row: { flexDirection: "row", padding: "7 8", borderBottom: "0.5pt solid #f3f4f6" },
  cell: { flex: 1, fontSize: 9 },
  cellRight: { flex: 1, fontSize: 9, textAlign: "right" },
  badge: { backgroundColor: "#dcfce7", color: "#166534", borderRadius: 4, padding: "2 6", fontSize: 8 },
  badgeOrange: { backgroundColor: "#fed7aa", color: "#9a3412", borderRadius: 4, padding: "2 6", fontSize: 8 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#9ca3af", textAlign: "center" },
  legal: { marginTop: 24, backgroundColor: "#fffbeb", border: "1pt solid #fde68a", borderRadius: 6, padding: 10, fontSize: 8, color: "#92400e" },
})

interface Props {
  employee: { full_name: string; position: string; dni: string; weekly_hours: number }
  business: { name: string; cif: string }
  records: { check_in: string; check_out: string | null; date: string; notes: string | null }[]
  month: string
}

export function InformeFichajesPDF({ employee, business, records, month }: Props) {
  const totalMins = records.reduce((s, r) => {
    if (!r.check_out) return s
    return s + differenceInMinutes(new Date(r.check_out), new Date(r.check_in))
  }, 0)
  const totalH = Math.floor(totalMins / 60)
  const totalM = totalMins % 60
  const dias = [...new Set(records.map((r) => r.date))].length
  const [year, mon] = month.split("-").map(Number)
  const monthLabel = format(new Date(year, mon - 1), "MMMM yyyy", { locale: es })

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>Registro de Jornada Laboral</Text>
          <Text style={s.subtitle}>
            {business.name} · CIF: {business.cif} · {monthLabel}
          </Text>
          <Text style={[s.subtitle, { marginTop: 4 }]}>
            Trabajador: {employee.full_name} · DNI: {employee.dni} · {employee.position}
          </Text>
          <Text style={[s.subtitle, { marginTop: 2 }]}>
            Jornada contractual: {employee.weekly_hours}h/semana
          </Text>
        </View>

        <View style={s.divider} />

        <View style={s.kpiRow}>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Días trabajados</Text>
            <Text style={s.kpiValue}>{dias}</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Total horas</Text>
            <Text style={s.kpiValue}>{totalH}h {totalM}min</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Media por día</Text>
            <Text style={s.kpiValue}>{dias > 0 ? `${Math.floor(totalMins / dias / 60)}h ${Math.floor(totalMins / dias) % 60}min` : "—"}</Text>
          </View>
        </View>

        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, { flex: 2 }]}>Fecha</Text>
          <Text style={s.tableHeaderText}>Entrada</Text>
          <Text style={s.tableHeaderText}>Salida</Text>
          <Text style={[s.tableHeaderText, { textAlign: "right" }]}>Horas</Text>
        </View>

        {records.map((r, i) => {
          const mins = r.check_out ? differenceInMinutes(new Date(r.check_out), new Date(r.check_in)) : null
          return (
            <View key={i} style={[s.row, { backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }]}>
              <Text style={[s.cell, { flex: 2 }]}>
                {format(new Date(r.date), "EEEE d MMM", { locale: es })}
              </Text>
              <Text style={s.cell}>{format(new Date(r.check_in), "HH:mm")}</Text>
              <Text style={s.cell}>{r.check_out ? format(new Date(r.check_out), "HH:mm") : "—"}</Text>
              <Text style={s.cellRight}>
                {mins !== null ? `${Math.floor(mins / 60)}h ${mins % 60}min` : "En turno"}
              </Text>
            </View>
          )
        })}

        <View style={s.legal}>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 3 }}>Cumplimiento normativo</Text>
          <Text>Documento generado de conformidad con el Real Decreto-ley 8/2019 de 8 de marzo, sobre medidas urgentes de protección social y de lucha contra la precariedad laboral en la jornada de trabajo, que establece la obligatoriedad del registro horario de la jornada diaria de los trabajadores.</Text>
        </View>

        <View style={s.divider} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: "#6b7280", marginBottom: 20 }}>Firma del trabajador</Text>
            <Text style={{ fontSize: 8, borderTop: "1pt solid #d1d5db", paddingTop: 4 }}>{employee.full_name}</Text>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, color: "#6b7280", marginBottom: 20 }}>Firma del responsable</Text>
            <Text style={{ fontSize: 8, borderTop: "1pt solid #d1d5db", paddingTop: 4 }}>{business.name}</Text>
          </View>
        </View>

        <Text style={s.footer}>
          Generado por Workie · {format(new Date(), "dd/MM/yyyy HH:mm")}
        </Text>
      </Page>
    </Document>
  )
}
