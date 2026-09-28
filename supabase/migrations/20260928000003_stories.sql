-- ============================================
-- STORIES — Banco de historias reales reutilizables
-- ============================================
-- Un caso real (qué pasó, resultado, tipo de cliente) capturado una vez
-- y reusado en múltiples ideas/posts sin volver a escribirlo. Resuelve el
-- problema de fondo del prompt V1: la IA inventaba datos porque la idea
-- cruda no traía hechos verificables.

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  situation text not null,       -- qué pasó / el problema / la escena
  result text,                   -- dato o resultado real (número, plazo)
  client_type text,              -- rubro / tamaño del cliente, sin nombre propio
  pillar text
    check (pillar in ('caso', 'contrarian', 'educativo', 'founder')),
  times_used int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_stories_created_at on public.stories(created_at desc);

-- Una idea puede haberse originado en una historia guardada. Sirve para
-- contar uso y para pasarle los hechos completos al generador aunque el
-- raw_text de la idea haya quedado resumido.
alter table public.ideas
  add column if not exists story_id uuid references public.stories(id) on delete set null;

alter table public.stories enable row level security;
-- Policies vacías: mismo criterio que el resto del schema — todo pasa por
-- service_role desde el backend (ver initial_schema.sql).
