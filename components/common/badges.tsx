import { cn } from "@/lib/utils"
import {
  DRAFT_STATUS_LABELS,
  PILLAR_DOT,
  PILLAR_LABELS,
  type DraftStatus,
  type Pillar,
} from "@/lib/types"

// Pilar / formato: punto de color + etiqueta (el color nunca va solo).
export function PillarBadge({
  pillar,
  className,
}: {
  pillar: Pillar | null
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          pillar ? PILLAR_DOT[pillar] : "bg-muted-foreground/40",
        )}
      />
      {pillar ? PILLAR_LABELS[pillar] : "Sin pilar"}
    </span>
  )
}

const STATUS_STYLES: Record<DraftStatus, string> = {
  draft: "bg-secondary text-secondary-foreground",
  approved: "bg-accent text-accent-foreground",
  rejected: "bg-muted text-muted-foreground",
  published: "bg-success-soft text-success",
}

export function DraftStatusBadge({
  status,
  scheduled,
}: {
  status: DraftStatus
  scheduled?: boolean
}) {
  const label =
    status === "approved" && scheduled ? "Programado" : DRAFT_STATUS_LABELS[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {label}
    </span>
  )
}
