create table public.competitor_data (
  scan_id uuid not null references public.scans(id) on delete cascade,
  channel_id text not null references public.youtube_channels(id) on delete cascade,
  channel_title text not null,
  subscriber_count bigint,
  channel_video_count bigint,
  channel_view_count bigint,
  observed_video_count integer not null,
  average_views bigint not null,
  total_views bigint not null,
  best_video_id text references public.youtube_videos(id) on delete set null,
  best_video_title text not null default '',
  weak_signals integer not null default 0,
  attack_tag text not null,
  weakness_summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scan_id, channel_id),
  constraint competitor_data_observed_count_is_positive check (observed_video_count > 0),
  constraint competitor_data_attack_tag_is_valid check (
    attack_tag in ('WEAK_TARGET', 'BENCHMARK', 'WATCH')
  )
);

create index competitor_data_scan_attack_idx
  on public.competitor_data (scan_id, attack_tag);

create index competitor_data_channel_idx
  on public.competitor_data (channel_id);

alter table public.competitor_data enable row level security;

comment on table public.competitor_data is
  'Per-scan competitor intelligence extracted from YouTube channels and videos.';
