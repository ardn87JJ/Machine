create table public.youtube_channels (
  id text primary key,
  title text not null,
  description text not null default '',
  published_at timestamptz,
  subscriber_count bigint,
  video_count bigint,
  view_count bigint,
  thumbnail_url text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.youtube_videos (
  id text primary key,
  channel_id text not null references public.youtube_channels(id),
  title text not null,
  description text not null default '',
  published_at timestamptz,
  duration text,
  view_count bigint,
  like_count bigint,
  comment_count bigint,
  thumbnail_url text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scan_videos (
  scan_id uuid not null references public.scans(id) on delete cascade,
  video_id text not null references public.youtube_videos(id) on delete cascade,
  rank integer not null,
  created_at timestamptz not null default now(),
  primary key (scan_id, video_id),
  constraint scan_videos_rank_is_positive check (rank > 0)
);

create index youtube_videos_channel_idx
  on public.youtube_videos (channel_id);

create index scan_videos_scan_rank_idx
  on public.scan_videos (scan_id, rank);

alter table public.youtube_channels enable row level security;
alter table public.youtube_videos enable row level security;
alter table public.scan_videos enable row level security;

comment on table public.youtube_channels is
  'Normalized YouTube channel facts collected by trusted Scout workers.';
comment on table public.youtube_videos is
  'Normalized YouTube video facts collected by trusted Scout workers.';
comment on table public.scan_videos is
  'Videos attached to a Scout scan, preserving discovery rank.';
