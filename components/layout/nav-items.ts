import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  CalendarDays,
  BarChart3,
  Settings,
  Radar,
  BookMarked,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

// Agrupado según el flujo: crear → publicar → medir.
export const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  { label: null, items: [{ href: "/", label: "Inicio", icon: LayoutDashboard }] },
  {
    label: "Crear",
    items: [
      { href: "/trends", label: "Tendencias", icon: Radar },
      { href: "/ideas", label: "Ideas", icon: Lightbulb },
      { href: "/stories", label: "Historias", icon: BookMarked },
    ],
  },
  {
    label: "Publicar",
    items: [
      { href: "/drafts", label: "Drafts", icon: FileText },
      { href: "/calendar", label: "Calendario", icon: CalendarDays },
    ],
  },
  {
    label: "Medir",
    items: [{ href: "/analytics", label: "Analytics", icon: BarChart3 }],
  },
]

export const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  label: "Configuración",
  icon: Settings,
}

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}
