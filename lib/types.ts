// Tipos del dominio de Hemisferia Content OS

export type Pillar = "caso" | "contrarian" | "educativo" | "founder"

export type IdeaStatus = "pending" | "generated" | "archived"
export type DraftStatus = "draft" | "approved" | "rejected" | "published"
export type Source = "web" | "manual" | "shortcut"

export interface Idea {
  id: string
  raw_text: string
  source: Source
  pillar: Pillar | null
  status: IdeaStatus
  created_at: string
  story_id?: string | null
}

export interface Story {
  id: string
  title: string
  situation: string
  result: string | null
  client_type: string | null
  pillar: Pillar | null
  times_used: number
  created_at: string
}

export interface Draft {
  id: string
  idea_id: string
  variant: number
  content: string
  status: DraftStatus
  scheduled_for: string | null
  created_at: string
  template?: Pillar | null
  hook_formula?: string | null
  image_url?: string | null
  image_prompt?: string | null
  image_generated_at?: string | null
  publora_post_group_id?: string | null
  publora_status?: "scheduled" | "published" | "failed" | null
  publora_error?: string | null
}

export interface Post {
  id: string
  draft_id: string | null
  content: string
  linkedin_url: string | null
  published_at: string
  impressions: number
  likes: number
  comments: number
  shares: number
  dms_generated: number
  metrics_updated_at: string | null
}

export interface AIReport {
  id: string
  period_start: string
  period_end: string
  insights: Record<string, unknown>
  new_ideas_suggested: Record<string, unknown>
  created_at: string
}

export const PILLAR_LABELS: Record<Pillar, string> = {
  caso: "Caso real",
  contrarian: "Contrarian",
  educativo: "Educativo",
  founder: "Founder",
}

export const PILLAR_SHORT_LABELS: Record<Pillar, string> = {
  caso: "Caso",
  contrarian: "Contra",
  educativo: "Educ",
  founder: "Founder",
}

// Los drafts previos a la columna `template` no la tienen: se asumía
// por posición (1 = caso, 2 = contrarian, 3 = educativo).
const LEGACY_VARIANT_TEMPLATES: Pillar[] = ["caso", "contrarian", "educativo"]

export function draftTemplate(
  draft: Pick<Draft, "template" | "variant">,
): Pillar | null {
  return draft.template ?? LEGACY_VARIANT_TEMPLATES[draft.variant - 1] ?? null
}

// Color de identidad de cada pilar (tokens --pillar-* en globals.css).
// Siempre se muestra junto a la etiqueta de texto, nunca solo.
export const PILLAR_DOT: Record<Pillar, string> = {
  caso: "bg-pillar-caso",
  contrarian: "bg-pillar-contrarian",
  educativo: "bg-pillar-educativo",
  founder: "bg-pillar-founder",
}

export const PILLAR_COLOR_VAR: Record<Pillar, string> = {
  caso: "var(--pillar-caso)",
  contrarian: "var(--pillar-contrarian)",
  educativo: "var(--pillar-educativo)",
  founder: "var(--pillar-founder)",
}

export const PILLAR_DESCRIPTIONS: Record<Pillar, string> = {
  caso: "Algo que pasó con un cliente",
  contrarian: "Una opinión que va contra la corriente",
  educativo: "Explicar un concepto en criollo",
  founder: "Detrás de escena de Hemisferia",
}

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  pending: "Sin drafts",
  generated: "Con drafts",
  archived: "Archivada",
}

export const DRAFT_STATUS_LABELS: Record<DraftStatus, string> = {
  draft: "Por revisar",
  approved: "Aprobado",
  rejected: "Descartado",
  published: "Publicado",
}
