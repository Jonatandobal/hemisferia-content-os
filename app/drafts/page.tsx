import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { DraftCard } from "@/components/drafts/draft-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Sparkles } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Draft, Idea } from "@/lib/types"
import { PILLAR_LABELS, PILLAR_COLORS } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = "force-dynamic"

// Trae drafts agrupados por idea, con la idea adjunta.
async function getDraftsGrouped(): Promise<
  { idea: Idea; drafts: Draft[] }[]
> {
  const supabase = createAdminClient()

  // Traemos drafts ordenados, con la idea anidada vía join
  const { data, error } = await supabase
    .from("drafts")
    .select("*, idea:ideas(*)")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("Error loading drafts:", error)
    return []
  }

  // Agrupar por idea_id manteniendo orden
  const map = new Map<string, { idea: Idea; drafts: Draft[] }>()
  for (const row of data as (Draft & { idea: Idea })[]) {
    const { idea, ...draft } = row
    if (!idea) continue
    if (!map.has(idea.id)) {
      map.set(idea.id, { idea, drafts: [] })
    }
    map.get(idea.id)!.drafts.push(draft as Draft)
  }

  // Ordenar drafts dentro de cada grupo por variant ASC
  for (const group of map.values()) {
    group.drafts.sort((a, b) => a.variant - b.variant)
  }

  return Array.from(map.values())
}

export default async function DraftsPage() {
  const groups = await getDraftsGrouped()
  const total = groups.reduce((sum, g) => sum + g.drafts.length, 0)

  return (
    <DashboardShell>
      <Header
        title="Drafts"
        description={`${total} ${total === 1 ? "variante generada" : "variantes generadas"} por IA`}
        showNewIdea={false}
      />
      <div className="flex-1 overflow-y-auto p-6">
        {groups.length === 0 ? <EmptyState /> : (
          <div className="space-y-8 max-w-3xl">
            {groups.map((group) => (
              <IdeaGroup key={group.idea.id} idea={group.idea} drafts={group.drafts} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function IdeaGroup({ idea, drafts }: { idea: Idea; drafts: Draft[] }) {
  return (
    <section className="space-y-3">
      <Card className="bg-muted/30">
        <CardContent className="p-3 flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <p className="text-sm font-medium leading-relaxed">
              {idea.raw_text}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {idea.pillar ? (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded border text-xs ${PILLAR_COLORS[idea.pillar]}`}
                >
                  {PILLAR_LABELS[idea.pillar]}
                </span>
              ) : null}
              <span>
                {formatDistanceToNow(new Date(idea.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
              <span className="opacity-60">·</span>
              <Badge variant="outline" className="text-xs">
                {idea.status}
              </Badge>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        </CardContent>
      </Card>

      <div className="space-y-3 pl-4 border-l-2 border-border ml-2">
        {drafts.map((draft) => (
          <DraftCard key={draft.id} draft={draft} />
        ))}
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileText className="w-5 h-5 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-1">Todavía no hay drafts</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Para generar drafts, andá a{" "}
        <a
          href="/ideas"
          className="underline underline-offset-4 hover:no-underline"
        >
          Ideas
        </a>{" "}
        y clickeá &quot;Generar drafts&quot; en cualquiera que esté pendiente.
      </p>
    </div>
  )
}
