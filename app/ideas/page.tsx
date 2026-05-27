import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { IdeaCard } from "@/components/ideas/idea-card"
import { Lightbulb } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Idea } from "@/lib/types"

export const dynamic = "force-dynamic"

async function getIdeas(): Promise<Idea[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error loading ideas:", error)
    return []
  }
  return (data as Idea[]) ?? []
}

export default async function IdeasPage() {
  const ideas = await getIdeas()

  return (
    <DashboardShell>
      <Header
        title="Ideas"
        description={`${ideas.length} ${ideas.length === 1 ? "idea" : "ideas"} capturadas`}
      />
      <div className="flex-1 overflow-y-auto p-6">
        {ideas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3 max-w-3xl">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Lightbulb className="w-5 h-5 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-1">Todavía no hay ideas</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Capturá tu primera idea. Puede ser una frase suelta, un caso de
        cliente, una opinión — lo que sea. Después la IA arma los posts.
      </p>
      <a
        href="/ideas/new"
        className="text-sm underline underline-offset-4 hover:no-underline"
      >
        Crear primera idea →
      </a>
    </div>
  )
}
