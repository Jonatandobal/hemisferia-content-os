import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateText, Output } from "ai"
import { openai } from "@ai-sdk/openai"
import { createAdminClient } from "@/lib/supabase/admin"
import { CURRENT_SYSTEM_PROMPT } from "@/lib/prompts"

// Schema que Claude/GPT respeta para devolver structured output.
const variantsSchema = z.object({
  variants: z
    .array(
      z.object({
        template: z.enum(["caso", "contrarian", "educativo"]),
        hook: z.string().describe("Primera línea brutal, máximo 8 palabras"),
        body: z.string().describe("Cuerpo del post, 150-400 palabras"),
        cta: z.string().describe("Cierre con CTA suave"),
        full_post: z
          .string()
          .describe(
            "Texto completo del post listo para copiar y pegar en LinkedIn",
          ),
      }),
    )
    .length(3),
})

const requestSchema = z.object({
  idea_id: z.string().uuid(),
})

// POST /api/generate — generar 3 drafts a partir de una idea.
// Body: { idea_id: uuid }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "idea_id inválido" },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // 1) Traer la idea
    const { data: idea, error: ideaErr } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", parsed.data.idea_id)
      .single()

    if (ideaErr || !idea) {
      return NextResponse.json(
        { error: "Idea no encontrada" },
        { status: 404 },
      )
    }

    // 2) Construir prompt con la idea + pilar (si lo tiene)
    const userPrompt = [
      `IDEA CRUDA:`,
      idea.raw_text,
      ``,
      idea.pillar
        ? `PILAR PRIORIZADO: ${idea.pillar} (al menos UNA de las 3 variantes debe usar este pilar)`
        : `(Sin pilar definido — generá variedad)`,
      ``,
      `Generá 3 variantes de post para LinkedIn siguiendo las reglas del system prompt.`,
    ].join("\n")

    // 3) Llamar a OpenAI con structured output (AI SDK v6 API)
    const { experimental_output: object } = await generateText({
      model: openai("gpt-4o"),
      system: CURRENT_SYSTEM_PROMPT,
      prompt: userPrompt,
      experimental_output: Output.object({ schema: variantsSchema }),
      temperature: 0.8,
    })

    // 4) Guardar los 3 drafts en DB
    const draftsToInsert = object.variants.map((variant, index) => ({
      idea_id: idea.id,
      variant: index + 1,
      content: variant.full_post,
      status: "draft" as const,
    }))

    const { data: insertedDrafts, error: insertErr } = await supabase
      .from("drafts")
      .insert(draftsToInsert)
      .select()

    if (insertErr) {
      console.error("Error inserting drafts:", insertErr)
      return NextResponse.json(
        { error: "No se pudieron guardar los drafts" },
        { status: 500 },
      )
    }

    // 5) Marcar la idea como generada
    await supabase
      .from("ideas")
      .update({ status: "generated" })
      .eq("id", idea.id)

    return NextResponse.json({
      drafts: insertedDrafts,
      variants: object.variants,
    })
  } catch (err) {
    console.error("Error generating drafts:", err)
    const message =
      err instanceof Error ? err.message : "Error inesperado al generar"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
