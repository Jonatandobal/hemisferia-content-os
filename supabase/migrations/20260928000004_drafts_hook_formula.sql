-- ============================================
-- Guardar qué fórmula de gancho usó cada draft
-- ============================================
-- Sirve para verificar que las 3 variantes de un lote no repitan fórmula
-- y, con el tiempo, para ver qué formulas rinden mejor en analytics.
-- No es un enum FK a propósito: la lista de fórmulas vive en código
-- (lib/hook-formulas.ts) y puede crecer sin migración.

alter table public.drafts
  add column if not exists hook_formula text;
