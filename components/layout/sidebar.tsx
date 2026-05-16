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
  Sun,
  Moon,
  TrendingUp,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

const adminNav = [
  { href: "/", label: "Inicio", icon: LayoutDashboard, tour: undefined, color: "bg-blue-500/20 text-blue-300", activeColor: "bg-blue-500 text-white" },
  { href: "/trabajadores", label: "Trabajadores", icon: Users, tour: "trabajadores", color: "bg-violet-500/20 text-violet-300", activeColor: "bg-violet-500 text-white" },
  { href: "/trabajadores/horarios", label: "Fichajes", icon: Clock, tour: "fichajes", color: "bg-amber-500/20 text-amber-300", activeColor: "bg-amber-500 text-white" },
  { href: "/facturas", label: "Facturas", icon: FileText, tour: "facturas", color: "bg-sky-500/20 text-sky-300", activeColor: "bg-sky-500 text-white" },
  { href: "/ventas", label: "Ventas", icon: TrendingUp, tour: undefined, color: "bg-rose-500/20 text-rose-300", activeColor: "bg-rose-500 text-white" },
  {
    label: "Sanidad",
    icon: ShieldCheck,
    tour: "sanidad",
    color: "bg-emerald-500/20 text-emerald-300",
    activeColor: "bg-emerald-500 text-white",
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
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
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
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                    groupActive
                      ? "text-sidebar-foreground bg-sidebar-accent"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 hover:scale-[1.01]"
                  )}
                >
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                    groupActive ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-300"
                  )}>
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
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
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 border",
                          isActive(child.href)
                            ? "bg-primary text-primary-foreground shadow-sm border-primary/20"
                            : "text-sidebar-foreground/60 border-transparent hover:text-sidebar-foreground hover:bg-sidebar-accent/70 hover:border-sidebar-border/30 hover:scale-[1.01]"
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group",
                isActive(item.href)
                  ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 hover:scale-[1.01]"
              )}
            >
              <span className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                isActive(item.href)
                  ? ("color" in item ? item.activeColor : "bg-primary text-white")
                  : ("color" in item ? item.color : "bg-sidebar-accent text-sidebar-foreground/60")
              )}>
                <item.icon className="h-3.5 w-3.5" />
              </span>
              {item.label}
            </Link>
          )
        })}

        {/* Invitar trabajador + Apariencia — solo para admins */}
        {role === "admin" && (
          <>
            <div className="border-t border-sidebar-border/40 my-1" />

            <Link
              href="/trabajadores"
              onClick={() => setOpen(false)}
              data-tour="invitar"
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, oklch(0.55 0.18 290), oklch(0.45 0.16 270))",
                boxShadow: "0 4px 14px oklch(0.55 0.18 290 / 0.4)",
              }}
            >
              <Users className="h-4 w-4" />
              Invitar trabajador
            </Link>

            {mounted && <div className="rounded-xl overflow-hidden border border-sidebar-border/40">
              <p className="text-[10px] font-bold text-sidebar-foreground/35 uppercase tracking-widest px-3 pt-2.5 pb-1.5">Apariencia</p>
              <div className="grid grid-cols-2 gap-0 divide-x divide-sidebar-border/40">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex flex-col items-center gap-2 py-3.5 px-2 text-xs font-bold transition-all duration-200",
                    theme === "light"
                      ? "text-amber-500 bg-white/10"
                      : "text-sidebar-foreground/35 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent/40"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                    theme === "light"
                      ? "bg-amber-400/20 shadow-inner"
                      : "bg-sidebar-accent/50"
                  )}>
                    <Sun className="h-5 w-5" />
                  </div>
                  Claro
                  {theme === "light" && <div className="w-4 h-0.5 rounded-full bg-amber-400" />}
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex flex-col items-center gap-2 py-3.5 px-2 text-xs font-bold transition-all duration-200",
                    theme === "dark"
                      ? "text-blue-300 bg-blue-500/10"
                      : "text-sidebar-foreground/35 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent/40"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                    theme === "dark"
                      ? "bg-blue-500/20 shadow-inner"
                      : "bg-sidebar-accent/50"
                  )}>
                    <Moon className="h-5 w-5" />
                  </div>
                  Oscuro
                  {theme === "dark" && <div className="w-4 h-0.5 rounded-full bg-blue-400" />}
                </button>
              </div>
            </div>}
          </>
        )}
      </nav>

      <div className="mx-4 border-t border-sidebar-border" />

      {/* Tutorial + Cerrar sesión */}
      <div className="p-3 space-y-0.5">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("workie:launch-tour"))}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, oklch(0.52 0.14 172), oklch(0.45 0.13 190))",
            boxShadow: "0 4px 14px oklch(0.52 0.14 172 / 0.4)",
          }}
        >
          <Sparkles className="h-4 w-4" />
          ✨ Tutorial
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-150"
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
