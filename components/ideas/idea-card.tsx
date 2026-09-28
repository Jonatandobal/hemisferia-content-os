"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowRight, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PillarBadge } from "@/components/common/badges"
import { IDEA_STATUS_LABELS, type Idea } from "@/lib/types"

const SOURCE_LABELS: Record<Idea["source"], string> = {
  web: "Web",
  manual: "Manual",
  shortcut: "Atajo",
}

export function IdeaCard({ idea }: { idea: Idea }) {
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
      toast.success("3 drafts listos para revisar", {
        action: {
          label: "Ver",
          onClick: () => router.push(`/drafts?idea=${idea.id}`),
        },
      })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setGenerating(false)
    }
  }

  const isPending = idea.status === "pending"
  const [title, ...rest] = idea.raw_text.split("\n")
  const details = rest.join("\n").trim()

  return (
    <article className="rounded-2xl border border-border bg-card p-4 md:p-5 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <PillarBadge pillar={idea.pillar} />
        <span>
          {formatDistanceToNow(new Date(idea.created_at), {
            addSuffix: true,
            locale: es,
          })}
        </span>
        <span aria-hidden>·</span>
        <span>{SOURCE_LABELS[idea.source]}</span>
        {!isPending ? (
          <>
            <span aria-hidden>·</span>
            <span>{IDEA_STATUS_LABELS[idea.status]}</span>
          </>
        ) : null}
      </div>

      <div>
        <p className="font-medium leading-snug">{title}</p>
        {details ? (
          <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
            {details}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        {isPending ? (
          <Button size="sm" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="animate-spin" />
                Escribiendo 3 versiones…
              </>
            ) : (
              <>
                <Sparkles />
                Generar drafts
              </>
            )}
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href={`/drafts?idea=${idea.id}`}>
              Ver drafts
              <ArrowRight />
            </Link>
          </Button>
        )}
      </div>
    </article>
  )
}
