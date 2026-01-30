-- Onboarding v1.0: native_lang + active_lang + onboarding gate + language entities

-- Profiles: rename columns to match product naming
alter table public.profiles
  rename column native_language to native_lang;

alter table public.profiles
  rename column target_language to active_lang;

-- Allow active_lang to be null before onboarding
alter table public.profiles
  alter column active_lang drop default;

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz null;

-- Allow native_lang to be null before onboarding
alter table public.profiles
  alter column native_lang drop default;

-- Keep existing users functional (pre-onboarding) with a sane default active_lang
update public.profiles
set active_lang = 'en'
where active_lang is null
   or active_lang not in ('en', 'es', 'fr', 'de', 'ar', 'pt');

alter table public.profiles
  add constraint profiles_active_lang_check
  check (active_lang in ('en', 'es', 'fr', 'de', 'ar', 'pt') or active_lang is null);

-- Update new-user trigger: copy native_lang from user metadata when available
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, native_lang)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'native_lang', ''),
      nullif(new.raw_user_meta_data->>'native_language', '')
    )
  )
  on conflict (id) do update
    set native_lang = coalesce(profiles.native_lang, excluded.native_lang);
  return new;
end;
$$;

-- Backfill profiles.native_lang from auth metadata where missing
update public.profiles p
set native_lang = coalesce(
  nullif(u.raw_user_meta_data->>'native_lang', ''),
  nullif(u.raw_user_meta_data->>'native_language', ''),
  'en'
)
from auth.users u
where p.id = u.id
  and p.native_lang is null;

-- User languages: enabled languages + per-language level
create table if not exists public.user_languages (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lang_code text not null check (lang_code in ('en', 'es', 'fr', 'de', 'ar', 'pt')),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  enabled_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  primary key (user_id, lang_code)
);

alter table public.user_languages enable row level security;

create policy "User languages: read own" on public.user_languages
  for select using (auth.uid() = user_id);

create policy "User languages: insert own" on public.user_languages
  for insert with check (auth.uid() = user_id);

create policy "User languages: update own" on public.user_languages
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "User languages: delete own" on public.user_languages
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_languages to authenticated;

-- Dictionaries: one default dictionary per user per language
create table if not exists public.dictionaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lang_code text not null check (lang_code in ('en', 'es', 'fr', 'de', 'ar', 'pt')),
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists dictionaries_one_default_per_user_lang
  on public.dictionaries (user_id, lang_code)
  where is_default;

create index if not exists dictionaries_user_lang_idx
  on public.dictionaries (user_id, lang_code);

alter table public.dictionaries enable row level security;

create policy "Dictionaries: read own" on public.dictionaries
  for select using (auth.uid() = user_id);

create policy "Dictionaries: insert own" on public.dictionaries
  for insert with check (auth.uid() = user_id);

create policy "Dictionaries: update own" on public.dictionaries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Dictionaries: delete own" on public.dictionaries
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.dictionaries to authenticated;

-- Words: isolate by active language (lang_code) and default dictionary
alter table public.words
  add column if not exists lang_code text;

alter table public.words
  add column if not exists dictionary_id uuid references public.dictionaries(id) on delete set null;

-- Backfill words.lang_code
update public.words w
set lang_code = case
  when p.active_lang in ('en', 'es', 'fr', 'de', 'ar', 'pt') then p.active_lang
  else 'en'
end
from public.profiles p
where w.user_id = p.id
  and w.lang_code is null;

-- Ensure default dictionaries exist for existing words
insert into public.dictionaries (user_id, lang_code, name, is_default)
select distinct
  w.user_id,
  w.lang_code,
  case w.lang_code
    when 'en' then 'English'
    when 'es' then 'Español'
    when 'fr' then 'Français'
    when 'de' then 'Deutsch'
    when 'ar' then 'العربية'
    when 'pt' then 'Português'
    else w.lang_code
  end as name,
  true as is_default
from public.words w
left join public.dictionaries d
  on d.user_id = w.user_id
  and d.lang_code = w.lang_code
  and d.is_default = true
where d.id is null;

-- Backfill words.dictionary_id
update public.words w
set dictionary_id = d.id
from public.dictionaries d
where d.user_id = w.user_id
  and d.lang_code = w.lang_code
  and d.is_default = true
  and w.dictionary_id is null;

-- Enforce non-null lang_code and dictionary_id
alter table public.words
  alter column lang_code set not null;

alter table public.words
  add constraint words_lang_code_check
  check (lang_code in ('en', 'es', 'fr', 'de', 'ar', 'pt'));

alter table public.words
  alter column dictionary_id set not null;

-- Refresh PostgREST schema cache (Supabase) after DDL changes.
notify pgrst, 'reload schema';
