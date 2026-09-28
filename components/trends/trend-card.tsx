"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, ExternalLink, Lightbulb, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Trend {
  id: string
  title: string
  description: string
  angle: string
  source_url: string | null
  score: number
  converted_to_idea_id: string | null
}

// Medidor de relevancia (dataviz: el relleno es el valor, la pista es un
// paso más claro del mismo tono). Siempre con el número escrito al lado.
function ScoreMeter({ score }: { score: number }) {
  const label = score >= 80 ? "Imperdible" : score >= 60 ? "Relevante" : "Secundaria"
  return (
    <div className="flex items-center gap-2 shrink-0" title={`Relevancia para Hemisferia: ${score}/100`}>
      <div className="h-1.5 w-16 rounded-full bg-accent overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        <span className="font-medium text-foreground">{score}</span> · {label}
      </span>
    </div>
  )
}

export function TrendCard({ trend }: { trend: Trend }) {
  const router = useRouter()
  const [converting, setConverting] = useState(false)
  const isConverted = !!trend.converted_to_idea_id

  async function handleConvert() {
    setConverting(true)
    try {
      const res = await fetch(`/api/trends/${trend.id}/convert`, { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo convertir")
      }
      toast.success("Idea creada", {
        action: { label: "Ver", onClick: () => router.push("/ideas") },
      })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
    } finally {
      setConverting(false)
    }
  }

  return (
    <article className={cn("rounded-2xl border bg-card p-4 md:p-5 space-y-3", isConverted ? "border-success/30" : "border-border")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug flex-1 min-w-48">{trend.title}</h3>
        <ScoreMeter score={trend.score} />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{trend.description}</p>

      <div className="rounded-xl bg-accent/60 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-accent-foreground/70 mb-1">
          Ángulo para tu post
        </p>
        <p className="text-sm leading-relaxed text-accent-foreground">{trend.angle}</p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        {trend.source_url ? (
          <a href={trend.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ExternalLink className="w-3.5 h-3.5" />
            Ver fuente
          </a>
        ) : (
          <span className="text-xs text-muted-foreground/70">Sin fuente puntual</span>
        )}

        {isConverted ? (
          <Button asChild size="sm" variant="ghost">
            <Link href="/ideas">
              Ya es idea <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button size="sm" onClick={handleConvert} disabled={converting}>
            {converting ? <Loader2 className="animate-spin" /> : <Lightbulb />}
            Convertir en idea
          </Button>
        )}
      </div>
    </article>
  )
}
