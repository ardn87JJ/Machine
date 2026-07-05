create extension if not exists pgcrypto;

create type public.job_status as enum (
  'queued',
  'running',
  'cancel_requested',
  'cancelled',
  'completed',
  'failed'
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  entity_type text not null,
  entity_id uuid,
  status public.job_status not null default 'queued',
  idempotency_key text not null unique,
  priority smallint not null default 100,
  attempt_count smallint not null default 0,
  max_attempts smallint not null default 3,
  locked_by text,
  locked_until timestamptz,
  heartbeat_at timestamptz,
  available_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_attempts_are_valid check (
    attempt_count >= 0 and max_attempts > 0 and attempt_count <= max_attempts
  )
);

create index jobs_available_idx
  on public.jobs (priority, available_at, created_at)
  where status = 'queued';

create table public.job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.jobs(id) on delete cascade,
  event_type text not null,
  level text not null default 'info',
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint job_events_level_is_valid check (
    level in ('debug', 'info', 'warning', 'error')
  )
);

create index job_events_job_created_idx
  on public.job_events (job_id, created_at desc);

create table public.scoring_models (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  status text not null default 'draft',
  weights jsonb not null,
  thresholds jsonb not null,
  description text not null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  constraint scoring_models_status_is_valid check (
    status in ('draft', 'active', 'retired')
  )
);

create unique index scoring_models_single_active_idx
  on public.scoring_models ((status))
  where status = 'active';

alter table public.jobs enable row level security;
alter table public.job_events enable row level security;
alter table public.scoring_models enable row level security;

comment on table public.jobs is
  'Server-managed queue. No direct browser policy is intentionally defined.';
comment on table public.job_events is
  'Append-only technical events written by trusted server processes.';
comment on table public.scoring_models is
  'Versioned deterministic scoring configuration.';
