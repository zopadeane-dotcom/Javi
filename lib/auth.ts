import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export interface UserProfile {
  id: string
  business_id: string | null
  role: "admin" | "employee"
  full_name: string
  email: string
}

export async function getProfile(): Promise<UserProfile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!data) redirect("/login")

  return data as unknown as UserProfile
}

export async function requireAdmin(): Promise<UserProfile> {
  const profile = await getProfile()
  if (profile.role !== "admin") redirect("/portal/fichar")
  return profile
}
