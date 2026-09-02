-- MY 일정 RLS 점검/복구 SQL
-- 기존 day12.sql 정책이 정상이라면 재실행해도 안전합니다.

alter table public.plans enable row level security;
alter table public.plan_items enable row level security;

drop policy if exists "Users can view own plans" on public.plans;
drop policy if exists "Users can create own plans" on public.plans;
drop policy if exists "Users can update own plans" on public.plans;
drop policy if exists "Users can delete own plans" on public.plans;

create policy "Users can view own plans"
on public.plans for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own plans"
on public.plans for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own plans"
on public.plans for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own plans"
on public.plans for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own plan items" on public.plan_items;
drop policy if exists "Users can create own plan items" on public.plan_items;
drop policy if exists "Users can update own plan items" on public.plan_items;
drop policy if exists "Users can delete own plan items" on public.plan_items;

create policy "Users can view own plan items"
on public.plan_items for select to authenticated
using (exists (
  select 1 from public.plans p
  where p.id = plan_items.plan_id
    and p.user_id = (select auth.uid())
));

create policy "Users can create own plan items"
on public.plan_items for insert to authenticated
with check (exists (
  select 1 from public.plans p
  where p.id = plan_items.plan_id
    and p.user_id = (select auth.uid())
));

create policy "Users can update own plan items"
on public.plan_items for update to authenticated
using (exists (
  select 1 from public.plans p
  where p.id = plan_items.plan_id
    and p.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.plans p
  where p.id = plan_items.plan_id
    and p.user_id = (select auth.uid())
));

create policy "Users can delete own plan items"
on public.plan_items for delete to authenticated
using (exists (
  select 1 from public.plans p
  where p.id = plan_items.plan_id
    and p.user_id = (select auth.uid())
));

-- 정책 확인
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('plans', 'plan_items')
order by tablename, policyname;
