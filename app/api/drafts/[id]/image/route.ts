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
    let imageRes
    try {
      imageRes = await openaiNative.images.generate({
        model: "dall-e-3",
        prompt: cleanPrompt,
        n: 1,
        size: "1792x1024",
        quality: "standard", // "hd" cuesta el doble
        style: "natural", // "vivid" es más saturado
      })
    } catch (openaiErr) {
      // Capturar y propagar el mensaje real de OpenAI (billing, rate limit, etc.)
      console.error("DALL-E error:", openaiErr)
      const message =
        openaiErr instanceof Error
          ? `OpenAI: ${openaiErr.message}`
          : "OpenAI rechazó la generación"
      return NextResponse.json(
        { error: message, prompt: cleanPrompt },
        { status: 502 },
      )
    }

    const imageUrl = imageRes.data?.[0]?.url
    if (!imageUrl) {
      return NextResponse.json(
        { error: "DALL-E no devolvió URL", prompt: cleanPrompt },
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
