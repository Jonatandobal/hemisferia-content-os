"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookMarked,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Plus,
  Radar,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandMark } from "./brand-mark"
import { isActive } from "./nav-items"

// Barra superior (marca + secciones secundarias) y barra inferior con las
// secciones de uso diario. Solo en pantallas chicas.
export function MobileTopBar() {
  const pathname = usePathname()
  const secondary = [
    { href: "/trends", label: "Tendencias", icon: Radar },
    { href: "/stories", label: "Historias", icon: BookMarked },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Configuración", icon: Settings },
  ]
  return (
    <div className="md:hidden h-14 shrink-0 flex items-center justify-between px-4 bg-sidebar text-sidebar-foreground">
      <Link href="/" className="flex items-center gap-2">
        <BrandMark className="w-7 h-7 text-white" />
        <span className="font-heading font-semibold text-white">Hemisferia</span>
      </Link>
      <div className="flex items-center gap-1">
        {secondary.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={cn(
              "w-9 h-9 grid place-items-center rounded-lg",
              isActive(pathname, href)
                ? "bg-sidebar-accent text-white"
                : "text-sidebar-muted",
            )}
          >
            <Icon className="w-[18px] h-[18px]" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const items = [
    { href: "/", label: "Inicio", icon: LayoutDashboard },
    { href: "/ideas", label: "Ideas", icon: Lightbulb },
    { href: "/ideas/new", label: "Nueva", icon: Plus, primary: true },
    { href: "/drafts", label: "Drafts", icon: FileText },
    { href: "/calendar", label: "Agenda", icon: CalendarDays },
  ]
  return (
    <nav className="md:hidden shrink-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16">
        {items.map(({ href, label, icon: Icon, primary }) => {
          const active =
            href === "/ideas"
              ? pathname === "/ideas"
              : isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 text-[11px]"
            >
              <span
                className={cn(
                  "grid place-items-center rounded-full transition-colors",
                  primary
                    ? "w-10 h-10 bg-primary text-primary-foreground"
                    : "w-8 h-6",
                  !primary && active && "bg-accent text-accent-foreground",
                  !primary && !active && "text-muted-foreground",
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
              </span>
              {primary ? null : (
                <span
                  className={cn(
                    active ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
