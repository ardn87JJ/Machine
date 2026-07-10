create table public.production_drafts (
  id uuid primary key default gen_random_uuid(),
  opportunity_scan_id uuid not null unique references public.opportunities(scan_id) on delete cascade,
  experiment_id uuid references public.execution_experiments(id) on delete set null,
  keyword text not null,
  title text not null,
  status text not null default 'DRAFT',
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_drafts_status_is_valid check (
    status in ('DRAFT', 'READY', 'USED')
  )
);

create index production_drafts_created_idx
  on public.production_drafts (created_at desc);

create index production_drafts_status_idx
  on public.production_drafts (status);

alter table public.production_drafts enable row level security;

comment on table public.production_drafts is
  'Saved producer drafts generated from scored opportunities and execution experiments.';
