-- Database Schema for LearnSpaceAI / LMS-AI

-------------------------------------------------------
-- 1. Profiles Table
-------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  created_at timestamptz default now() not null
);

-------------------------------------------------------
-- 2. User Topics Table
-------------------------------------------------------
create table if not exists public.user_topics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  proficiency_level text default 'Beginner',
  progress_percent integer default 0,
  roadmap_cache text, -- Caches AI-generated Markdown roadmaps
  created_at timestamptz default now() not null
);

-- Ensure roadmap_cache column exists if updating an existing table
alter table public.user_topics 
add column if not exists roadmap_cache text;

-------------------------------------------------------
-- 3. Topic Modules Table
-------------------------------------------------------
create table if not exists public.topic_modules (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references public.user_topics(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  order_index integer not null
);

-------------------------------------------------------
-- 4. Todos Table
-------------------------------------------------------
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic_id uuid references public.user_topics(id) on delete cascade,
  task text not null,
  is_completed boolean default false,
  updated_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- Ensure updated_at column exists if updating an existing table
alter table public.todos 
add column if not exists updated_at timestamptz default now() not null;

-------------------------------------------------------
-- 5. User Documents Table
-------------------------------------------------------
create table if not exists public.user_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  file_url text not null,
  size text,
  created_at timestamptz default now() not null
);

-------------------------------------------------------
-- Enable Row Level Security (RLS) Across All Tables
-------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_topics enable row level security;
alter table public.topic_modules enable row level security;
alter table public.todos enable row level security;
alter table public.user_documents enable row level security;

-------------------------------------------------------
-- RLS Policies
-------------------------------------------------------

-- Profiles Policy
drop policy if exists "Users manage own profiles" on public.profiles;
create policy "Users manage own profiles" 
on public.profiles for all 
using (auth.uid() = id);

-- User Topics Policy
drop policy if exists "Users manage own topics" on public.user_topics;
create policy "Users manage own topics" 
on public.user_topics for all 
using (auth.uid() = user_id);

-- Topic Modules Policy (Checks ownership via user_topics join)
drop policy if exists "Users manage own topic modules" on public.topic_modules;
create policy "Users manage own topic modules" 
on public.topic_modules for all 
using (
  exists (
    select 1 from public.user_topics
    where public.user_topics.id = public.topic_modules.topic_id
      and public.user_topics.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.user_topics
    where public.user_topics.id = public.topic_modules.topic_id
      and public.user_topics.user_id = auth.uid()
  )
);

-- Todos Policy
drop policy if exists "Users manage own todos" on public.todos;
create policy "Users manage own todos" 
on public.todos for all 
using (auth.uid() = user_id);

-- User Documents Policy
drop policy if exists "Users manage own docs" on public.user_documents;
create policy "Users manage own docs" 
on public.user_documents for all 
using (auth.uid() = user_id);

-------------------------------------------------------
-- Triggers and Automated Functions
-------------------------------------------------------

-- Automatic Profile Creation Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Automatic updated_at Timestamp Refresh for Todos
create or replace function public.update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;   
end;
$$ language plpgsql;

drop trigger if exists set_todos_updated_at on public.todos;
create trigger set_todos_updated_at
  before update on public.todos
  for each row execute procedure public.update_modified_column();