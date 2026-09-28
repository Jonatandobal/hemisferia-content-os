import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncDraftToPublora } from "@/lib/publora-sync"

// POST /api/drafts/[id]/schedule — programar un draft para una fecha/hora.
// DELETE /api/drafts/[id]/schedule — quitar la programación.

const scheduleSchema = z.object({
  scheduled_for: z.string().datetime(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = scheduleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "scheduled_for inválido (ISO datetime)" },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("drafts")
      .update({
        scheduled_for: parsed.data.scheduled_for,
        status: "approved",
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error scheduling draft:", error)
      return NextResponse.json(
        { error: "No se pudo programar" },
        { status: 500 },
      )
    }

    // Programar (o reprogramar) también en LinkedIn vía Publora
    const publora = await syncDraftToPublora(supabase, id)

    return NextResponse.json({ draft: data, publora })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("drafts")
      .update({ scheduled_for: null })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error unscheduling:", error)
      return NextResponse.json(
        { error: "No se pudo desprogramar" },
        { status: 500 },
      )
    }

    // Cancelar el post programado en Publora, si había
    const publora = await syncDraftToPublora(supabase, id)

    return NextResponse.json({ draft: data, publora })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
