-- ============================================
-- Publicación programada vía Publora
-- ============================================
-- publora_post_group_id: id del post programado en Publora (para cancelarlo
--                        o consultar si ya se publicó).
-- publora_status:        scheduled | published | failed (null = no está en Publora)
-- publora_error:         último motivo por el que no se pudo programar/publicar.

alter table public.drafts
  add column if not exists publora_post_group_id text,
  add column if not exists publora_status text
    check (publora_status in ('scheduled', 'published', 'failed')),
  add column if not exists publora_error text;

create index if not exists idx_drafts_publora_scheduled
  on public.drafts (scheduled_for)
  where publora_status = 'scheduled';
