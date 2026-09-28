import Link from "next/link"
import { ArrowRight, CalendarClock, Send, Zap } from "lucide-react"
import { DashboardShell, PageBody } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { StatTile } from "@/components/common/stat-tile"
import { PillarBadge } from "@/components/common/badges"
import { QuickCapture } from "@/components/ideas/quick-capture"
import { createAdminClient } from "@/lib/supabase/admin"
import { reconcilePubloraPosts } from "@/lib/publora-sync"
import { APP_TIME_ZONE, formatLongDate, formatTime } from "@/lib/timezone"
import { draftTemplate, type Draft } from "@/lib/types"

export const dynamic = "force-dynamic"

const DAY_MS = 24 * 60 * 60 * 1000

async function getDashboard() {
  const supabase = createAdminClient()

  // Registrar lo que Publora ya publicó antes de contar
  await reconcilePubloraPosts(supabase)

  const now = new Date()
  const since = new Date(now.getTime() - 30 * DAY_MS).toISOString()

  const [ideasRes, reviewRes, unscheduledRes, upcomingRes, postsRes] =
    await Promise.all([
      supabase
        .from("ideas")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("drafts")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
      supabase
        .from("drafts")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .is("scheduled_for", null),
      supabase
        .from("drafts")
        .select("*", { count: "exact" })
        .eq("status", "approved")
        .gte("scheduled_for", now.toISOString())
        .order("scheduled_for", { ascending: true })
        .limit(5),
      supabase
        .from("posts")
        .select("impressions, likes, comments, shares, dms_generated")
        .gte("published_at", since),
    ])

  const posts = postsRes.data ?? []
  const sum = (k: "impressions" | "likes" | "comments" | "shares" | "dms_generated") =>
    posts.reduce((acc, p) => acc + (p[k] ?? 0), 0)
  const impressions = sum("impressions")
  const interactions = sum("likes") + sum("comments") + sum("shares")

  return {
    pendingIdeas: ideasRes.count ?? 0,
    toReview: reviewRes.count ?? 0,
    unscheduled: unscheduledRes.count ?? 0,
    upcoming: (upcomingRes.data as Draft[]) ?? [],
    scheduledCount: upcomingRes.count ?? 0,
    month: {
      posts: posts.length,
      impressions,
      engagement: impressions > 0 ? interactions / impressions : 0,
      dms: sum("dms_generated"),
    },
  }
}

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: APP_TIME_ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  )
  return hour < 13 ? "Buen día" : hour < 20 ? "Buenas tardes" : "Buenas noches"
}

export default async function HomePage() {
  const d = await getDashboard()
  const nf = new Intl.NumberFormat("es-AR")

  // La acción más importante ahora, en orden de flujo.
  const next =
    d.toReview > 0
      ? { text: `Tenés ${d.toReview} ${d.toReview === 1 ? "draft" : "drafts"} para revisar`, href: "/drafts", cta: "Revisar" }
      : d.unscheduled > 0
        ? { text: `${d.unscheduled} ${d.unscheduled === 1 ? "draft aprobado espera" : "drafts aprobados esperan"} fecha`, href: "/calendar", cta: "Programar" }
        : d.pendingIdeas > 0
          ? { text: `${d.pendingIdeas} ${d.pendingIdeas === 1 ? "idea espera" : "ideas esperan"} sus drafts`, href: "/ideas", cta: "Generar" }
          : null

  return (
    <DashboardShell>
      <Header
        title={greeting()}
        description={formatLongDate(new Date())}
        showNewIdea
      />
      <PageBody>
        <div className="space-y-8">
          {next ? (
            <Link
              href={next.href}
              className="group flex items-center justify-between gap-4 rounded-2xl bg-primary text-primary-foreground px-5 py-4 md:px-6 md:py-5 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 shrink-0 rounded-xl bg-white/15 grid place-items-center">
                  <Zap className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-white/60">
                    Lo próximo
                  </p>
                  <p className="font-heading text-lg font-medium leading-snug line-clamp-2">
                    {next.text}
                  </p>
                </div>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 text-sm font-medium">
                {next.cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Tu flujo</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile label="Ideas sin drafts" value={d.pendingIdeas} href="/ideas" hint="Capturadas, falta generar" />
              <StatTile label="Drafts por revisar" value={d.toReview} href="/drafts" hint="Aprobá o descartá" emphasis={d.toReview > 0} />
              <StatTile label="Aprobados sin fecha" value={d.unscheduled} href="/calendar" hint="Elegí el día" />
              <StatTile label="Programados" value={d.scheduledCount} href="/calendar" hint="Próximos a salir" />
            </div>
          </section>

          <div className="grid lg:grid-cols-5 gap-8">
            <section className="lg:col-span-3 space-y-3">
              <h2 className="text-lg font-semibold">Capturá una idea</h2>
              <QuickCapture />
            </section>

            <section className="lg:col-span-2 space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Próximas publicaciones</h2>
                <Link href="/calendar" className="text-sm text-muted-foreground hover:text-foreground">
                  Calendario →
                </Link>
              </div>
              {d.upcoming.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
                  <CalendarClock className="w-5 h-5 mx-auto mb-2 opacity-60" />
                  No hay nada programado. Aprobá un draft y elegile un día.
                </div>
              ) : (
                <ul className="rounded-2xl border border-border bg-card divide-y divide-border">
                  {d.upcoming.map((draft) => (
                    <li key={draft.id}>
                      <Link href={`/drafts?focus=${draft.id}`} className="flex gap-3 p-4 hover:bg-secondary/50 transition-colors">
                        <div className="w-12 shrink-0 text-center">
                          <p className="text-[11px] uppercase text-muted-foreground">
                            {new Intl.DateTimeFormat("es-AR", { timeZone: APP_TIME_ZONE, weekday: "short" }).format(new Date(draft.scheduled_for!))}
                          </p>
                          <p className="font-heading text-xl font-semibold leading-tight">
                            {new Intl.DateTimeFormat("es-AR", { timeZone: APP_TIME_ZONE, day: "numeric" }).format(new Date(draft.scheduled_for!))}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-sm line-clamp-2">{draft.content.split("\n")[0]}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <PillarBadge pillar={draftTemplate(draft)} />
                            <span>{formatTime(new Date(draft.scheduled_for!))} hs</span>
                            {draft.publora_status === "scheduled" ? (
                              <span className="inline-flex items-center gap-1 text-success">
                                <Send className="w-3 h-3" /> automático
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Últimos 30 días</h2>
              <Link href="/analytics" className="text-sm text-muted-foreground hover:text-foreground">
                Analytics →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile label="Posts publicados" value={d.month.posts} />
              <StatTile label="Impresiones" value={nf.format(d.month.impressions)} />
              <StatTile label="Engagement" value={`${(d.month.engagement * 100).toFixed(1)}%`} hint="Interacciones / impresiones" />
              <StatTile label="DMs generados" value={d.month.dms} hint="Lo que trae clientes" />
            </div>
          </section>
        </div>
      </PageBody>
    </DashboardShell>
  )
}
