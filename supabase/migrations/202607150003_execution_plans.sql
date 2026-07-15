create table public.execution_plans (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null unique references public.execution_experiments(id) on delete cascade,
  opportunity_scan_id uuid not null references public.opportunities(scan_id) on delete cascade,
  keyword text not null,
  title text not null,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index execution_plans_scan_idx
  on public.execution_plans (opportunity_scan_id);

create index execution_plans_created_idx
  on public.execution_plans (created_at desc);

alter table public.execution_plans enable row level security;

comment on table public.execution_plans is
  'Executable 24/48/72h test checklists attached to opportunity experiments.';
