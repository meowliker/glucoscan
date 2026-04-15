-- GlucoScan Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- ============================================
-- User Profiles Table
-- ============================================
-- Stores additional user details beyond auth.users.
-- Created automatically when a user signs up.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  date_of_birth date,
  diabetes_type text check (diabetes_type in ('type_1', 'type_2', 'gestational', 'prediabetes', 'other', null)),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- User Settings Table
-- ============================================
create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  blood_sugar_unit text default 'mg/dL' check (blood_sugar_unit in ('mg/dL', 'mmol/L')),
  onboarding_complete boolean default false,
  disclaimer_accepted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Scan History Table
-- ============================================
create table if not exists scan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  product_name text not null,
  product_brand text,
  product_source text,
  nutrition jsonb not null,
  ingredients text,
  result jsonb not null,
  assessment jsonb,
  scanned_at timestamptz default now()
);

-- ============================================
-- Shared Products Table (crowd-sourced)
-- ============================================
-- Every time a user successfully looks up a product via AI,
-- we save it here. All authenticated users can read the table,
-- so subsequent searches benefit from previous lookups.
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text,
  nutrition jsonb not null,
  ingredients text,
  -- normalized key for deduplication: lowercase name + brand with non-alphanumerics removed
  search_key text not null unique,
  lookup_count integer default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists products_name_idx on products (lower(name));
create index if not exists products_brand_idx on products (lower(brand));

-- ============================================
-- Row Level Security (RLS)
-- ============================================
alter table profiles enable row level security;
alter table user_settings enable row level security;
alter table scan_history enable row level security;
alter table products enable row level security;

-- Profiles Policies
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Products Policies (crowd-sourced, shared across users)
create policy "Anyone authenticated can read products"
  on products for select
  to authenticated
  using (true);

create policy "Authenticated can insert products"
  on products for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated can update products"
  on products for update
  to authenticated
  using (true);

-- User Settings Policies
create policy "Users can read own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);

-- Scan History Policies
create policy "Users can read own history"
  on scan_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own history"
  on scan_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own history"
  on scan_history for delete
  using (auth.uid() = user_id);

-- ============================================
-- Indexes
-- ============================================
create index if not exists scan_history_user_date
  on scan_history(user_id, scanned_at desc);

-- ============================================
-- Auto-create profile + settings row on user signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
