-- ============================================
-- Guardar qué plantilla (formato) usó cada draft
-- ============================================
-- Antes se asumía por posición (variant 1 = caso, 2 = contrarian,
-- 3 = educativo), pero el modelo no garantiza ese orden. Guardarlo permite
-- etiquetar bien cada draft y comparar formatos en analytics.
-- Nullable: los drafts viejos quedan sin template y usan el fallback.

alter table public.drafts
  add column if not exists template text
    check (template in ('caso', 'contrarian', 'educativo', 'founder'));
