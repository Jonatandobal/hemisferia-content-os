import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { render } from "@react-email/render"
import { createAdminClient } from "@/lib/supabase/admin"
import { dayRangeInTimeZone } from "@/lib/timezone"
import { reconcilePubloraPosts } from "@/lib/publora-sync"
import DailyReminderEmail from "@/emails/daily-reminder"

export const maxDuration = 30

// GET /api/cron/daily-reminder
// Vercel Cron lo llama todos los días a las 7am (ver vercel.json)
// Trae drafts approved con scheduled_for hoy y manda email recordatorio.
export async function GET(req: NextRequest) {
  // Verificar el secret de Vercel Cron
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    // Registrar lo que Publora publicó desde la última corrida
    await reconcilePubloraPosts(supabase)

    // Rango del día actual en hora argentina (Vercel corre en UTC)
    const now = new Date()
    const { start, end } = dayRangeInTimeZone(now)

    // Drafts approved + scheduled_for en el día de hoy
    const { data: drafts, error } = await supabase
      .from("drafts")
      .select(
        "id, variant, template, content, scheduled_for, image_url, publora_status",
      )
      .eq("status", "approved")
      .gte("scheduled_for", start.toISOString())
      .lt("scheduled_for", end.toISOString())
      .order("scheduled_for", { ascending: true })

    if (error) {
      console.error("Error querying drafts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!drafts || drafts.length === 0) {
      return NextResponse.json({
        sent: false,
        reason: "No hay drafts programados para hoy",
      })
    }

    // Configurar Resend
    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL
    const toEmail = process.env.RESEND_TO_EMAIL
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://hemisferia-content-os.vercel.app"

    if (!resendKey || !fromEmail || !toEmail) {
      return NextResponse.json(
        { error: "Faltan env vars de Resend" },
        { status: 500 },
      )
    }

    const resend = new Resend(resendKey)

    // Renderizar el email JSX a HTML
    const html = await render(
      DailyReminderEmail({
        appUrl,
        date: now,
        drafts: drafts.map((d) => ({
          id: d.id,
          variant: d.variant,
          template: d.template,
          content: d.content,
          scheduled_for: d.scheduled_for,
          image_url: d.image_url,
          auto_publish: d.publora_status === "scheduled",
        })),
      }),
    )

    // Enviar
    const { data, error: sendErr } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `📢 ${drafts.length} ${drafts.length === 1 ? "post" : "posts"} para publicar hoy`,
      html,
    })

    if (sendErr) {
      console.error("Resend error:", sendErr)
      return NextResponse.json(
        { error: `Resend: ${sendErr.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      sent: true,
      drafts_count: drafts.length,
      email_id: data?.id,
    })
  } catch (err) {
    console.error("Cron error:", err)
    const message =
      err instanceof Error ? err.message : "Error inesperado"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
