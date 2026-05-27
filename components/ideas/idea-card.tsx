import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type Idea, PILLAR_LABELS, PILLAR_COLORS } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface IdeaCardProps {
  idea: Idea
}

export function IdeaCard({ idea }: IdeaCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1">
            {idea.raw_text}
          </p>
          <Badge variant="outline" className="shrink-0 text-xs">
            {idea.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {idea.pillar ? (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded border text-xs ${PILLAR_COLORS[idea.pillar]}`}
            >
              {PILLAR_LABELS[idea.pillar]}
            </span>
          ) : (
            <span className="text-muted-foreground/60 italic">
              Sin pilar
            </span>
          )}
          <span className="opacity-60">·</span>
          <span>
            {formatDistanceToNow(new Date(idea.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>
          <span className="opacity-60">·</span>
          <span className="opacity-70">{idea.source}</span>
        </div>
      </CardContent>
    </Card>
  )
}
