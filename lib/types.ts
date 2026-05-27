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
}

export interface Draft {
  id: string
  idea_id: string
  variant: number
  content: string
  status: DraftStatus
  scheduled_for: string | null
  created_at: string
  image_url?: string | null
  image_prompt?: string | null
  image_generated_at?: string | null
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

export const PILLAR_COLORS: Record<Pillar, string> = {
  caso: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  contrarian: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  educativo: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  founder: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}
