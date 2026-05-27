import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST /api/trends/[id]/convert
// Convierte una tendencia en una idea del inbox.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: trend, error: fetchErr } = await supabase
      .from("trends")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchErr || !trend) {
      return NextResponse.json(
        { error: "Tendencia no encontrada" },
        { status: 404 },
      )
    }

    if (trend.converted_to_idea_id) {
      return NextResponse.json(
        { error: "Esta tendencia ya fue convertida en idea" },
        { status: 400 },
      )
    }

    // Armamos el raw_text combinando título + ángulo
    const rawText = `[Tendencia] ${trend.title}\n\n${trend.angle}${
      trend.source_url ? `\n\nFuente: ${trend.source_url}` : ""
    }`

    const { data: idea, error: insertErr } = await supabase
      .from("ideas")
      .insert({
        raw_text: rawText,
        source: "web",
        pillar: null,
        status: "pending",
      })
      .select()
      .single()

    if (insertErr || !idea) {
      console.error("Error creating idea from trend:", insertErr)
      return NextResponse.json(
        { error: "No se pudo crear la idea" },
        { status: 500 },
      )
    }

    // Linkeamos la tendencia con la idea creada
    await supabase
      .from("trends")
      .update({ converted_to_idea_id: idea.id })
      .eq("id", trend.id)

    return NextResponse.json({ idea })
  } catch (err) {
    console.error("Convert trend error:", err)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
