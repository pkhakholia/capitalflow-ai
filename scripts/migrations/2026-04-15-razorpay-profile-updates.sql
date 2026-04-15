-- Razorpay profile/payment schema updates
-- Date: 2026-04-15

alter table public.profiles
  add column if not exists subscription_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists plan_activated_at timestamptz,
  add column if not exists plan_expires_at timestamptz,
  add column if not exists next_billing_at timestamptz;

create index if not exists idx_profiles_subscription_id
  on public.profiles (subscription_id);

create index if not exists idx_profiles_razorpay_payment_id
  on public.profiles (razorpay_payment_id);

create table if not exists public.payment_failures (
  id bigserial primary key,
  payment_id text,
  order_id text,
  error_description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_failures_payment_id
  on public.payment_failures (payment_id);

create index if not exists idx_payment_failures_order_id
  on public.payment_failures (order_id);

