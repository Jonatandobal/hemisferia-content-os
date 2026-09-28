"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandMark } from "./brand-mark"
import { NAV_GROUPS, SETTINGS_ITEM, isActive, type NavItem } from "./nav-items"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="h-16 flex items-center px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="text-white" />
          <div className="leading-tight">
            <p className="font-heading font-semibold text-[15px] text-white">
              Hemisferia
            </p>
            <p className="text-[11px] text-sidebar-muted">Content OS</p>
          </div>
        </Link>
      </div>

      <div className="px-3 pb-2">
        <Link
          href="/ideas/new"
          className="flex items-center justify-center gap-2 h-9 rounded-lg bg-white text-sidebar text-sm font-medium hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva idea
        </Link>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label ?? "root"} className="space-y-0.5">
            {group.label ? (
              <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted/80">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border">
        <SidebarLink
          item={SETTINGS_ITEM}
          active={isActive(pathname, SETTINGS_ITEM.href)}
        />
      </div>
    </aside>
  )
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 px-3 h-9 text-sm rounded-lg transition-colors",
        active
          ? "bg-sidebar-accent text-white font-medium"
          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-white",
      )}
    >
      {active ? (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-white" />
      ) : null}
      <Icon className="w-4 h-4" />
      {item.label}
    </Link>
  )
}
