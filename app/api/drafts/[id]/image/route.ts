import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import OpenAI from "openai"
import { createAdminClient } from "@/lib/supabase/admin"
import { IMAGE_BRIEF_SYSTEM_PROMPT } from "@/lib/image-prompts"

export const maxDuration = 60

// Cliente OpenAI nativo para DALL-E (el AI SDK no expone images.generate aún).
const openaiNative = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// POST /api/drafts/[id]/image — genera una imagen acompañante.
// Flujo:
//   1. Lee el draft
//   2. GPT-4o convierte el post en un prompt visual
//   3. DALL-E 3 genera la imagen
//   4. Guarda la URL en el draft
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

    // 3) DALL-E 3 genera la imagen (1792x1024 = aspect ratio cercano a 16:9 que
    //    es lo que LinkedIn renderiza bien en feed).
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

    // gpt-image-1 devuelve b64_json por default, dall-e-3 devuelve url
    const first = imageRes.data?.[0]
    let imageUrl: string | null = first?.url ?? null
    if (!imageUrl && first?.b64_json) {
      // Convertir base64 a data URL para guardar
      imageUrl = `data:image/png;base64,${first.b64_json}`
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: "El modelo no devolvió imagen",
          prompt: cleanPrompt,
          modelUsed,
        },
        { status: 500 },
      )
    }

    // 4) Guardar en el draft
    // ⚠️ NOTA: La URL de DALL-E vence en ~60 min. Para uso real deberíamos
    // descargar la imagen y subirla a Supabase Storage. Por ahora la guardamos
    // así para validar el flujo. Más adelante migramos a Storage.
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

    return NextResponse.json({
      image_url: imageUrl,
      image_prompt: cleanPrompt,
    })
  } catch (err) {
    console.error("Generate image error:", err)
    const message =
      err instanceof Error ? err.message : "Error inesperado"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
