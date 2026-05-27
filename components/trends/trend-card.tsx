"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Loader2, Lightbulb, Check } from "lucide-react"
import { toast } from "sonner"

interface Trend {
  id: string
  title: string
  description: string
  angle: string
  source_url: string | null
  score: number
  converted_to_idea_id: string | null
}

interface TrendCardProps {
  trend: Trend
}

export function TrendCard({ trend }: TrendCardProps) {
  const router = useRouter()
  const [converting, setConverting] = useState(false)

  const isConverted = !!trend.converted_to_idea_id

  async function handleConvert() {
    setConverting(true)
    try {
      const res = await fetch(`/api/trends/${trend.id}/convert`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo convertir")
      }
      toast.success("Idea creada", {
        description: "Andá a /ideas para generar drafts",
      })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setConverting(false)
    }
  }

  const scoreColor =
    trend.score >= 80
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      : trend.score >= 60
        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
        : "bg-muted text-muted-foreground"

  return (
    <Card className={isConverted ? "border-emerald-500/40" : ""}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-sm leading-tight flex-1">
            {trend.title}
          </h3>
          <Badge variant="outline" className={`shrink-0 ${scoreColor}`}>
            {trend.score}/100
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {trend.description}
        </p>

        <div className="border-l-2 border-foreground/20 pl-3 py-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Ángulo sugerido
          </p>
          <p className="text-sm leading-relaxed">{trend.angle}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          {trend.source_url ? (
            <a
              href={trend.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Ver fuente
            </a>
          ) : (
            <span className="text-xs text-muted-foreground/60">
              Sin fuente específica
            </span>
          )}

          {isConverted ? (
            <Button size="sm" variant="outline" disabled>
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Ya convertida
            </Button>
          ) : (
            <Button size="sm" onClick={handleConvert} disabled={converting}>
              {converting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
                  Convertir en idea
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
