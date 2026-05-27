"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type Idea, PILLAR_LABELS, PILLAR_COLORS } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface IdeaCardProps {
  idea: Idea
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea_id: idea.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo generar")
      }
      toast.success("3 drafts generados ✨", {
        description: "Andá a /drafts para revisarlos",
      })
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado"
      toast.error(message)
    } finally {
      setGenerating(false)
    }
  }

  const isPending = idea.status === "pending"
  const isGenerated = idea.status === "generated"

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1">
            {idea.raw_text}
          </p>
          <Badge
            variant={isGenerated ? "default" : "outline"}
            className="shrink-0 text-xs"
          >
            {isGenerated ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                generated
              </>
            ) : (
              idea.status
            )}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2">
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

          {isPending && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Generar drafts
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
