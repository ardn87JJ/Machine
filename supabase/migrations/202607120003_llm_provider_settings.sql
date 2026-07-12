create table public.llm_provider_settings (
  provider text primary key,
  label text not null,
  description text not null default '',
  enabled boolean not null default true,
  default_provider boolean not null default false,
  base_url text not null default '',
  model text not null default '',
  estimated_cost_per_run_usd numeric(12, 6) not null default 0,
  input_per_million_usd numeric(12, 6) not null default 0,
  output_per_million_usd numeric(12, 6) not null default 0,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint llm_provider_settings_provider_check check (
    provider in ('openai', 'openrouter', 'groq', 'local', 'fallback')
  )
);

create unique index llm_provider_settings_one_default_idx
  on public.llm_provider_settings (default_provider)
  where default_provider is true;

insert into public.llm_provider_settings
  (provider, label, description, enabled, default_provider, base_url, model, estimated_cost_per_run_usd, input_per_million_usd, output_per_million_usd, sort_order)
values
  ('openai', 'OpenAI', 'Qualite stable, facturation OpenAI API.', true, false, 'https://api.openai.com/v1', 'gpt-4o-mini', 0.006, 0.750000, 4.500000, 10),
  ('openrouter', 'OpenRouter', 'Routeur multi-modeles compatible OpenAI.', true, false, 'https://openrouter.ai/api/v1', 'openai/gpt-4o-mini', 0.004, 0.500000, 1.500000, 20),
  ('groq', 'Groq', 'Modeles rapides compatibles OpenAI.', true, false, 'https://api.groq.com/openai/v1', 'llama-3.1-8b-instant', 0.002, 0.100000, 0.300000, 30),
  ('local', 'Local', 'LLM PC via URL publique/tunnel compatible OpenAI.', true, false, '', 'llama3.1:8b', 0, 0, 0, 40),
  ('fallback', 'Fallback', 'Aucun cout API, generation deterministe.', true, true, '', 'deterministic', 0, 0, 0, 50)
on conflict (provider) do update set
  label = excluded.label,
  description = excluded.description,
  base_url = excluded.base_url,
  model = excluded.model,
  estimated_cost_per_run_usd = excluded.estimated_cost_per_run_usd,
  input_per_million_usd = excluded.input_per_million_usd,
  output_per_million_usd = excluded.output_per_million_usd,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table public.llm_provider_settings enable row level security;

comment on table public.llm_provider_settings is
  'Non-secret LLM provider settings. API keys remain in Supabase Edge Function secrets.';
