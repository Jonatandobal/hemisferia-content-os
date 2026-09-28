// Migra imágenes guardadas como data URL (base64) en drafts.image_url a
// Supabase Storage y reemplaza la columna por la URL pública.
//
// Uso (una sola vez):
//   node --env-file=.env.local scripts/migrate-inline-images.mjs
//
// Es idempotente: solo toca filas cuyo image_url empieza con "data:".

import { createClient } from "@supabase/supabase-js"

const BUCKET = "draft-images"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const { data: drafts, error } = await supabase
  .from("drafts")
  .select("id, image_url")
  .like("image_url", "data:%")

if (error) {
  console.error("Error leyendo drafts:", error.message)
  process.exit(1)
}

console.log(`${drafts.length} imagen(es) inline para migrar`)

for (const draft of drafts) {
  const match = draft.image_url.match(/^data:(image\/[\w+.-]+);base64,(.+)$/)
  if (!match) {
    console.warn(`- ${draft.id}: data URL no reconocida, la salteo`)
    continue
  }
  const [, contentType, b64] = match
  const ext = contentType.split("/")[1].replace("jpeg", "jpg")
  const path = `${draft.id}/ai-migrated-${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(b64, "base64"), { contentType, upsert: false })
  if (uploadErr) {
    console.error(`- ${draft.id}: no se pudo subir (${uploadErr.message})`)
    continue
  }

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data
    .publicUrl
  const { error: updateErr } = await supabase
    .from("drafts")
    .update({ image_url: publicUrl })
    .eq("id", draft.id)
  if (updateErr) {
    console.error(`- ${draft.id}: subida OK pero no se actualizó el draft (${updateErr.message})`)
    continue
  }

  console.log(`- ${draft.id}: migrada → ${publicUrl}`)
}
