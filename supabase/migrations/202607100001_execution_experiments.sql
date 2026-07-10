create table public.execution_experiments (
  id uuid primary key default gen_random_uuid(),
  opportunity_scan_id uuid not null unique references public.opportunities(scan_id) on delete cascade,
  keyword text not null,
  title text not null,
  decision_label text not null,
  priority_score integer not null,
  status text not null default 'READY',
  next_action text not null,
  success_criteria text not null,
  evidence_video_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint execution_experiments_decision_is_valid check (
    decision_label in ('ATTAQUER', 'TESTER', 'VEILLE')
  ),
  constraint execution_experiments_status_is_valid check (
    status in ('READY', 'RUNNING', 'DONE', 'PAUSED')
  )
);

create index execution_experiments_created_idx
  on public.execution_experiments (created_at desc);

create index execution_experiments_status_idx
  on public.execution_experiments (status);

alter table public.execution_experiments enable row level security;

comment on table public.execution_experiments is
  'Operator execution queue created from scored Scout opportunities.';
