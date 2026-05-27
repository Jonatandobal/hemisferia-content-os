import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createAdminClient } from "@/lib/supabase/admin"
import { Lightbulb, FileText, Send, TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

async function getDashboardStats() {
  const supabase = createAdminClient()

  const [ideasRes, draftsRes, postsRes] = await Promise.all([
    supabase
      .from("ideas")
      .select("id, status", { count: "exact" })
      .eq("status", "pending"),
    supabase
      .from("drafts")
      .select("id, status", { count: "exact" })
      .in("status", ["draft", "approved"]),
    supabase
      .from("posts")
      .select("id, impressions", { count: "exact" }),
  ])

  const totalImpressions =
    postsRes.data?.reduce((sum, p) => sum + (p.impressions ?? 0), 0) ?? 0

  return {
    pendingIdeas: ideasRes.count ?? 0,
    activeDrafts: draftsRes.count ?? 0,
    publishedPosts: postsRes.count ?? 0,
    totalImpressions,
  }
}

export default async function HomePage() {
  const stats = await getDashboardStats()

  return (
    <DashboardShell>
      <Header
        title="Dashboard"
        description="Visión general de tu sistema de contenido"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Ideas pendientes"
            value={stats.pendingIdeas}
            icon={Lightbulb}
            color="text-blue-500"
          />
          <StatCard
            label="Drafts activos"
            value={stats.activeDrafts}
            icon={FileText}
            color="text-orange-500"
          />
          <StatCard
            label="Posts publicados"
            value={stats.publishedPosts}
            icon={Send}
            color="text-emerald-500"
          />
          <StatCard
            label="Impresiones totales"
            value={stats.totalImpressions.toLocaleString("es-AR")}
            icon={TrendingUp}
            color="text-purple-500"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Bienvenido a Hemisferia Content OS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Tu sistema de gestión de contenido para LinkedIn. Capturá ideas,
              dejá que la IA genere drafts, aprobá los mejores y publicá.
            </p>
            <p>
              <strong className="text-foreground">Próximo paso:</strong>{" "}
              capturá tu primera idea en la sección{" "}
              <a
                href="/ideas"
                className="underline underline-offset-4 hover:no-underline"
              >
                Ideas
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          </div>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )
}
