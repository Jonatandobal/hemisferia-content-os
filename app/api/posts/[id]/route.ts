import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

// PATCH /api/posts/[id] — actualizar métricas de un post.
const updateSchema = z.object({
  impressions: z.number().int().min(0).optional(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  dms_generated: z.number().int().min(0).optional(),
  linkedin_url: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("posts")
      .update({
        ...parsed.data,
        metrics_updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating post:", error)
      return NextResponse.json(
        { error: "No se pudo actualizar" },
        { status: 500 },
      )
    }

    return NextResponse.json({ post: data })
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
    const { error } = await supabase.from("posts").delete().eq("id", id)
    if (error) {
      return NextResponse.json(
        { error: "No se pudo borrar" },
        { status: 500 },
      )
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
