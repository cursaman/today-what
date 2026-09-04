-- complete.sql 실행 후 구조가 모두 준비됐는지 검사합니다. 오류가 없으면 NOTICE 한 줄을 출력합니다.
do $$
declare
  missing text;
begin
  select string_agg(required.item, ', ' order by required.item) into missing
  from (values
    ('table:profiles', to_regclass('public.profiles') is not null),
    ('table:activities', to_regclass('public.activities') is not null),
    ('table:plans', to_regclass('public.plans') is not null),
    ('table:plan_items', to_regclass('public.plan_items') is not null),
    ('table:user_preferences', to_regclass('public.user_preferences') is not null),
    ('table:favorites', to_regclass('public.favorites') is not null),
    ('table:user_sports', to_regclass('public.user_sports') is not null),
    ('table:user_ott_services', to_regclass('public.user_ott_services') is not null),
    ('column:plans.total_distance_km', exists(select 1 from information_schema.columns where table_schema='public' and table_name='plans' and column_name='total_distance_km')),
    ('column:plan_items.duration_minutes', exists(select 1 from information_schema.columns where table_schema='public' and table_name='plan_items' and column_name='duration_minutes')),
    ('column:plan_items.latitude', exists(select 1 from information_schema.columns where table_schema='public' and table_name='plan_items' and column_name='latitude')),
    ('column:plan_items.transport_mode', exists(select 1 from information_schema.columns where table_schema='public' and table_name='plan_items' and column_name='transport_mode')),
    ('index:plans_user_created_at_idx', to_regclass('public.plans_user_created_at_idx') is not null),
    ('index:plan_items_plan_sort_idx', to_regclass('public.plan_items_plan_sort_idx') is not null),
    ('index:user_preferences_user_id_unique', to_regclass('public.user_preferences_user_id_unique') is not null),
    ('policy:plans', exists(select 1 from pg_policies where schemaname='public' and tablename='plans' and policyname='Users manage own plans')),
    ('policy:plan_items', exists(select 1 from pg_policies where schemaname='public' and tablename='plan_items' and policyname='Users manage own plan items')),
    ('policy:user_preferences', exists(select 1 from pg_policies where schemaname='public' and tablename='user_preferences' and policyname='Users manage own preferences')),
    ('policy:favorites', exists(select 1 from pg_policies where schemaname='public' and tablename='favorites' and policyname='Users manage own favorites'))
  ) as required(item, ready)
  where not required.ready;

  if missing is not null then raise exception 'Supabase schema missing: %', missing; end if;

  if exists (
    select 1 from pg_tables where schemaname='public'
      and tablename in ('profiles','activities','plans','plan_items','user_preferences','favorites','user_sports','user_ott_services')
      and not rowsecurity
  ) then raise exception 'RLS is disabled on one or more application tables'; end if;

  raise notice '오늘 뭐하지? Supabase schema verification passed.';
end $$;
