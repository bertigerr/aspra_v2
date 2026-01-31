-- Onboarding v1.0 follow-up: enforce dictionary ownership + consistent FK semantics

-- Ensure a word's dictionary belongs to the same user and language.
alter table public.dictionaries
  add constraint dictionaries_id_user_lang_key unique (id, user_id, lang_code);

alter table public.words
  drop constraint if exists words_dictionary_id_fkey;

alter table public.words
  add constraint words_dictionary_id_user_lang_fkey
  foreign key (dictionary_id, user_id, lang_code)
  references public.dictionaries (id, user_id, lang_code)
  on delete restrict;

-- Refresh PostgREST schema cache (Supabase) after DDL changes.
notify pgrst, 'reload schema';

