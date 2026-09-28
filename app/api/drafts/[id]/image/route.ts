import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import OpenAI from "openai"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncDraftToPublora } from "@/lib/publora-sync"
import { IMAGE_BRIEF_SYSTEM_PROMPT } from "@/lib/image-prompts"

export const maxDuration = 60

const BUCKET = "draft-images"

// Cliente OpenAI nativo para DALL-E (el AI SDK no expone images.generate aún).
const openaiNative = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// POST /api/drafts/[id]/image — genera una imagen acompañante.
// Flujo:
//   1. Lee el draft
//   2. GPT-4o convierte el post en un prompt visual
//   3. gpt-image-1 / DALL-E genera la imagen
//   4. La sube a Supabase Storage y guarda la URL pública en el draft
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // 1) Traer el draft
    const { data: draft, error: draftErr } = await supabase
      .from("drafts")
      .select("*")
      .eq("id", id)
      .single()

    if (draftErr || !draft) {
      return NextResponse.json(
        { error: "Draft no encontrado" },
        { status: 404 },
      )
    }

    // 2) Generar prompt visual con GPT-4o
    const { text: imagePrompt } = await generateText({
      model: openai("gpt-4o"),
      system: IMAGE_BRIEF_SYSTEM_PROMPT,
      prompt: draft.content,
      temperature: 0.7,
    })

    const cleanPrompt = imagePrompt.trim()
    if (!cleanPrompt) {
      return NextResponse.json(
        { error: "No se pudo generar el brief visual" },
        { status: 500 },
      )
    }

    // 3) Generar la imagen en formato apaisado (lo que LinkedIn renderiza bien
    //    en feed).
    // Intentamos en orden: gpt-image-1 (nuevo) → dall-e-3 (legacy) → dall-e-2.
    // Distintas cuentas OpenAI tienen acceso a modelos distintos.
    const models = ["gpt-image-1", "dall-e-3", "dall-e-2"] as const
    type Size = "1024x1024" | "1024x1536" | "1536x1024" | "1792x1024"
    const sizeByModel: Record<(typeof models)[number], Size> = {
      "gpt-image-1": "1536x1024", // 3:2, cercano a 16:9 (LinkedIn rinde bien)
      "dall-e-3": "1792x1024",
      "dall-e-2": "1024x1024",
    }

    let imageRes: Awaited<
      ReturnType<typeof openaiNative.images.generate>
    > | null = null
    let lastErr: unknown = null
    let modelUsed: string | null = null

    for (const m of models) {
      try {
        imageRes = await openaiNative.images.generate({
          model: m,
          prompt: cleanPrompt,
          n: 1,
          size: sizeByModel[m],
        })
        modelUsed = m
        break
      } catch (openaiErr) {
        console.warn(`Image gen failed with ${m}:`, openaiErr)
        lastErr = openaiErr
        // Si es error de modelo "does not exist" o "not available", probamos el siguiente.
        // Para otros errores (billing, rate limit) cortamos acá.
        const msg = openaiErr instanceof Error ? openaiErr.message : ""
        const isModelAccessIssue =
          msg.includes("does not exist") ||
          msg.includes("not available") ||
          msg.includes("not have access") ||
          msg.includes("Unknown model")
        if (!isModelAccessIssue) break
      }
    }

    if (!imageRes) {
      const message =
        lastErr instanceof Error
          ? `OpenAI: ${lastErr.message}`
          : "Ningún modelo de imagen disponible en tu cuenta"
      return NextResponse.json(
        { error: message, prompt: cleanPrompt },
        { status: 502 },
      )
    }

    // gpt-image-1 devuelve b64_json, dall-e-3/2 devuelven una URL que vence
    // en ~60 min. En ambos casos bajamos los bytes y los subimos a Storage.
    const first = imageRes.data?.[0]
    let bytes: Uint8Array | null = null
    if (first?.b64_json) {
      bytes = Buffer.from(first.b64_json, "base64")
    } else if (first?.url) {
      const download = await fetch(first.url)
      if (download.ok) bytes = new Uint8Array(await download.arrayBuffer())
    }

    if (!bytes) {
      return NextResponse.json(
        {
          error: "El modelo no devolvió imagen",
          prompt: cleanPrompt,
          modelUsed,
        },
        { status: 500 },
      )
    }

    // 4) Subir a Supabase Storage (mismo bucket que las fotos subidas a mano)
    const path = `${id}/ai-${Date.now()}.png`
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "image/png", upsert: false })

    if (uploadErr) {
      console.error("Error uploading generated image:", uploadErr)
      return NextResponse.json(
        { error: `No se pudo guardar la imagen: ${uploadErr.message}` },
        { status: 500 },
      )
    }

    const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path)
      .data.publicUrl

    // 5) Guardar la URL pública en el draft
    const { error: updateErr } = await supabase
      .from("drafts")
      .update({
        image_url: imageUrl,
        image_prompt: cleanPrompt,
        image_generated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateErr) {
      console.error("Error saving image:", updateErr)
      return NextResponse.json(
        { error: "No se pudo guardar la imagen" },
        { status: 500 },
      )
    }

    // Si el draft ya estaba programado, reprogramarlo con la imagen nueva
    const publora = await syncDraftToPublora(supabase, id)

    return NextResponse.json({
      image_url: imageUrl,
      image_prompt: cleanPrompt,
      publora,
    })
  } catch (err) {
    console.error("Generate image error:", err)
    const message =
      err instanceof Error ? err.message : "Error inesperado"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
