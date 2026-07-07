create table public.scans (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  keyword text not null,
  status public.job_status not null default 'queued',
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scans_platform_is_valid check (platform in ('youtube')),
  constraint scans_keyword_is_not_blank check (length(btrim(keyword)) >= 2)
);

create index scans_created_at_idx
  on public.scans (created_at desc);

alter table public.scans enable row level security;

comment on table public.scans is
  'Scout scan registry. Each row represents one explicit scan request.';
