-- ============================================
-- Agregar columnas para imágenes generadas por IA en drafts
-- ============================================

alter table public.drafts
  add column if not exists image_url text,
  add column if not exists image_prompt text,
  add column if not exists image_generated_at timestamptz;

create index if not exists idx_drafts_has_image
  on public.drafts (image_generated_at)
  where image_url is not null;
