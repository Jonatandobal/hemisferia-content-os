import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface HeaderProps {
  title: string
  description?: string
  showNewIdea?: boolean
  actions?: React.ReactNode
}

export function Header({
  title,
  description,
  showNewIdea = false,
  actions,
}: HeaderProps) {
  return (
    <header className="shrink-0 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8 md:py-5">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold leading-tight truncate">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {showNewIdea ? (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/ideas/new">
                <Plus className="w-4 h-4" />
                Nueva idea
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
