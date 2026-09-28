import { BarChart3, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DashboardShell, PageBody } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { StatTile } from "@/components/common/stat-tile"
import { EmptyState } from "@/components/common/empty-state"
import { PillarBadge } from "@/components/common/badges"
import { FormatBars, ImpressionColumns } from "@/components/analytics/charts"
import { MetricsForm } from "@/components/posts/metrics-form"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  computeOverallStats,
  computeStatsByPillar,
  type PostWithDraft,
} from "@/lib/analytics"
import { draftTemplate, type Pillar } from "@/lib/types"

export const dynamic = "force-dynamic"

const nf = new Intl.NumberFormat("es-AR")

async function getPosts() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("posts")
    .select("*, draft:drafts(*, idea:ideas(*))")
    .order("published_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("Error loading analytics:", error)
    return [] as PostWithDraft[]
  }
  return (data as PostWithDraft[]) ?? []
}

const interactions = (p: PostWithDraft) =>
  (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0)

export default async function AnalyticsPage() {
  const posts = await getPosts()

  if (posts.length === 0) {
    return (
      <DashboardShell>
        <Header title="Analytics" description="Qué funciona y qué no, con tus números reales." />
        <PageBody>
          <EmptyState icon={BarChart3} title="Todavía no hay posts publicados" action={{ href: "/drafts", label: "Ir a Drafts" }}>
            Cuando publiques y cargues las métricas de LinkedIn, vas a ver acá
            qué formatos te traen más engagement y más DMs.
          </EmptyState>
        </PageBody>
      </DashboardShell>
    )
  }

  const overall = computeOverallStats(posts)
  const byFormat = computeStatsByPillar(posts).map((s) => ({
    pillar: s.pillar === "sin_pilar" ? null : (s.pillar as Pillar),
    posts: s.count,
    impressions: s.total_impressions,
    interactions: s.total_likes + s.total_comments + s.total_shares,
    engagement: s.avg_engagement_rate,
  }))
  const chronological = [...posts].reverse().slice(-24)
  const withoutMetrics = posts.filter((p) => !p.metrics_updated_at).length

  return (
    <DashboardShell>
      <Header
        title="Analytics"
        description={`${posts.length} ${posts.length === 1 ? "post publicado" : "posts publicados"}`}
      />
      <PageBody width="wide">
        <div className="space-y-8">
          {withoutMetrics > 0 ? (
            <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
              {withoutMetrics} {withoutMetrics === 1 ? "post no tiene" : "posts no tienen"} métricas cargadas.
              Cargalas a las 48 horas y a los 7 días de publicar para comparar bien.
            </p>
          ) : null}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Impresiones" value={nf.format(overall.total_impressions)} hint={`${nf.format(Math.round(overall.total_impressions / posts.length))} por post`} />
            <StatTile label="Engagement" value={`${(overall.engagement_rate * 100).toFixed(1)}%`} hint="Interacciones / impresiones" />
            <StatTile label="Comentarios" value={nf.format(overall.total_comments)} hint="La señal que más pesa en LinkedIn" />
            <StatTile label="DMs generados" value={overall.total_dms} hint="Lo que trae clientes" emphasis />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Engagement por formato</h2>
                <p className="text-sm text-muted-foreground">Qué tipo de post hace reaccionar más a tu red.</p>
              </div>
              <FormatBars rows={byFormat} />
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Impresiones por post</h2>
                <p className="text-sm text-muted-foreground">En orden de publicación · pasá el mouse para ver cada uno.</p>
              </div>
              <div className="pt-4">
                <ImpressionColumns
                  points={chronological.map((p) => ({
                    id: p.id,
                    label: format(new Date(p.published_at), "d MMM", { locale: es }),
                    impressions: p.impressions ?? 0,
                    engagement: (p.impressions ?? 0) > 0 ? interactions(p) / p.impressions : 0,
                    hook: p.content.split("\n")[0],
                  }))}
                />
              </div>
            </section>
          </div>

          {/* Tabla: la vista completa y accesible de todos los números */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Todos los posts</h2>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Post</th>
                    <th className="px-3 py-3 font-medium">Formato</th>
                    <th className="px-3 py-3 font-medium text-right">Impresiones</th>
                    <th className="px-3 py-3 font-medium text-right">Interacciones</th>
                    <th className="px-3 py-3 font-medium text-right">Engagement</th>
                    <th className="px-3 py-3 font-medium text-right">DMs</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {posts.map((p) => (
                    <tr key={p.id} className="align-top">
                      <td className="px-4 py-3 max-w-xs">
                        <p className="line-clamp-2 font-medium">{p.content.split("\n")[0]}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {format(new Date(p.published_at), "d 'de' MMMM", { locale: es })}
                          {p.metrics_updated_at ? "" : " · sin métricas"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <PillarBadge pillar={p.draft ? draftTemplate(p.draft) : null} />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{nf.format(p.impressions ?? 0)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{nf.format(interactions(p))}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {(p.impressions ?? 0) > 0 ? `${((interactions(p) / p.impressions) * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{p.dms_generated ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {p.linkedin_url ? (
                            <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="Ver en LinkedIn" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : null}
                          <MetricsForm post={p} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </PageBody>
    </DashboardShell>
  )
}
