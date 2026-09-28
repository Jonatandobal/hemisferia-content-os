"use client"

import { cn } from "@/lib/utils"
import { BookMarked, X } from "lucide-react"
import type { Story } from "@/lib/types"

// Elegir una historia guardada precarga los campos de hechos reales.
// Evita retipear un caso que ya contaste una vez.
export function StoryPicker({
  stories,
  selectedId,
  onSelect,
}: {
  stories: Story[]
  selectedId: string | null
  onSelect: (story: Story | null) => void
}) {
  if (stories.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-1.5">
        <BookMarked className="w-4 h-4" />
        Basar en una historia guardada
      </p>
      <div className="flex flex-wrap gap-1.5">
        {stories.map((s) => {
          const selected = s.id === selectedId
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(selected ? null : s)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 h-8 text-sm transition-colors max-w-full",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary",
              )}
            >
              <span className="truncate max-w-64">{s.title}</span>
              {selected ? <X className="w-3.5 h-3.5 shrink-0" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
