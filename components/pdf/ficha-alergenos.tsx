import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { format } from "date-fns"

const ALLERGENS = [
  { key: "gluten", label: "Gluten" },
  { key: "crustaceans", label: "Crustáceos" },
  { key: "eggs", label: "Huevos" },
  { key: "fish", label: "Pescado" },
  { key: "peanuts", label: "Cacahuetes" },
  { key: "soy", label: "Soja" },
  { key: "dairy", label: "Lácteos" },
  { key: "nuts", label: "Frutos secos" },
  { key: "celery", label: "Apio" },
  { key: "mustard", label: "Mostaza" },
  { key: "sesame", label: "Sésamo" },
  { key: "sulphites", label: "SO₂/Sulfitos" },
  { key: "lupin", label: "Altramuces" },
  { key: "molluscs", label: "Moluscos" },
]

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 20 },
  divider: { borderBottom: "1pt solid #e5e7eb", marginVertical: 16 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1a1a1a", padding: "6 8", borderRadius: 4, marginBottom: 2 },
  tableHeaderText: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#fff", flex: 1, textAlign: "center" },
  tableHeaderLeft: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#fff", flex: 3 },
  row: { flexDirection: "row", padding: "8 8", borderBottom: "0.5pt solid #f3f4f6", alignItems: "center" },
  productName: { flex: 3, fontSize: 9, fontFamily: "Helvetica-Bold" },
  cell: { flex: 1, textAlign: "center", fontSize: 11 },
  present: { color: "#dc2626" },
  absent: { color: "#d1d5db" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#9ca3af", textAlign: "center" },
  legend: { marginTop: 16, flexDirection: "row", gap: 16, fontSize: 8 },
  legal: { marginTop: 16, backgroundColor: "#eff6ff", border: "1pt solid #bfdbfe", borderRadius: 6, padding: 10, fontSize: 8, color: "#1e40af" },
})

interface Props {
  products: any[]
  business: { name: string }
}

export function FichaAlergenosPDF({ products, business }: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.title}>Carta de Alérgenos</Text>
        <Text style={s.subtitle}>
          {business.name} · {format(new Date(), "dd/MM/yyyy")} · Reglamento UE 1169/2011
        </Text>

        <View style={s.tableHeader}>
          <Text style={s.tableHeaderLeft}>Plato / Producto</Text>
          {ALLERGENS.map((a) => (
            <Text key={a.key} style={s.tableHeaderText}>{a.label}</Text>
          ))}
        </View>

        {products.map((p, i) => (
          <View key={p.id} style={[s.row, { backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }]}>
            <Text style={s.productName}>{p.name}</Text>
            {ALLERGENS.map((a) => (
              <Text key={a.key} style={[s.cell, p[a.key] ? s.present : s.absent]}>
                {p[a.key] ? "✓" : "·"}
              </Text>
            ))}
          </View>
        ))}

        <View style={s.legend}>
          <Text><Text style={{ color: "#dc2626", fontFamily: "Helvetica-Bold" }}>✓</Text> Contiene el alérgeno</Text>
          <Text><Text style={{ color: "#d1d5db" }}>·</Text> No contiene</Text>
        </View>

        <View style={s.legal}>
          <Text>
            Documento elaborado conforme al Reglamento (UE) nº 1169/2011 sobre la información alimentaria facilitada al consumidor
            y el Real Decreto 126/2015. Los 14 alérgenos de declaración obligatoria deben comunicarse al consumidor cuando estén presentes.
          </Text>
        </View>

        <Text style={s.footer}>
          Generado por Workie · {format(new Date(), "dd/MM/yyyy HH:mm")}
        </Text>
      </Page>
    </Document>
  )
}
