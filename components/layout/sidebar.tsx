"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Clock,
  FileText,
  ShieldCheck,
  Thermometer,
  AlertTriangle,
  Truck,
  Award,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const adminNav = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/trabajadores", label: "Trabajadores", icon: Users },
  { href: "/trabajadores/horarios", label: "Fichajes", icon: Clock },
  { href: "/facturas", label: "Facturas", icon: FileText },
  {
    label: "Sanidad",
    icon: ShieldCheck,
    children: [
      { href: "/sanidad/appcc", label: "APPCC", icon: Thermometer },
      { href: "/sanidad/alergenos", label: "Alérgenos", icon: AlertTriangle },
      { href: "/sanidad/proveedores", label: "Proveedores", icon: Truck },
      { href: "/sanidad/manipuladores", label: "Manipuladores", icon: Award },
    ],
  },
]

const employeeNav = [
  { href: "/portal", label: "Mi portal", icon: LayoutDashboard },
  { href: "/portal/fichar", label: "Fichar", icon: Clock },
  { href: "/portal/historial", label: "Mis fichajes", icon: FileText },
  { href: "/portal/horario", label: "Mi horario", icon: Users },
]

interface SidebarProps {
  role: "admin" | "employee"
  businessName: string
  userName: string
}

export function Sidebar({ role, businessName, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [sanidadOpen, setSanidadOpen] = useState(
    pathname.startsWith("/sanidad")
  )

  const nav = role === "admin" ? adminNav : employeeNav

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            W
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{businessName}</p>
            <p className="truncate text-xs text-muted-foreground">{userName}</p>
          </div>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {nav.map((item) => {
          if ("children" in item) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setSanidadOpen((v) => !v)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                    pathname.startsWith("/sanidad") && "text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
                {sanidadOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-3">
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                          pathname === child.href && "bg-muted text-foreground font-medium"
                        )}
                      >
                        <child.icon className="h-4 w-4 shrink-0" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                pathname === item.href && "bg-muted text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator />
      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-background">
        {sidebarContent}
      </aside>
    </>
  )
}
