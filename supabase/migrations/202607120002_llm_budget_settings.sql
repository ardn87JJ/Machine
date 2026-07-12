create table public.llm_budget_settings (
  id text primary key default 'default',
  daily_limit_usd numeric(12, 6) not null default 0.25,
  monthly_limit_usd numeric(12, 6) not null default 5.00,
  enforce_limits boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint llm_budget_settings_singleton check (id = 'default')
);

insert into public.llm_budget_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.llm_budget_settings enable row level security;

comment on table public.llm_budget_settings is
  'Singleton settings for server-side LLM budget limits.';
