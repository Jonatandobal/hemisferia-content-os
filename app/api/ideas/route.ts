import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

// POST /api/ideas — crear nueva idea
const createSchema = z.object({
  raw_text: z.string().min(3, "Mínimo 3 caracteres").max(2000),
  pillar: z.enum(["caso", "contrarian", "educativo", "founder"]).nullable(),
  source: z.enum(["web", "manual", "shortcut"]).default("web"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("ideas")
      .insert({
        raw_text: parsed.data.raw_text.trim(),
        pillar: parsed.data.pillar,
        source: parsed.data.source,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating idea:", error)
      return NextResponse.json(
        { error: "No se pudo guardar la idea" },
        { status: 500 },
      )
    }

    return NextResponse.json({ idea: data }, { status: 201 })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      { error: "Error inesperado" },
      { status: 500 },
    )
  }
}

// GET /api/ideas — listar ideas (con filtros opcionales)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const pillar = searchParams.get("pillar")
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200)

    const supabase = createAdminClient()
    let query = supabase
      .from("ideas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status) query = query.eq("status", status)
    if (pillar) query = query.eq("pillar", pillar)

    const { data, error } = await query

    if (error) {
      console.error("Error fetching ideas:", error)
      return NextResponse.json(
        { error: "No se pudieron cargar las ideas" },
        { status: 500 },
      )
    }

    return NextResponse.json({ ideas: data ?? [] })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      { error: "Error inesperado" },
      { status: 500 },
    )
  }
}
