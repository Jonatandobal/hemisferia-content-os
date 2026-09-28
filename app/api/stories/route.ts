import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

// POST /api/stories — guardar un caso real para reusar en futuras ideas.
const createSchema = z.object({
  title: z.string().min(3).max(200),
  situation: z.string().min(3).max(1000),
  result: z.string().max(500).optional(),
  client_type: z.string().max(200).optional(),
  pillar: z.enum(["caso", "contrarian", "educativo", "founder"]).nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("stories")
      .insert({
        title: parsed.data.title.trim(),
        situation: parsed.data.situation.trim(),
        result: parsed.data.result?.trim() || null,
        client_type: parsed.data.client_type?.trim() || null,
        pillar: parsed.data.pillar ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating story:", error)
      return NextResponse.json({ error: "No se pudo guardar la historia" }, { status: 500 })
    }

    return NextResponse.json({ story: data }, { status: 201 })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}

// GET /api/stories — listar el banco de historias.
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) {
      console.error("Error fetching stories:", error)
      return NextResponse.json({ error: "No se pudieron cargar las historias" }, { status: 500 })
    }

    return NextResponse.json({ stories: data ?? [] })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
