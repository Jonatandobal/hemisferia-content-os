import Link from "next/link"
import { cn } from "@/lib/utils"

export interface LinkTab {
  value: string
  label: string
  count?: number
}

// Pestañas basadas en la URL (?tab=...): funcionan en Server Components,
// se pueden compartir y el botón "atrás" del navegador las respeta.
export function LinkTabs({
  tabs,
  active,
  hrefFor,
}: {
  tabs: LinkTab[]
  active: string
  hrefFor: (value: string) => string
}) {
  return (
    <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
      <div className="inline-flex gap-1 rounded-xl bg-secondary p-1">
        {tabs.map((tab) => {
          const isActive = tab.value === active
          return (
            <Link
              key={tab.value}
              href={hrefFor(tab.value)}
              scroll={false}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 h-8 text-sm transition-colors",
                isActive
                  ? "bg-card text-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.count !== undefined ? (
                <span
                  className={cn(
                    "tabular-nums text-xs rounded-full px-1.5 min-w-5 text-center",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
