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
import { Sparkles } from "lucide-react"

const adminNav = [
  { href: "/", label: "Inicio", icon: LayoutDashboard, tour: undefined },
  { href: "/trabajadores", label: "Trabajadores", icon: Users, tour: "trabajadores" },
  { href: "/trabajadores/horarios", label: "Fichajes", icon: Clock, tour: "fichajes" },
  { href: "/facturas", label: "Facturas", icon: FileText, tour: "facturas" },
  {
    label: "Sanidad",
    icon: ShieldCheck,
    tour: "sanidad",
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
  const [sanidadOpen, setSanidadOpen] = useState(pathname.startsWith("/sanidad"))

  const nav = role === "admin" ? adminNav : employeeNav

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const isActive = (href: string) => pathname === href
  const isGroupActive = (prefix: string) => pathname.startsWith(prefix)

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">

      {/* Logo / negocio */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-md">
            W
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm text-sidebar-foreground">{businessName}</p>
            <p className="truncate text-xs opacity-50">{userName}</p>
          </div>
        </div>
      </div>

      <div className="mx-4 border-t border-sidebar-border" />

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          if ("children" in item) {
            const groupActive = isGroupActive("/sanidad")
            return (
              <div key={item.label}>
                <button
                  data-tour="sanidad"
                  onClick={() => setSanidadOpen((v) => !v)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    groupActive
                      ? "text-sidebar-foreground bg-sidebar-accent"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                  <svg
                    className={cn("ml-auto h-3.5 w-3.5 opacity-50 transition-transform", sanidadOpen && "rotate-90")}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {sanidadOpen && (
                  <div className="mt-1 ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                          isActive(child.href)
                            ? "bg-primary text-primary-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        )}
                      >
                        <child.icon className="h-3.5 w-3.5 shrink-0" />
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
              data-tour={"tour" in item ? item.tour : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mx-4 border-t border-sidebar-border" />

      {/* Tutorial + Cerrar sesión */}
      <div className="p-3 space-y-0.5">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("workie:launch-tour"))}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary/80 hover:text-primary hover:bg-sidebar-accent/60 transition-all duration-150"
        >
          <Sparkles className="h-4 w-4" />
          Tutorial
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        {sidebarContent}
      </aside>
    </>
  )
}
