import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// DELETE /api/stories/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { error } = await supabase.from("stories").delete().eq("id", id)
    if (error) {
      return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
