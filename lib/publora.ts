// Cliente mínimo de la API de Publora (publicación programada en LinkedIn).
// SOLO server-side: usa PUBLORA_API_KEY.
//
// Env vars:
//   PUBLORA_API_KEY                — clave de la API (sk_...)
//   PUBLORA_LINKEDIN_PLATFORM_ID   — id de la conexión de LinkedIn
//                                    (ej: linkedin-ABC123). Se ve en /settings.

const BASE_URL = "https://api.publora.com/api/v1"
const TIMEOUT_MS = 15_000

export type PubloraStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "partially_published"
  | "failed"

export class PubloraError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = "PubloraError"
  }
}

export function isPubloraConfigured() {
  return Boolean(
    process.env.PUBLORA_API_KEY && process.env.PUBLORA_LINKEDIN_PLATFORM_ID,
  )
}

async function request<T>(method: string, path: string, body?: unknown) {
  const apiKey = process.env.PUBLORA_API_KEY
  if (!apiKey) throw new PubloraError("Falta PUBLORA_API_KEY")

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "x-publora-key": apiKey,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  })

  const text = await res.text()
  const data = text ? safeJson(text) : null
  if (!res.ok) {
    const detail =
      (data as { error?: string; message?: string } | null)?.error ??
      (data as { message?: string } | null)?.message ??
      text.slice(0, 200)
    throw new PubloraError(`Publora ${res.status}: ${detail}`, res.status)
  }
  return data as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// POST /create-post — programa un post en LinkedIn.
// Devuelve el id del "post group" de Publora.
export async function createScheduledPost(input: {
  content: string
  scheduledTime: string // ISO 8601 UTC
  mediaUrls?: string[]
}): Promise<string> {
  const data = await request<Record<string, unknown>>("POST", "/create-post", {
    content: input.content,
    platforms: [process.env.PUBLORA_LINKEDIN_PLATFORM_ID],
    scheduledTime: input.scheduledTime,
    ...(input.mediaUrls?.length ? { mediaUrls: input.mediaUrls } : {}),
  })

  const group = (data?.postGroup ?? data) as Record<string, unknown> | null
  const id = data?.postGroupId ?? group?.postGroupId ?? group?.id ?? group?._id
  if (typeof id !== "string" || !id) {
    throw new PubloraError("Publora no devolvió el id del post")
  }
  return id
}

export interface PubloraPost {
  status: PubloraStatus
  // Posts hijos por plataforma. postedId es el URN de LinkedIn
  // (urn:li:share:...) una vez publicado.
  posts?: { status?: string; postedId?: string | null; error?: string | null }[]
}

// GET /get-post/{id}
export async function getPost(postGroupId: string): Promise<PubloraPost> {
  const data = await request<Record<string, unknown>>(
    "GET",
    `/get-post/${encodeURIComponent(postGroupId)}`,
  )
  return ((data?.postGroup ?? data) as unknown) as PubloraPost
}

// DELETE /delete-post/{id} — cancela un post programado.
export async function deletePost(postGroupId: string) {
  await request("DELETE", `/delete-post/${encodeURIComponent(postGroupId)}`)
}

export interface PubloraConnection {
  platformId: string
  platform?: string
  username?: string
  displayName?: string
}

// GET /platform-connections — cuentas conectadas (para encontrar el id).
export async function listConnections(): Promise<PubloraConnection[]> {
  const data = await request<unknown>("GET", "/platform-connections")
  const list = Array.isArray(data)
    ? data
    : ((data as { connections?: unknown[]; data?: unknown[] } | null)
        ?.connections ??
      (data as { data?: unknown[] } | null)?.data ??
      [])
  return list as PubloraConnection[]
}

// URN de LinkedIn → link público al post.
export function linkedinUrlFromUrn(urn: string | null | undefined) {
  return urn ? `https://www.linkedin.com/feed/update/${urn}/` : null
}
