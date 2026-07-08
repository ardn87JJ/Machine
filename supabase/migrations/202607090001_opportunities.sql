create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null unique references public.scans(id) on delete cascade,
  keyword text not null,
  title text not null,
  verdict text not null,
  model_version text not null,
  summary text not null,
  scores jsonb not null,
  evidence_video_ids jsonb not null default '[]'::jsonb,
  competitor_channels jsonb not null default '[]'::jsonb,
  execution_plan jsonb not null,
  source text not null default 'scout',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunities_verdict_is_valid check (
    verdict in ('GO', 'WATCH', 'SKIP')
  )
);

create index opportunities_created_idx
  on public.opportunities (created_at desc);

create index opportunities_verdict_idx
  on public.opportunities (verdict);

alter table public.opportunities enable row level security;

comment on table public.opportunities is
  'Persisted Scout opportunities with the analyst verdict and execution plan.';
