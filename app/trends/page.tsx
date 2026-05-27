import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { TrendsSearchForm } from "@/components/trends/search-form"
import { TrendCard } from "@/components/trends/trend-card"
import { Card, CardContent } from "@/components/ui/card"
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
        title="Radar de tendencias"
        description="Detectá temas hot y convertilos en ideas para LinkedIn"
        showNewIdea={false}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-6">
          <TrendsSearchForm />

          {searches.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-8">
              {searches.map((search) => (
                <SearchGroup key={search.id} search={search} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

function SearchGroup({ search }: { search: SearchWithTrends }) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3 px-1">
        <Search className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <h2 className="text-sm font-semibold">&quot;{search.query}&quot;</h2>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(search.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
          {search.ai_summary ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {search.ai_summary}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 pl-7">
        {search.trends.map((trend) => (
          <TrendCard key={trend.id} trend={trend} />
        ))}
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center text-center py-12">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Radar className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">Todavía no hay búsquedas</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Apretá &quot;Buscar tendencias&quot; arriba para arrancar tu primer
          radar. La IA te va a sugerir 5-8 ángulos para escribir en LinkedIn.
        </p>
      </CardContent>
    </Card>
  )
}
