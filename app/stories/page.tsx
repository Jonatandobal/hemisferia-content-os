import { BookMarked } from "lucide-react"
import { DashboardShell, PageBody } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { StoryForm } from "@/components/ideas/story-form"
import { StoryCard } from "@/components/ideas/story-card"
import { EmptyState } from "@/components/common/empty-state"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Story } from "@/lib/types"

export const dynamic = "force-dynamic"

async function getStories(): Promise<Story[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) {
    console.error("Error loading stories:", error)
    return []
  }
  return (data as Story[]) ?? []
}

export default async function StoriesPage() {
  const stories = await getStories()

  return (
    <DashboardShell>
      <Header
        title="Historias"
        description="Tu banco de casos reales — la IA nunca inventa lo que ya guardaste acá."
      />
      <PageBody width="narrow">
        <div className="space-y-6">
          <StoryForm />

          {stories.length === 0 ? (
            <EmptyState icon={BookMarked} title="Todavía no guardaste ninguna historia">
              Un caso, un dato, un cliente — lo cargás una vez y lo reusás en
              todas las ideas que quieras, sin volver a escribirlo ni
              arriesgarte a que la IA invente algo distinto.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {stories.map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          )}
        </div>
      </PageBody>
    </DashboardShell>
  )
}
