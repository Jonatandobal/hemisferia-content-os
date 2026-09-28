// Mantiene sincronizados los drafts programados con Publora.
//
// - syncDraftToPublora: después de programar / desprogramar / editar un
//   draft, cancela el post que hubiera en Publora y, si corresponde, crea
//   uno nuevo con el texto, la imagen y la hora actuales.
// - reconcilePubloraPosts: revisa los posts cuya hora ya pasó y, si Publora
//   los publicó, los registra en `posts` y marca el draft como publicado.

import type { createAdminClient } from "@/lib/supabase/admin"
import { findPlaceholders } from "@/lib/post-format"
import {
  PubloraError,
  createScheduledPost,
  deletePost,
  getPost,
  isPubloraConfigured,
  linkedinUrlFromUrn,
} from "@/lib/publora"

// Margen mínimo para programar: si la hora ya pasó (o está por pasar),
// no mandamos a Publora para no publicar algo "ya mismo" sin querer.
const MIN_LEAD_MS = 5 * 60 * 1000

type SupabaseClient = ReturnType<typeof createAdminClient>

const LIVE_STATUSES: string[] = ["published", "partially_published"]

export interface PubloraSyncResult {
  state: "scheduled" | "cancelled" | "skipped" | "unchanged" | "error"
  message?: string
}

interface DraftRow {
  id: string
  content: string
  status: string
  scheduled_for: string | null
  image_url: string | null
  publora_post_group_id: string | null
  publora_status: string | null
  publora_error: string | null
}

export async function syncDraftToPublora(
  supabase: SupabaseClient,
  draftId: string,
): Promise<PubloraSyncResult> {
  if (!isPubloraConfigured()) return { state: "unchanged" }

  const { data, error } = await supabase
    .from("drafts")
    .select(
      "id, content, status, scheduled_for, image_url, publora_post_group_id, publora_status, publora_error",
    )
    .eq("id", draftId)
    .single()

  if (error || !data) return { state: "error", message: "Draft no encontrado" }
  const draft = data as DraftRow

  // Lo que ya salió no se toca.
  if (draft.status === "published" || draft.publora_status === "published") {
    return { state: "unchanged" }
  }

  const hadScheduledPost = Boolean(draft.publora_post_group_id)

  // 1) Cancelar el post anterior. Si no se puede cancelar, NO creamos otro:
  //    terminaríamos con el post publicado dos veces.
  if (draft.publora_post_group_id) {
    try {
      // Si ya salió, borrarlo en Publora lo bajaría de LinkedIn: no tocamos
      // nada y dejamos que reconcilePubloraPosts lo registre.
      const current = await getPost(draft.publora_post_group_id)
      if (LIVE_STATUSES.includes(current.status)) {
        return {
          state: "unchanged",
          message: "Este post ya se publicó en LinkedIn",
        }
      }
      await deletePost(draft.publora_post_group_id)
    } catch (err) {
      const alreadyGone = err instanceof PubloraError && err.status === 404
      if (!alreadyGone) {
        const message = `No se pudo cancelar en Publora: ${errorMessage(err)}`
        await update(supabase, draftId, { publora_error: message })
        return { state: "error", message }
      }
    }
    await update(supabase, draftId, {
      publora_post_group_id: null,
      publora_status: null,
      publora_error: null,
    })
  }

  // 2) ¿Corresponde programarlo?
  if (draft.status !== "approved" || !draft.scheduled_for) {
    if (draft.publora_error) {
      await update(supabase, draftId, { publora_error: null })
    }
    return { state: hadScheduledPost ? "cancelled" : "unchanged" }
  }

  const placeholders = findPlaceholders(draft.content)
  const skipReason =
    placeholders.length > 0
      ? `No se programó en LinkedIn: faltan datos (${placeholders.join(", ")})`
      : new Date(draft.scheduled_for).getTime() < Date.now() + MIN_LEAD_MS
        ? "No se programó en LinkedIn: la hora ya pasó"
        : null

  if (skipReason) {
    await update(supabase, draftId, { publora_error: skipReason })
    return { state: "skipped", message: skipReason }
  }

  // 3) Crear el post programado
  try {
    const postGroupId = await createScheduledPost({
      content: draft.content,
      scheduledTime: new Date(draft.scheduled_for).toISOString(),
      mediaUrls: draft.image_url?.startsWith("https://")
        ? [draft.image_url]
        : undefined,
    })
    await update(supabase, draftId, {
      publora_post_group_id: postGroupId,
      publora_status: "scheduled",
      publora_error: null,
    })
    return { state: "scheduled" }
  } catch (err) {
    const message = `Publora: ${errorMessage(err)}`
    await update(supabase, draftId, { publora_error: message })
    return { state: "error", message }
  }
}

export async function reconcilePubloraPosts(supabase: SupabaseClient) {
  if (!isPubloraConfigured()) return

  const { data: due } = await supabase
    .from("drafts")
    .select("id, content, scheduled_for, publora_post_group_id")
    .eq("publora_status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .limit(20)

  for (const draft of due ?? []) {
    try {
      const post = await getPost(draft.publora_post_group_id)

      if (LIVE_STATUSES.includes(post.status)) {
        // "Reclamamos" el draft con un update condicional para no registrar
        // el mismo post dos veces si dos requests reconcilian a la vez.
        const { data: claimed } = await supabase
          .from("drafts")
          .update({ status: "published", publora_status: "published" })
          .eq("id", draft.id)
          .eq("publora_status", "scheduled")
          .select("id")
        if (!claimed?.length) continue

        const urn = post.posts?.find((p) => p.postedId)?.postedId
        await supabase.from("posts").insert({
          draft_id: draft.id,
          content: draft.content,
          linkedin_url: linkedinUrlFromUrn(urn),
          published_at: draft.scheduled_for,
        })
      } else if (post.status === "failed") {
        const reason =
          post.posts?.find((p) => p.error)?.error ?? "Publora no pudo publicar"
        await update(supabase, draft.id, {
          publora_status: "failed",
          publora_error: `Publora: ${reason}`,
        })
      }
    } catch (err) {
      console.error(`Publora reconcile ${draft.id}:`, err)
    }
  }
}

async function update(
  supabase: SupabaseClient,
  draftId: string,
  fields: Record<string, unknown>,
) {
  await supabase.from("drafts").update(fields).eq("id", draftId)
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "error inesperado"
}
