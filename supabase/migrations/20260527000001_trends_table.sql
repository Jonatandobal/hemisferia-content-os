-- ============================================
-- TRENDS - Tendencias detectadas por el radar
-- ============================================
-- Cada vez que corrés el radar, se guarda un "trend_search" con N tendencias
-- adentro. Cada tendencia puede convertirse en una idea con un click.

-- Búsquedas (cada vez que apretás "Buscar tendencias")
create table if not exists public.trend_searches (
  id uuid primary key default gen_random_uuid(),
  query text not null,                    -- consulta base (ej: "IA PyMEs Argentina")
  region text not null default 'AR',      -- región Google Trends
  raw_google_trends jsonb,                -- output crudo de Google Trends
  raw_serpapi jsonb,                      -- output crudo de SerpAPI
  ai_summary text,                        -- síntesis de GPT-4o
  created_at timestamptz not null default now()
);

create index idx_trend_searches_created_at on public.trend_searches(created_at desc);

-- Tendencias individuales (cada sugerencia que la IA detecta)
create table if not exists public.trends (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references public.trend_searches(id) on delete cascade,
  title text not null,                    -- título corto de la tendencia
  description text not null,              -- por qué es relevante
  angle text not null,                    -- ángulo sugerido para un post
  source_url text,                        -- fuente (link de news, si aplica)
  score int not null default 50,          -- relevancia 0-100
  converted_to_idea_id uuid references public.ideas(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_trends_search_id on public.trends(search_id);
create index idx_trends_created_at on public.trends(created_at desc);
create index idx_trends_converted on public.trends(converted_to_idea_id);

-- RLS
alter table public.trend_searches enable row level security;
alter table public.trends enable row level security;
