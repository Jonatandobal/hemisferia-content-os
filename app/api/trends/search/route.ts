import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateText, Output } from "ai"
import { openai } from "@ai-sdk/openai"
import { createAdminClient } from "@/lib/supabase/admin"
import { getRelatedQueries, getRecentNews } from "@/lib/trends"

// Vercel functions: subimos timeout porque combinamos varias APIs externas.
export const maxDuration = 60

const requestSchema = z.object({
  query: z.string().min(3).max(200).default("IA para PyMEs Argentina"),
  region: z.string().default("AR"),
})

// Schema del output que GPT-4o devuelve
const trendsSchema = z.object({
  summary: z.string().describe("Síntesis general de qué se está hablando"),
  trends: z
    .array(
      z.object({
        title: z.string().describe("Título corto de la tendencia (5-10 palabras)"),
        description: z
          .string()
          .describe("Por qué es relevante hoy (1-2 oraciones)"),
        angle: z
          .string()
          .describe(
            "Ángulo concreto para escribir un post de LinkedIn sobre esto",
          ),
        source_url: z
          .string()
          .url()
          .nullable()
          .describe("Link a fuente real si hay una, sino null"),
        score: z
          .number()
          .int()
          .min(0)
          .max(100)
          .describe("Qué tan relevante es para Hemisferia (0-100)"),
      }),
    )
    .min(3)
    .max(8),
})

const SYSTEM_PROMPT = `
Sos un analista de tendencias para Hemisferia, consultora argentina de
automatización e IA para PyMEs y e-commerce.

Te paso 2 fuentes de datos:
1. Google Trends Argentina — qué búsquedas están subiendo
2. Google News últimos días — qué se publica sobre el tema

Tu trabajo:
- Identificar 5-8 tendencias REALES y accionables para Hemisferia.
- Para cada una, sugerir un ÁNGULO concreto para post de LinkedIn.
- El ángulo debe ser específico y "robar la atención" — no genérico.
- Ignorá hype puro. Buscá lo que un dueño de PyME argentina puede APLICAR.
- Si una tendencia tiene una fuente clara (link de noticia), incluí source_url.
- Score: qué tan relevante es para Hemisferia. 80+ = imperdible. 50- = secundaria.

Ejemplo de ángulo BUENO:
"WhatsApp Business API bajó precios este mes. Cómo aprovecharlo para
automatizar atención al cliente sin pagar plataformas caras."

Ejemplo de ángulo MALO:
"La IA va a transformar las empresas argentinas en 2026."

DEVOLVÉ EN ESPAÑOL ARGENTINO.
`.trim()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "query inválida" },
        { status: 400 },
      )
    }

    const { query, region } = parsed.data

    // 1) Traer Google Trends + Google News en paralelo
    const [related, news] = await Promise.all([
      getRelatedQueries(query, region),
      getRecentNews(query),
    ])

    // 2) Armar contexto para GPT-4o
    const relatedTop = (
      related?.default?.rankedList?.[0]?.rankedKeyword ?? []
    )
      .slice(0, 10)
      .map((k: { query: string; value?: number }) => ({
        query: k.query,
        value: k.value,
      }))

    const userPrompt = [
      `QUERY BASE: "${query}"`,
      `REGIÓN: ${region}`,
      ``,
      `=== GOOGLE TRENDS — Queries relacionadas ===`,
      relatedTop.length > 0
        ? JSON.stringify(relatedTop, null, 2)
        : "(sin datos)",
      ``,
      `=== GOOGLE NEWS — Últimos artículos ===`,
      news.length > 0 ? JSON.stringify(news, null, 2) : "(sin resultados)",
      ``,
      `Analizá esto y devolvé 5-8 tendencias accionables para Hemisferia.`,
    ].join("\n")

    // 3) GPT-4o procesa todo y devuelve tendencias estructuradas
    const { experimental_output: output } = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      experimental_output: Output.object({ schema: trendsSchema }),
      temperature: 0.6,
    })

    // 4) Guardar todo en DB
    const supabase = createAdminClient()
    const { data: search, error: searchErr } = await supabase
      .from("trend_searches")
      .insert({
        query,
        region,
        raw_google_trends: relatedTop as unknown as object,
        raw_serpapi: news as unknown as object,
        ai_summary: output.summary,
      })
      .select()
      .single()

    if (searchErr || !search) {
      console.error("Error inserting search:", searchErr)
      return NextResponse.json(
        { error: "No se pudo guardar la búsqueda" },
        { status: 500 },
      )
    }

    const trendsToInsert = output.trends.map((t) => ({
      search_id: search.id,
      title: t.title,
      description: t.description,
      angle: t.angle,
      source_url: t.source_url,
      score: t.score,
    }))

    const { data: trends, error: trendsErr } = await supabase
      .from("trends")
      .insert(trendsToInsert)
      .select()

    if (trendsErr) {
      console.error("Error inserting trends:", trendsErr)
      return NextResponse.json(
        { error: "No se pudieron guardar las tendencias" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      search,
      trends,
      summary: output.summary,
    })
  } catch (err) {
    console.error("Trends search error:", err)
    const message =
      err instanceof Error ? err.message : "Error inesperado"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
