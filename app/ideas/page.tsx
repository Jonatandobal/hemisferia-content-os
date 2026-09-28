import { Lightbulb } from "lucide-react"
import { DashboardShell, PageBody } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { IdeaCard } from "@/components/ideas/idea-card"
import { QuickCapture } from "@/components/ideas/quick-capture"
import { LinkTabs } from "@/components/common/link-tabs"
import { EmptyState } from "@/components/common/empty-state"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Idea } from "@/lib/types"

export const dynamic = "force-dynamic"

const TABS = [
  { value: "pendientes", label: "Sin drafts", status: "pending" },
  { value: "con-drafts", label: "Con drafts", status: "generated" },
  { value: "todas", label: "Todas", status: null },
] as const

async function getIdeas() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("Error loading ideas:", error)
    return []
  }
  return (data as Idea[]) ?? []
}

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const ideas = await getIdeas()
  const tab = TABS.find((t) => t.value === tabParam) ?? TABS[0]
  const visible = tab.status ? ideas.filter((i) => i.status === tab.status) : ideas

  return (
    <DashboardShell>
      <Header
        title="Ideas"
        description="Todo empieza acá: capturá rápido, generá los drafts cuando quieras."
        showNewIdea
      />
      <PageBody width="narrow">
        <div className="space-y-6">
          <QuickCapture compact />

          <LinkTabs
            tabs={TABS.map((t) => ({
              value: t.value,
              label: t.label,
              count: t.status ? ideas.filter((i) => i.status === t.status).length : ideas.length,
            }))}
            active={tab.value}
            hrefFor={(v) => `/ideas?tab=${v}`}
          />

          {visible.length === 0 ? (
            <EmptyState icon={Lightbulb} title={tab.value === "pendientes" ? "No hay ideas esperando" : "Nada por acá"}>
              {tab.value === "pendientes"
                ? "Capturá una arriba: una frase suelta alcanza. Cuanto más concreta (qué pasó, con quién, qué número), mejores los drafts."
                : "Cuando generes drafts de tus ideas, van a aparecer acá."}
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {visible.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )}
        </div>
      </PageBody>
    </DashboardShell>
  )
}
