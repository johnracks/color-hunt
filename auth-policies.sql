-- Color Hunt: require sign-in to create or change anything. Viewing stays public so book links work.
drop policy if exists "ch insert" on public.docs;
drop policy if exists "ch update" on public.docs;
drop policy if exists "ch delete" on public.docs;
create policy "ch insert" on public.docs for insert to authenticated with check (true);
create policy "ch update" on public.docs for update to authenticated using (true);
create policy "ch delete" on public.docs for delete to authenticated using (true);
drop policy if exists "ch photos upload" on storage.objects;
drop policy if exists "ch photos delete" on storage.objects;
create policy "ch photos upload" on storage.objects for insert to authenticated with check (bucket_id = 'photos');
create policy "ch photos delete" on storage.objects for delete to authenticated using (bucket_id = 'photos');
