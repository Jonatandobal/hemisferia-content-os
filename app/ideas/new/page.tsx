import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { NewIdeaForm } from "@/components/ideas/new-idea-form"

export default function NewIdeaPage() {
  return (
    <DashboardShell>
      <Header
        title="Nueva idea"
        description="Capturá una idea cruda. Después la IA arma 3 variantes de post."
        showNewIdea={false}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <NewIdeaForm />
      </div>
    </DashboardShell>
  )
}
