import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon
  title: string
  children?: React.ReactNode
  action?: { href: string; label: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14">
      <div className="w-12 h-12 rounded-2xl bg-accent text-accent-foreground grid place-items-center mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      {children ? (
        <p className="text-sm text-muted-foreground max-w-sm">{children}</p>
      ) : null}
      {action ? (
        <Button asChild size="sm" className="mt-5">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  )
}
