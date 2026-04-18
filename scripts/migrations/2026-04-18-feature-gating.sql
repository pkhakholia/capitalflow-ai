-- Feature gating + subscription normalization
-- Date: 2026-04-18

alter table public.profiles
  add column if not exists plan text default 'free',
  add column if not exists subscription_status text default 'inactive',
  add column if not exists outreach_count integer not null default 0,
  add column if not exists last_reset timestamptz;

update public.profiles
set
  plan = coalesce(plan, 'free'),
  subscription_status = case
    when subscription_status in ('active', 'inactive', 'cancelled') then subscription_status
    else 'inactive'
  end,
  outreach_count = coalesce(outreach_count, 0);

alter table public.profiles
  alter column plan set default 'free',
  alter column subscription_status set default 'inactive';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_plan_check'
  ) then
    alter table public.profiles drop constraint profiles_plan_check;
  end if;
end $$;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'pro', 'gold'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_subscription_status_check'
  ) then
    alter table public.profiles drop constraint profiles_subscription_status_check;
  end if;
end $$;

alter table public.profiles
  add constraint profiles_subscription_status_check
  check (subscription_status in ('inactive', 'active', 'cancelled'));

