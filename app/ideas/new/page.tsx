import { DashboardShell, PageBody } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { NewIdeaForm } from "@/components/ideas/new-idea-form"

export default function NewIdeaPage() {
  return (
    <DashboardShell>
      <Header
        title="Nueva idea"
        description="Una frase alcanza. Con hechos reales, los drafts salen mucho mejores."
      />
      <PageBody width="narrow">
        <NewIdeaForm />
      </PageBody>
    </DashboardShell>
  )
}
