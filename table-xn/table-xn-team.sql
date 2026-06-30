-- ============================================================
--  table.xn — Jamoa va takliflar (qo'shimcha migratsiya)
--  SQL Editor'da bir marta ishga tushiring. Mavjud bazani buzmaydi.
-- ============================================================

-- 1) profiles.email ustuni + backfill
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email
  from auth.users u where u.id = p.id and p.email is null;

-- 2) Takliflar jadvali
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  email       text not null,
  role        text not null default 'operator',
  status      text not null default 'pending',   -- pending | accepted
  created_at  timestamptz not null default now()
);
create index if not exists invites_email_idx on public.invites(lower(email));
create index if not exists invites_org_idx on public.invites(org_id);

alter table public.invites enable row level security;
grant all on public.invites to authenticated;

drop policy if exists "owner/admin manage invites" on public.invites;
create policy "owner/admin manage invites" on public.invites for all
  using (org_id = public.current_org_id() and public.current_member_role() in ('owner','admin'))
  with check (org_id = public.current_org_id() and public.current_member_role() in ('owner','admin'));

-- 3) owner/admin org a'zolarini boshqarishi
drop policy if exists "owner/admin update org profiles" on public.profiles;
create policy "owner/admin update org profiles" on public.profiles for update
  using (org_id = public.current_org_id() and public.current_member_role() in ('owner','admin'))
  with check (org_id = public.current_org_id());

drop policy if exists "owner/admin remove org profiles" on public.profiles;
create policy "owner/admin remove org profiles" on public.profiles for delete
  using (org_id = public.current_org_id()
         and public.current_member_role() in ('owner','admin')
         and id <> auth.uid());   -- o'zini o'chira olmaydi

-- 4) Rol himoyasi: oddiy a'zo o'z rolini oshira olmaydi
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and public.current_member_role() not in ('owner','admin') then
    new.role := old.role;   -- ruxsatsiz rol o'zgarishi e'tiborsiz qoldiriladi
  end if;
  return new;
end; $$;
drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- 5) Onboard RPC — taklifni hisobga oladi
--    Taklif bo'lsa -> o'sha tashkilotga qo'shiladi; bo'lmasa -> yangi tashkilot.
create or replace function public.onboard(org_name text, owner_name text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare v_email text; v_invite record; v_org uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Profile already exists';
  end if;
  select email into v_email from auth.users where id = auth.uid();

  select * into v_invite from public.invites
    where lower(email) = lower(v_email) and status = 'pending'
    order by created_at desc limit 1;

  if found then
    insert into public.profiles (id, org_id, full_name, role, email)
      values (auth.uid(), v_invite.org_id, owner_name, v_invite.role, v_email);
    update public.invites set status = 'accepted' where id = v_invite.id;
    return v_invite.org_id;
  else
    insert into public.organizations (name) values (org_name) returning id into v_org;
    insert into public.profiles (id, org_id, full_name, role, email)
      values (auth.uid(), v_org, owner_name, 'owner', v_email);
    return v_org;
  end if;
end; $$;
grant execute on function public.onboard(text, text) to authenticated;
