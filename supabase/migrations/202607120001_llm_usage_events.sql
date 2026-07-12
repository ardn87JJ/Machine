create table public.llm_usage_events (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references public.production_drafts(id) on delete set null,
  scene text not null,
  provider text not null,
  model text not null default '',
  source text not null,
  status text not null,
  estimated_input_tokens integer not null default 0,
  estimated_output_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  warning text,
  created_at timestamptz not null default now(),
  constraint llm_usage_provider_is_valid check (
    provider in ('openai', 'openrouter', 'groq', 'local', 'fallback')
  ),
  constraint llm_usage_source_is_valid check (
    source in ('llm', 'fallback')
  ),
  constraint llm_usage_status_is_valid check (
    status in ('success', 'fallback', 'error')
  )
);

create index llm_usage_events_created_idx
  on public.llm_usage_events (created_at desc);

create index llm_usage_events_provider_idx
  on public.llm_usage_events (provider, created_at desc);

create index llm_usage_events_draft_idx
  on public.llm_usage_events (draft_id, created_at desc);

alter table public.llm_usage_events enable row level security;

comment on table public.llm_usage_events is
  'Server-side history of LLM regeneration calls and estimated cost.';
