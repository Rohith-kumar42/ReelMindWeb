-- ============================================================
-- ReelMind — Supabase Schema (text PKs, matches existing table)
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- 0. RESET
drop table if exists public.content_items cascade;
drop table if exists public.categories    cascade;
drop function if exists match_content_items cascade;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- 2. TABLES
create table public.categories (
  id         text primary key,
  user_id    uuid not null default '00000000-0000-0000-0000-000000000001',
  name       text not null,
  slug       text not null unique,
  color      text not null default '#8B5CF6',
  icon       text not null default 'bookmark',
  created_at timestamptz not null default now()
);

create table public.content_items (
  id            text primary key,
  user_id       uuid not null default '00000000-0000-0000-0000-000000000001',
  reel_url      text not null,
  link_url      text,
  notes         text,
  title         text not null,
  summary       text not null,
  category_id   text not null references public.categories(id) on delete cascade,
  subcategory   text,
  tags          text[] not null default '{}',
  content_type  text not null default 'resource',
  is_favorite   boolean not null default false,
  ai_confidence real not null default 0.9,
  embedding     vector(1536),
  sort_order    integer not null default 0,
  view_count    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3. INDEXES
create index categories_user_id_idx on public.categories(user_id);
create index content_items_category_id_idx on public.content_items(category_id);
create index content_items_user_id_idx     on public.content_items(user_id);
create index content_items_created_at_idx  on public.content_items(created_at desc);

-- 4. RLS
alter table public.categories    enable row level security;
alter table public.content_items enable row level security;

create policy "Allow all on categories"    on public.categories    for all using (true) with check (true);
create policy "Allow all on content_items" on public.content_items for all using (true) with check (true);

-- 5. VECTOR SEARCH FUNCTION
create function match_content_items(
  query_embedding vector(1536),
  match_user_id   uuid,
  match_threshold float,
  match_count     int
)
returns table (
  id            text,
  title         text,
  summary       text,
  reel_url      text,
  link_url      text,
  tags          text[],
  content_type  text,
  is_favorite   boolean,
  view_count    integer,
  created_at    timestamptz,
  similarity    float
)
language sql stable as $$
  select ci.id, ci.title, ci.summary, ci.reel_url, ci.link_url,
         ci.tags, ci.content_type, ci.is_favorite, ci.view_count,
         ci.created_at,
         1 - (ci.embedding <=> query_embedding) as similarity
  from public.content_items ci
  where ci.user_id = match_user_id
    and ci.embedding is not null
    and 1 - (ci.embedding <=> query_embedding) > match_threshold
  order by ci.embedding <=> query_embedding
  limit match_count;
$$;
