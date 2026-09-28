import { DashboardShell, PageBody } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { NewIdeaForm } from "@/components/ideas/new-idea-form"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Story } from "@/lib/types"

export const dynamic = "force-dynamic"

async function getStories(): Promise<Story[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) {
    console.error("Error loading stories:", error)
    return []
  }
  return (data as Story[]) ?? []
}

export default async function NewIdeaPage() {
  const stories = await getStories()

  return (
    <DashboardShell>
      <Header
        title="Nueva idea"
        description="Una frase alcanza. Con hechos reales, los drafts salen mucho mejores."
      />
      <PageBody width="narrow">
        <NewIdeaForm stories={stories} />
      </PageBody>
    </DashboardShell>
  )
}
