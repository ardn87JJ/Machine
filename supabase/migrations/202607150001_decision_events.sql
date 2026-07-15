create table public.decision_events (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.execution_experiments(id) on delete set null,
  opportunity_scan_id uuid,
  keyword text not null,
  event_type text not null,
  previous_status text,
  next_status text,
  previous_outcome text,
  next_outcome text,
  decision_label text,
  priority_score integer,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint decision_events_type_is_valid check (
    event_type in ('CREATED', 'STATUS_CHANGED', 'OUTCOME_RECORDED', 'NOTE_UPDATED')
  )
);

create index decision_events_created_idx
  on public.decision_events (created_at desc);

create index decision_events_experiment_idx
  on public.decision_events (experiment_id, created_at desc);

create index decision_events_keyword_idx
  on public.decision_events (keyword, created_at desc);

alter table public.decision_events enable row level security;

comment on table public.decision_events is
  'Append-only decision history for execution experiments and optimizer learning.';
