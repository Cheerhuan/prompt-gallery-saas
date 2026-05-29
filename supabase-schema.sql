-- ═══════════════════════════════════════════════
-- Prompt Gallery SaaS — Supabase Schema
-- Paste this entire file into Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- 1. Community Prompts table
create table if not exists public.community_prompts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  full_prompt text not null,
  reference_image text default '',
  ai_model text default 'Other',
  tags text[] default array[]::text[],
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes for performance
create index if not exists idx_community_prompts_user_id on public.community_prompts(user_id);
create index if not exists idx_community_prompts_status on public.community_prompts(status);
create index if not exists idx_community_prompts_created_at on public.community_prompts(created_at desc);

-- 3. Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger on_community_prompts_updated
  before update on public.community_prompts
  for each row
  execute function public.handle_updated_at();

-- 4. Auto-create profile on signup
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text default '',
  avatar_url text default '',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 5. Row Level Security
alter table public.community_prompts enable row level security;
alter table public.profiles enable row level security;

-- Anyone can view approved prompts
create policy "Anyone can view approved prompts"
  on public.community_prompts
  for select
  using (status = 'approved');

-- Users can view their own prompts regardless of status
create policy "Users can view own prompts"
  on public.community_prompts
  for select
  using (auth.uid() = user_id);

-- Authenticated users can insert their own prompts
create policy "Users can insert own prompts"
  on public.community_prompts
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own pending prompts
create policy "Users can update own pending prompts"
  on public.community_prompts
  for update
  using (auth.uid() = user_id and status = 'pending');

-- Profiles: users can read any profile
create policy "Anyone can view profiles"
  on public.profiles
  for select
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 6. Storage bucket for user images
insert into storage.buckets (id, name, public)
values ('user-images', 'user-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to user-images/uid/
create policy "Users can upload their own images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'user-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can view uploaded images
create policy "Anyone can view user images"
  on storage.objects
  for select
  using (bucket_id = 'user-images');

-- 7. Enable pg_trgm for full-text search on prompts
create extension if not exists pg_trgm;

-- 8. Give anon key access to needed tables
grant usage on schema public to anon, authenticated;
grant all on public.community_prompts to anon, authenticated;
grant all on public.profiles to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;
