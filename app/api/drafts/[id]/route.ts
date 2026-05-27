import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

// PATCH /api/drafts/[id] — actualizar status / contenido de un draft
const updateSchema = z.object({
  status: z.enum(["draft", "approved", "rejected", "published"]).optional(),
  content: z.string().min(10).optional(),
  scheduled_for: z.string().datetime().nullable().optional(),
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
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("drafts")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating draft:", error)
      return NextResponse.json(
        { error: "No se pudo actualizar" },
        { status: 500 },
      )
    }

    return NextResponse.json({ draft: data })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
