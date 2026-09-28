import { DashboardShell, PageBody } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { TrendsSearchForm } from "@/components/trends/search-form"
import { TrendCard } from "@/components/trends/trend-card"
import { EmptyState } from "@/components/common/empty-state"
import { Radar, Search } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = "force-dynamic"

interface SearchWithTrends {
  id: string
  query: string
  region: string
  ai_summary: string | null
  created_at: string
  trends: {
    id: string
    title: string
    description: string
    angle: string
    source_url: string | null
    score: number
    converted_to_idea_id: string | null
  }[]
}

async function getRecentSearches(): Promise<SearchWithTrends[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("trend_searches")
    .select("*, trends(*)")
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) {
    console.error("Error loading trend searches:", error)
    return []
  }

  // Ordenar tendencias dentro de cada búsqueda por score descendente
  for (const search of (data as SearchWithTrends[]) ?? []) {
    search.trends.sort((a, b) => b.score - a.score)
  }

  return (data as SearchWithTrends[]) ?? []
}

export default async function TrendsPage() {
  const searches = await getRecentSearches()

  return (
    <DashboardShell>
      <Header
        title="Tendencias"
        description="Qué se está hablando hoy, con un ángulo listo para convertir en idea."
      />
      <PageBody width="narrow">
        <div className="space-y-8">
          <TrendsSearchForm />

          {searches.length === 0 ? (
            <EmptyTrends />
          ) : (
            <div className="space-y-8">
              {searches.map((search) => (
                <SearchGroup key={search.id} search={search} />
              ))}
            </div>
          )}
        </div>
      </PageBody>
    </DashboardShell>
  )
}

function SearchGroup({ search }: { search: SearchWithTrends }) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3 px-1">
        <Search className="w-4 h-4 text-muted-foreground mt-1.5 shrink-0" />
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <h2 className="text-lg font-semibold">&ldquo;{search.query}&rdquo;</h2>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(search.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
          {search.ai_summary ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {search.ai_summary}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {search.trends.map((trend) => (
          <TrendCard key={trend.id} trend={trend} />
        ))}
      </div>
    </section>
  )
}

function EmptyTrends() {
  return (
    <EmptyState icon={Radar} title="Todavía no hay búsquedas">
      Buscá un tema arriba. Cruzamos Google Trends y noticias de Argentina y
      te sugerimos entre 5 y 8 ángulos para escribir.
    </EmptyState>
  )
}
