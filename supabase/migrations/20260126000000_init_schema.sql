-- Initial schema for Aspra (profiles, words, reviews) with RLS policies

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  native_language text,
  target_language text default 'en'
);

create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  definition text,
  translation text,
  examples jsonb not null default '[]'::jsonb,
  audio_url text,
  created_at timestamptz not null default now(),
  state int not null default 0,
  due_date timestamptz not null default now(),
  stability double precision,
  difficulty double precision,
  elapsed_days int not null default 0,
  reps int not null default 0,
  last_review timestamptz
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.words(id) on delete cascade,
  rating int not null check (rating between 1 and 4),
  review_time timestamptz not null default now(),
  scheduled_days int
);

create index if not exists words_due_date_idx on public.words (due_date);
create index if not exists words_user_due_date_idx on public.words (user_id, due_date);
create index if not exists reviews_word_id_idx on public.reviews (word_id);

alter table public.profiles enable row level security;
alter table public.words enable row level security;
alter table public.reviews enable row level security;

create policy "Profiles: read own" on public.profiles
  for select using (auth.uid() = id);

create policy "Profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Words: read own" on public.words
  for select using (auth.uid() = user_id);

create policy "Words: insert own" on public.words
  for insert with check (auth.uid() = user_id);

create policy "Words: update own" on public.words
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Words: delete own" on public.words
  for delete using (auth.uid() = user_id);

create policy "Reviews: read own" on public.reviews
  for select using (
    exists (
      select 1 from public.words w
      where w.id = reviews.word_id
        and w.user_id = auth.uid()
    )
  );

create policy "Reviews: insert own" on public.reviews
  for insert with check (
    exists (
      select 1 from public.words w
      where w.id = reviews.word_id
        and w.user_id = auth.uid()
    )
  );

create policy "Reviews: update own" on public.reviews
  for update using (
    exists (
      select 1 from public.words w
      where w.id = reviews.word_id
        and w.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.words w
      where w.id = reviews.word_id
        and w.user_id = auth.uid()
    )
  );

create policy "Reviews: delete own" on public.reviews
  for delete using (
    exists (
      select 1 from public.words w
      where w.id = reviews.word_id
        and w.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.words to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
