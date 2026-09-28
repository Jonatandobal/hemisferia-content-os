"use client"

import { cn } from "@/lib/utils"
import {
  PILLAR_DESCRIPTIONS,
  PILLAR_DOT,
  PILLAR_LABELS,
  type Pillar,
} from "@/lib/types"

const PILLARS: Pillar[] = ["caso", "contrarian", "educativo", "founder"]

// Selector de pilar como chips (un toque, sin abrir un menú).
// Tocar el elegido lo deselecciona.
export function PillarPicker({
  value,
  onChange,
  size = "default",
  disabled,
}: {
  value: Pillar | null
  onChange: (p: Pillar | null) => void
  size?: "sm" | "default"
  disabled?: boolean
}) {
  return (
    <div role="radiogroup" aria-label="Pilar" className="flex flex-wrap gap-1.5">
      {PILLARS.map((p) => {
        const selected = value === p
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={selected}
            title={PILLAR_DESCRIPTIONS[p]}
            disabled={disabled}
            onClick={() => onChange(selected ? null : p)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border transition-colors disabled:opacity-50",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-secondary",
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                PILLAR_DOT[p],
                selected && "ring-2 ring-white/70",
              )}
            />
            {PILLAR_LABELS[p]}
          </button>
        )
      })}
    </div>
  )
}
