-- Populate profiles.native_language from auth.users metadata on signup

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, native_language)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'native_language', ''), 'ru')
  )
  on conflict (id) do update
    set native_language = coalesce(profiles.native_language, excluded.native_language);
  return new;
end;
$$;

-- Backfill existing profiles (keep existing values)
update public.profiles p
set native_language = coalesce(nullif(u.raw_user_meta_data->>'native_language', ''), 'ru')
from auth.users u
where p.id = u.id
  and p.native_language is null;

alter table public.profiles
  alter column native_language set default 'ru';
