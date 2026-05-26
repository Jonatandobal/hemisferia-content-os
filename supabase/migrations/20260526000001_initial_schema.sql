-- ============================================
-- HEMISFERIA CONTENT OS - Schema inicial
-- ============================================
-- Single-tenant (vos sos el único usuario).
-- No usamos auth de Supabase por ahora — basic-auth en la app.
-- Por eso RLS queda permisivo para el service_role.

-- ============================================
-- IDEAS - Capturadas vía web/shortcut
-- ============================================
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  raw_text text not null,
  source text not null default 'web'
    check (source in ('web', 'manual', 'shortcut')),
  pillar text
    check (pillar in ('caso', 'contrarian', 'educativo', 'founder')),
  status text not null default 'pending'
    check (status in ('pending', 'generated', 'archived')),
  created_at timestamptz not null default now()
);

create index idx_ideas_status on public.ideas(status);
create index idx_ideas_created_at on public.ideas(created_at desc);

-- ============================================
-- DRAFTS - 3 variantes generadas por IA por idea
-- ============================================
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  variant int not null check (variant between 1 and 5),
  content text not null,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'rejected', 'published')),
  scheduled_for timestamptz,
  created_at timestamptz not null default now()
);

create index idx_drafts_idea_id on public.drafts(idea_id);
create index idx_drafts_status on public.drafts(status);
create index idx_drafts_scheduled_for on public.drafts(scheduled_for);

-- ============================================
-- POSTS - Publicados en LinkedIn (con métricas)
-- ============================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references public.drafts(id) on delete set null,
  content text not null,
  linkedin_url text,
  published_at timestamptz not null default now(),
  impressions int not null default 0,
  likes int not null default 0,
  comments int not null default 0,
  shares int not null default 0,
  dms_generated int not null default 0,
  metrics_updated_at timestamptz
);

create index idx_posts_published_at on public.posts(published_at desc);

-- ============================================
-- AI_REPORTS - Análisis quincenal de IA
-- ============================================
create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  insights jsonb not null default '{}'::jsonb,
  new_ideas_suggested jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_ai_reports_period on public.ai_reports(period_end desc);

-- ============================================
-- MAGIC_TOKENS - Tokens para acciones via links de email
-- ============================================
create table if not exists public.magic_tokens (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references public.drafts(id) on delete cascade,
  action text not null
    check (action in ('approve', 'edit', 'reject', 'copied', 'published', 'snooze')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_magic_tokens_draft_id on public.magic_tokens(draft_id);
create index idx_magic_tokens_expires_at on public.magic_tokens(expires_at);

-- ============================================
-- RLS - Row Level Security
-- ============================================
-- Por ahora bloqueamos TODO para anon y authenticated.
-- Toda la app usa service_role desde el backend (basic-auth en API routes).
-- Cuando metamos Supabase Auth, refinamos las policies.

alter table public.ideas enable row level security;
alter table public.drafts enable row level security;
alter table public.posts enable row level security;
alter table public.ai_reports enable row level security;
alter table public.magic_tokens enable row level security;

-- Policies vacías: anon y authenticated no pueden hacer nada.
-- service_role bypassa RLS automáticamente.
-- (Si querés permitir lectura pública desde el browser eventualmente,
-- agregás policies acá.)

-- ============================================
-- Función helper: cleanup de tokens expirados
-- ============================================
create or replace function public.cleanup_expired_tokens()
returns void
language sql
as $$
  delete from public.magic_tokens
  where expires_at < now() - interval '1 day';
$$;
