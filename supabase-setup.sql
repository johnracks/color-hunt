-- Color Hunt: run once in Supabase → SQL Editor → New query → Run
create table if not exists public.docs (
  path text primary key,
  col text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists docs_col_idx on public.docs (col);
alter table public.docs enable row level security;
drop policy if exists "ch read" on public.docs;
drop policy if exists "ch insert" on public.docs;
drop policy if exists "ch update" on public.docs;
drop policy if exists "ch delete" on public.docs;
create policy "ch read" on public.docs for select using (true);
create policy "ch insert" on public.docs for insert with check (true);
create policy "ch update" on public.docs for update using (true);
create policy "ch delete" on public.docs for delete using (true);
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;
drop policy if exists "ch photos read" on storage.objects;
drop policy if exists "ch photos upload" on storage.objects;
drop policy if exists "ch photos delete" on storage.objects;
create policy "ch photos read" on storage.objects for select using (bucket_id = 'photos');
create policy "ch photos upload" on storage.objects for insert with check (bucket_id = 'photos');
create policy "ch photos delete" on storage.objects for delete using (bucket_id = 'photos');
