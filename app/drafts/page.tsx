import Link from "next/link"
import { FileText, X } from "lucide-react"
import { DashboardShell, PageBody } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { DraftCard } from "@/components/drafts/draft-card"
import { LinkTabs } from "@/components/common/link-tabs"
import { EmptyState } from "@/components/common/empty-state"
import { PillarBadge } from "@/components/common/badges"
import { createAdminClient } from "@/lib/supabase/admin"
import { reconcilePubloraPosts } from "@/lib/publora-sync"
import type { Draft, Idea } from "@/lib/types"

export const dynamic = "force-dynamic"

type DraftWithIdea = Draft & { idea: Idea | null }

const TABS = [
  { value: "revisar", label: "Por revisar", match: (d: Draft) => d.status === "draft" },
  { value: "aprobados", label: "Sin fecha", match: (d: Draft) => d.status === "approved" && !d.scheduled_for },
  { value: "programados", label: "Programados", match: (d: Draft) => d.status === "approved" && !!d.scheduled_for },
  { value: "publicados", label: "Publicados", match: (d: Draft) => d.status === "published" },
  { value: "descartados", label: "Descartados", match: (d: Draft) => d.status === "rejected" },
] as const

async function getDrafts(): Promise<DraftWithIdea[]> {
  const supabase = createAdminClient()

  // Registrar lo que Publora ya publicó antes de listar
  await reconcilePubloraPosts(supabase)

  const { data, error } = await supabase
    .from("drafts")
    .select("*, idea:ideas(*)")
    .order("created_at", { ascending: false })
    .limit(300)

  if (error) {
    console.error("Error loading drafts:", error)
    return []
  }
  return (data as DraftWithIdea[]) ?? []
}

export default async function DraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; idea?: string; focus?: string }>
}) {
  const params = await searchParams
  const all = await getDrafts()
  const drafts = params.idea ? all.filter((d) => d.idea_id === params.idea) : all
  const focusDraft = params.focus ? all.find((d) => d.id === params.focus) : null

  // El link del email (?focus=) abre la pestaña donde está ese draft.
  const tab =
    TABS.find((t) => t.value === params.tab) ??
    (focusDraft ? TABS.find((t) => t.match(focusDraft)) : undefined) ??
    TABS[0]

  let visible = drafts.filter(tab.match)
  if (tab.value === "programados") {
    visible = [...visible].sort((a, b) => a.scheduled_for!.localeCompare(b.scheduled_for!))
  }

  const filterIdea = params.idea ? all.find((d) => d.idea_id === params.idea)?.idea : null
  const query = (next: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    const merged = { idea: params.idea, ...next }
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v)
    return `/drafts?${sp.toString()}`
  }

  return (
    <DashboardShell>
      <Header
        title="Drafts"
        description="Revisá, editá y aprobá. Lo aprobado se programa en el calendario."
      />
      <PageBody width="narrow">
        <div className="space-y-6">
          <LinkTabs
            tabs={TABS.map((t) => ({ value: t.value, label: t.label, count: drafts.filter(t.match).length }))}
            active={tab.value}
            hrefFor={(v) => query({ tab: v })}
          />

          {filterIdea ? (
            <div className="flex items-start justify-between gap-3 rounded-xl bg-accent px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="text-xs text-accent-foreground/70 mb-0.5">Mostrando los drafts de la idea</p>
                <p className="text-accent-foreground font-medium line-clamp-2">{filterIdea.raw_text.split("\n")[0]}</p>
              </div>
              <Link href={`/drafts?tab=${tab.value}`} className="shrink-0 inline-flex items-center gap-1 text-accent-foreground hover:underline">
                <X className="w-4 h-4" /> Ver todos
              </Link>
            </div>
          ) : null}

          {visible.length === 0 ? (
            <EmptyTab tab={tab.value} />
          ) : tab.value === "revisar" ? (
            <GroupedByIdea drafts={visible} focusId={params.focus} />
          ) : (
            <div className="space-y-4">
              {visible.map((d) => (
                <DraftCard
                  key={d.id}
                  draft={d}
                  ideaText={d.idea?.raw_text.split("\n")[0]}
                  focused={d.id === params.focus}
                />
              ))}
            </div>
          )}
        </div>
      </PageBody>
    </DashboardShell>
  )
}

// En "Por revisar" se comparan las 3 variantes de cada idea juntas.
function GroupedByIdea({ drafts, focusId }: { drafts: DraftWithIdea[]; focusId?: string }) {
  const groups = new Map<string, { idea: Idea | null; drafts: DraftWithIdea[] }>()
  for (const d of drafts) {
    const g = groups.get(d.idea_id) ?? { idea: d.idea, drafts: [] }
    g.drafts.push(d)
    groups.set(d.idea_id, g)
  }

  return (
    <div className="space-y-10">
      {[...groups.values()].map(({ idea, drafts }) => (
        <section key={idea?.id ?? drafts[0].id} className="space-y-3">
          {idea ? (
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <PillarBadge pillar={idea.pillar} />
                <span>{drafts.length === 1 ? "1 variante" : `${drafts.length} variantes para comparar`}</span>
              </div>
              <h2 className="text-lg font-semibold leading-snug">{idea.raw_text.split("\n")[0]}</h2>
            </div>
          ) : null}
          <div className="space-y-4">
            {[...drafts]
              .sort((a, b) => a.variant - b.variant)
              .map((d) => (
                <DraftCard key={d.id} draft={d} focused={d.id === focusId} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const EMPTY_COPY: Record<string, { title: string; text: string; action?: { href: string; label: string } }> = {
  revisar: {
    title: "Nada para revisar",
    text: "Generá drafts desde una idea y aparecen acá para que elijas la mejor versión.",
    action: { href: "/ideas", label: "Ir a Ideas" },
  },
  aprobados: { title: "Todo lo aprobado tiene fecha", text: "Cuando apruebes un draft, aparece acá hasta que lo programes." },
  programados: {
    title: "No hay nada programado",
    text: "Elegí un día para tus drafts aprobados desde el calendario.",
    action: { href: "/calendar", label: "Abrir calendario" },
  },
  publicados: { title: "Todavía no publicaste", text: "Lo que publiques (a mano o vía Publora) queda registrado acá y en Analytics." },
  descartados: { title: "Sin descartes", text: "Los drafts que descartes quedan acá por si querés recuperarlos." },
}

function EmptyTab({ tab }: { tab: string }) {
  const copy = EMPTY_COPY[tab]
  return (
    <EmptyState icon={FileText} title={copy.title} action={copy.action}>
      {copy.text}
    </EmptyState>
  )
}
