import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { render } from "@react-email/render"
import { createAdminClient } from "@/lib/supabase/admin"
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

    // Rango del día actual (UTC) — en Vercel Cron Argentina sería UTC-3
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setUTCHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setUTCHours(23, 59, 59, 999)

    // Drafts approved + scheduled_for en el día de hoy
    const { data: drafts, error } = await supabase
      .from("drafts")
      .select("id, variant, content, scheduled_for, image_url")
      .eq("status", "approved")
      .gte("scheduled_for", startOfDay.toISOString())
      .lte("scheduled_for", endOfDay.toISOString())
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
          content: d.content,
          scheduled_for: d.scheduled_for,
          image_url: d.image_url,
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
