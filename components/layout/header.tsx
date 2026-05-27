"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface HeaderProps {
  title: string
  description?: string
  showNewIdea?: boolean
}

export function Header({ title, description, showNewIdea = true }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold leading-tight">{title}</h1>
        {description ? (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        ) : null}
      </div>

      {showNewIdea ? (
        <Button asChild size="sm">
          <Link href="/ideas/new">
            <Plus className="w-4 h-4 mr-1" />
            Nueva idea
          </Link>
        </Button>
      ) : null}
    </header>
  )
}
