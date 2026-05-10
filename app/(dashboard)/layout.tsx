import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, business_id")
    .eq("id", user.id)
    .single()

  const role = ((profile as any)?.role ?? "employee") as "admin" | "employee"
  const businessId = (profile as any)?.business_id
  let businessName = "Workie"
  if (businessId) {
    const { data: biz } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", businessId)
      .single()
    businessName = (biz as any)?.name ?? "Workie"
  }
  const userName = (profile as any)?.full_name ?? user.email ?? ""

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} businessName={businessName} userName={userName} />
      <main className="md:pl-64 min-h-screen">
        <div className="px-5 py-7 md:px-10 md:py-9 max-w-7xl">
          {children}
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
