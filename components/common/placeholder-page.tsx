import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { Construction } from "lucide-react"

interface PlaceholderPageProps {
  title: string
  description: string
  sessionLabel?: string
}

export function PlaceholderPage({
  title,
  description,
  sessionLabel,
}: PlaceholderPageProps) {
  return (
    <DashboardShell>
      <Header title={title} description={description} showNewIdea={false} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Construction className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">Próximamente</h3>
          <p className="text-sm text-muted-foreground">
            Esta sección se construye en{" "}
            <strong className="text-foreground">
              {sessionLabel ?? "una próxima sesión"}
            </strong>
            .
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
