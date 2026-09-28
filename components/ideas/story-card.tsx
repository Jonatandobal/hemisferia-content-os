"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowRight, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PillarBadge } from "@/components/common/badges"
import type { Story } from "@/lib/types"

export function StoryCard({ story }: { story: Story }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Borrar "${story.title}"? Las ideas que la usaron no se tocan.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/stories/${story.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("No se pudo borrar")
      toast.success("Historia borrada")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error")
      setDeleting(false)
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4 md:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <PillarBadge pillar={story.pillar} />
            {story.times_used > 0 ? (
              <span className="text-xs text-muted-foreground">
                Usada {story.times_used} {story.times_used === 1 ? "vez" : "veces"}
              </span>
            ) : null}
          </div>
          <h3 className="font-medium leading-snug">{story.title}</h3>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Borrar historia"
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{story.situation}</p>

      {story.result || story.client_type ? (
        <div className="flex flex-wrap gap-2 text-xs">
          {story.result ? (
            <span className="rounded-full bg-accent text-accent-foreground px-2.5 py-1">{story.result}</span>
          ) : null}
          {story.client_type ? (
            <span className="rounded-full bg-secondary text-secondary-foreground px-2.5 py-1">{story.client_type}</span>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button asChild size="sm" variant="ghost">
          <Link href="/ideas/new">
            Usar en una idea <ArrowRight />
          </Link>
        </Button>
      </div>
    </article>
  )
}
