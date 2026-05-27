import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Header } from "@/components/layout/header"
import { MonthGrid } from "@/components/calendar/month-grid"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Draft } from "@/lib/types"

export const dynamic = "force-dynamic"

async function getDraftsForCalendar() {
  const supabase = createAdminClient()

  const [scheduledRes, unscheduledRes] = await Promise.all([
    // Aprobados con scheduled_for (van al calendario)
    supabase
      .from("drafts")
      .select("*")
      .eq("status", "approved")
      .not("scheduled_for", "is", null)
      .order("scheduled_for", { ascending: true }),
    // Aprobados sin programar (van al drawer)
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

export default async function CalendarPage() {
  const { scheduled, unscheduled } = await getDraftsForCalendar()

  return (
    <DashboardShell>
      <Header
        title="Calendario"
        description="Programá los drafts aprobados día por día"
        showNewIdea={false}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <MonthGrid
            scheduledDrafts={scheduled}
            unscheduledDrafts={unscheduled}
          />
        </div>
      </div>
    </DashboardShell>
  )
}
