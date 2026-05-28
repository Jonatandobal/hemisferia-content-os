import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

// POST /api/posts — registrar que un draft fue publicado.
const createSchema = z.object({
  draft_id: z.string().uuid(),
  linkedin_url: z.string().optional(),
  published_at: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Traer contenido del draft
    const { data: draft, error: draftErr } = await supabase
      .from("drafts")
      .select("*")
      .eq("id", parsed.data.draft_id)
      .single()

    if (draftErr || !draft) {
      return NextResponse.json(
        { error: "Draft no encontrado" },
        { status: 404 },
      )
    }

    // Crear post
    const publishedAt =
      parsed.data.published_at ?? new Date().toISOString()
    const { data: post, error: postErr } = await supabase
      .from("posts")
      .insert({
        draft_id: draft.id,
        content: draft.content,
        linkedin_url: parsed.data.linkedin_url || null,
        published_at: publishedAt,
      })
      .select()
      .single()

    if (postErr) {
      console.error("Error creating post:", postErr)
      return NextResponse.json(
        { error: "No se pudo registrar el post" },
        { status: 500 },
      )
    }

    // Marcar draft como published
    await supabase
      .from("drafts")
      .update({ status: "published" })
      .eq("id", draft.id)

    return NextResponse.json({ post })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}

// GET /api/posts — listar posts publicados con métricas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200)

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("posts")
      .select("*, draft:drafts(*, idea:ideas(*))")
      .order("published_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json(
        { error: "No se pudieron cargar los posts" },
        { status: 500 },
      )
    }

    return NextResponse.json({ posts: data ?? [] })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
