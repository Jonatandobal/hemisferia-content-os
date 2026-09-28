import { DashboardShell, PageBody } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { MonthGrid } from "@/components/calendar/month-grid"
import { createAdminClient } from "@/lib/supabase/admin"
import { reconcilePubloraPosts } from "@/lib/publora-sync"
import type { Draft } from "@/lib/types"

export const dynamic = "force-dynamic"

async function getDraftsForCalendar() {
  const supabase = createAdminClient()

  // Registrar lo que Publora ya publicó antes de armar el calendario
  await reconcilePubloraPosts(supabase)

  const [scheduledRes, unscheduledRes] = await Promise.all([
    // Aprobados con scheduled_for (van al calendario)
    supabase
      .from("drafts")
      .select("*")
      .eq("status", "approved")
      .not("scheduled_for", "is", null)
      .order("scheduled_for", { ascending: true }),
    // Aprobados sin programar (van a la bandeja)
    supabase
      .from("drafts")
      .select("*")
      .eq("status", "approved")
      .is("scheduled_for", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  return {
    scheduled: (scheduledRes.data as Draft[]) ?? [],
    unscheduled: (unscheduledRes.data as Draft[]) ?? [],
  }
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>
}) {
  const { draft: draftParam } = await searchParams
  const { scheduled, unscheduled } = await getDraftsForCalendar()

  return (
    <DashboardShell>
      <Header
        title="Calendario"
        description="Elegí un draft aprobado y tocá el día en que querés que salga."
      />
      <PageBody width="wide">
        <MonthGrid
          scheduledDrafts={scheduled}
          unscheduledDrafts={unscheduled}
          initialSelectedId={draftParam}
        />
      </PageBody>
    </DashboardShell>
  )
}
