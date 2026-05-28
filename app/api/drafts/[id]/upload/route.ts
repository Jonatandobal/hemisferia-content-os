import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const maxDuration = 30

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const BUCKET = "draft-images"

// POST /api/drafts/[id]/upload — subir foto desde la PC.
// FormData con campo "file".
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Archivo muy grande (máx 5MB)" },
        { status: 400 },
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo no permitido (${file.type}). Usá PNG, JPG o WebP.` },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Verificar que el draft existe
    const { data: draft, error: draftErr } = await supabase
      .from("drafts")
      .select("id, image_url")
      .eq("id", id)
      .single()

    if (draftErr || !draft) {
      return NextResponse.json(
        { error: "Draft no encontrado" },
        { status: 404 },
      )
    }

    // Nombre único en el bucket
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png"
    const path = `${id}/${Date.now()}.${ext}`

    // Subir al bucket
    const buffer = await file.arrayBuffer()
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadErr) {
      console.error("Upload error:", uploadErr)
      return NextResponse.json(
        { error: `No se pudo subir: ${uploadErr.message}` },
        { status: 500 },
      )
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path)

    const publicUrl = publicUrlData.publicUrl

    // Actualizar el draft
    const { error: updateErr } = await supabase
      .from("drafts")
      .update({
        image_url: publicUrl,
        image_prompt: `[Subida manual] ${file.name}`,
        image_generated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateErr) {
      console.error("Update error:", updateErr)
      return NextResponse.json(
        { error: "No se pudo guardar la URL en el draft" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      image_url: publicUrl,
      path,
    })
  } catch (err) {
    console.error("Upload error:", err)
    const message =
      err instanceof Error ? err.message : "Error inesperado"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
