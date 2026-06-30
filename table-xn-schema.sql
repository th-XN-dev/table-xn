-- ============================================================
--  table.xn — Supabase TO'LIQ SOZLASH (idempotent)
--  by project.xn
--
--  Bu skriptni BUTUNICHA SQL Editor'da bir marta ishga tushiring.
--  Mavjud jadval/ma'lumotni BUZMAYDI — qayta ishga tushirsa ham xato bermaydi.
--  branches 403 muammosini hal qiladi (org_id avtomatik qo'yiladi).
-- ============================================================


-- ============================================================
--  1. JADVALLAR  (mavjud bo'lsa o'tib ketadi)
-- ============================================================
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text not null default 'free',
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  full_name   text,
  role        text not null default 'operator',
  created_at  timestamptz not null default now()
);
create index if not exists profiles_org_id_idx on public.profiles(org_id);

create table if not exists public.branches (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists branches_org_id_idx on public.branches(org_id);

create table if not exists public.daily_reports (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations(id) on delete cascade,
  branch_id          uuid not null references public.branches(id) on delete cascade,
  report_date        date not null,
  students           integer not null default 0,
  leads              integer not null default 0,
  quality_leads      integer not null default 0,
  bd_written         integer not null default 0,
  bd_visited         integer not null default 0,
  contracts          integer not null default 0,
  students_left      integer not null default 0,
  frozen             integer not null default 0,
  returned           integer not null default 0,
  group_videos       integer not null default 0,
  individual_videos  integer not null default 0,
  missed_lessons     integer not null default 0,
  nps                numeric(5,2),
  tg_control         boolean not null default false,
  taxi_control       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint daily_reports_unique_day unique (branch_id, report_date),
  constraint daily_reports_non_negative check (
    students >= 0 and leads >= 0 and quality_leads >= 0 and bd_written >= 0
    and bd_visited >= 0 and contracts >= 0 and students_left >= 0 and frozen >= 0
    and returned >= 0 and group_videos >= 0 and individual_videos >= 0
    and missed_lessons >= 0
  )
);
create index if not exists daily_reports_org_idx          on public.daily_reports(org_id);
create index if not exists daily_reports_branch_date_idx  on public.daily_reports(branch_id, report_date desc);


-- ============================================================
--  2. YORDAMCHI FUNKSIYALAR
-- ============================================================
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public
as $$ select org_id from public.profiles where id = auth.uid(); $$;

create or replace function public.current_member_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid(); $$;


-- ============================================================
--  3. TRIGGERLAR
-- ============================================================
-- updated_at avtomatik
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists daily_reports_set_updated_at on public.daily_reports;
create trigger daily_reports_set_updated_at
  before update on public.daily_reports
  for each row execute function public.set_updated_at();

-- daily_reports.org_id branch'dan olinadi
create or replace function public.set_report_org()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  select org_id into new.org_id from public.branches where id = new.branch_id;
  return new;
end; $$;

drop trigger if exists daily_reports_set_org on public.daily_reports;
create trigger daily_reports_set_org
  before insert or update on public.daily_reports
  for each row execute function public.set_report_org();

-- *** MUHIM TUZATISH ***  branches.org_id avtomatik qo'yiladi (403 yechimi)
create or replace function public.set_branch_org()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.org_id is null then
    new.org_id := public.current_org_id();
  end if;
  return new;
end; $$;

drop trigger if exists branches_set_org on public.branches;
create trigger branches_set_org
  before insert on public.branches
  for each row execute function public.set_branch_org();


-- ============================================================
--  4. RUXSATLAR (GRANTS)
-- ============================================================
grant usage on schema public to anon, authenticated;
grant all on public.organizations, public.profiles, public.branches, public.daily_reports
  to authenticated;
grant execute on all functions in schema public to anon, authenticated;


-- ============================================================
--  5. ROW LEVEL SECURITY
-- ============================================================
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.branches      enable row level security;
alter table public.daily_reports enable row level security;

-- ORGANIZATIONS
drop policy if exists "members read own org" on public.organizations;
create policy "members read own org" on public.organizations
  for select using (id = public.current_org_id());

drop policy if exists "owner/admin update own org" on public.organizations;
create policy "owner/admin update own org" on public.organizations
  for update using (id = public.current_org_id()
                    and public.current_member_role() in ('owner','admin'));

-- PROFILES
drop policy if exists "read profiles in my org" on public.profiles;
create policy "read profiles in my org" on public.profiles
  for select using (org_id = public.current_org_id());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid());

-- BRANCHES
drop policy if exists "read branches in my org" on public.branches;
create policy "read branches in my org" on public.branches
  for select using (org_id = public.current_org_id());

drop policy if exists "owner/admin manage branches" on public.branches;
create policy "owner/admin manage branches" on public.branches
  for all
  using (org_id = public.current_org_id()
         and public.current_member_role() in ('owner','admin'))
  with check (org_id = public.current_org_id()
              and public.current_member_role() in ('owner','admin'));

-- DAILY REPORTS
drop policy if exists "read reports in my org" on public.daily_reports;
create policy "read reports in my org" on public.daily_reports
  for select using (org_id = public.current_org_id());

drop policy if exists "members insert reports in my org" on public.daily_reports;
create policy "members insert reports in my org" on public.daily_reports
  for insert with check (branch_id in (
    select id from public.branches where org_id = public.current_org_id()
  ));

drop policy if exists "members update reports in my org" on public.daily_reports;
create policy "members update reports in my org" on public.daily_reports
  for update using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

drop policy if exists "owner/admin delete reports" on public.daily_reports;
create policy "owner/admin delete reports" on public.daily_reports
  for delete using (org_id = public.current_org_id()
                    and public.current_member_role() in ('owner','admin'));


-- ============================================================
--  6. ONBOARDING RPC
-- ============================================================
create or replace function public.create_organization(org_name text, owner_name text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare new_org_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Profile already exists for this user';
  end if;
  insert into public.organizations (name) values (org_name) returning id into new_org_id;
  insert into public.profiles (id, org_id, full_name, role)
    values (auth.uid(), new_org_id, owner_name, 'owner');
  return new_org_id;
end; $$;
