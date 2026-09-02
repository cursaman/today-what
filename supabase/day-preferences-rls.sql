-- 오늘 뭐하지? /my/preferences 사용자별 분리 및 RLS 점검
alter table public.user_preferences enable row level security;

drop policy if exists "Users can view own preferences" on public.user_preferences;
drop policy if exists "Users can create own preferences" on public.user_preferences;
drop policy if exists "Users can update own preferences" on public.user_preferences;
drop policy if exists "Users can delete own preferences" on public.user_preferences;

create policy "Users can view own preferences" on public.user_preferences
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create own preferences" on public.user_preferences
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own preferences" on public.user_preferences
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own preferences" on public.user_preferences
for delete to authenticated using ((select auth.uid()) = user_id);

create unique index if not exists user_preferences_user_id_unique on public.user_preferences(user_id);
