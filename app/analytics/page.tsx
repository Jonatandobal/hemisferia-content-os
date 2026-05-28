import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Eye, MessageSquare, Share2, ThumbsUp, Inbox, TrendingUp } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  computeOverallStats,
  computeStatsByPillar,
  topPostsByScore,
  type PostWithDraft,
} from "@/lib/analytics"
import { PILLAR_LABELS, PILLAR_COLORS, type Pillar } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { MetricsForm } from "@/components/posts/metrics-form"

export const dynamic = "force-dynamic"

async function getAnalyticsData() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("posts")
    .select("*, draft:drafts(*, idea:ideas(*))")
    .order("published_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("Error loading analytics:", error)
    return { posts: [] as PostWithDraft[] }
  }
  return { posts: (data as PostWithDraft[]) ?? [] }
}

export default async function AnalyticsPage() {
  const { posts } = await getAnalyticsData()
  const overall = computeOverallStats(posts)
  const byPillar = computeStatsByPillar(posts)
  const topPosts = topPostsByScore(posts, 5)

  if (posts.length === 0) {
    return (
      <DashboardShell>
        <Header
          title="Analytics"
          description="Métricas de tus posts publicados"
          showNewIdea={false}
        />
        <div className="flex-1 overflow-y-auto p-6">
          <EmptyState />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <Header
        title="Analytics"
        description={`${posts.length} ${posts.length === 1 ? "post publicado" : "posts publicados"} · cargá métricas para ver insights`}
        showNewIdea={false}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* KPIs globales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Posts" value={overall.total_posts} icon={Inbox} />
            <KPI
              label="Impresiones"
              value={overall.total_impressions.toLocaleString("es-AR")}
              icon={Eye}
              color="text-blue-500"
            />
            <KPI
              label="Likes"
              value={overall.total_likes.toLocaleString("es-AR")}
              icon={ThumbsUp}
              color="text-emerald-500"
            />
            <KPI
              label="Engagement"
              value={`${(overall.engagement_rate * 100).toFixed(2)}%`}
              icon={TrendingUp}
              color="text-purple-500"
            />
          </div>

          {/* Performance por pilar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Performance por pilar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {byPillar.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Todavía no hay suficientes posts para analizar
                </p>
              ) : (
                <div className="space-y-3">
                  {byPillar.map((stat) => (
                    <PillarRow key={stat.pillar} stat={stat} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top posts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 5 posts</CardTitle>
            </CardHeader>
            <CardContent>
              {topPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin datos todavía
                </p>
              ) : (
                <div className="space-y-3">
                  {topPosts.map((post, i) => (
                    <TopPostRow
                      key={post.id}
                      rank={i + 1}
                      post={post}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

function KPI({
  label,
  value,
  icon: Icon,
  color = "text-foreground",
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color?: string
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
          </div>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )
}

function PillarRow({
  stat,
}: {
  stat: ReturnType<typeof computeStatsByPillar>[0]
}) {
  const isPillar = stat.pillar !== "sin_pilar"
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/30">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isPillar ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded border text-xs ${PILLAR_COLORS[stat.pillar as Pillar]}`}
          >
            {PILLAR_LABELS[stat.pillar as Pillar]}
          </span>
        ) : (
          <Badge variant="outline" className="text-xs">
            Sin pilar
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {stat.count} {stat.count === 1 ? "post" : "posts"}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="text-right">
          <p className="text-muted-foreground text-[10px]">Impresiones</p>
          <p className="font-medium tabular-nums">
            {stat.total_impressions.toLocaleString("es-AR")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-[10px]">Engagement</p>
          <p className="font-medium tabular-nums">
            {(stat.avg_engagement_rate * 100).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  )
}

function TopPostRow({
  rank,
  post,
}: {
  rank: number
  post: PostWithDraft
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
      <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed line-clamp-2 mb-1">
          {post.content}
        </p>
        <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              {format(new Date(post.published_at), "d MMM", { locale: es })}
            </span>
            <span className="opacity-60">·</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {(post.impressions ?? 0).toLocaleString("es-AR")}
            </span>
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {post.likes ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {post.comments ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              {post.shares ?? 0}
            </span>
            {post.linkedin_url ? (
              <a
                href={post.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:no-underline"
              >
                ver post
              </a>
            ) : null}
          </div>
          <MetricsForm post={post} />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <BarChart3 className="w-5 h-5 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-1">Todavía no hay posts publicados</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Cuando empieces a publicar y marcar los drafts como publicados, vas a
        ver acá las métricas, top posts y performance por pilar.
      </p>
      <Link
        href="/drafts"
        className="text-sm underline underline-offset-4 hover:no-underline"
      >
        Ir a Drafts →
      </Link>
    </div>
  )
}
