-- =============================================================================
-- 0008_referral_system.sql — Referral program with WhatsApp phone verification
-- and server-validated promo codes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add unique referral_code to profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists referral_code text unique;

-- Seed existing profiles with a referral code (8-char uppercase alphanumeric)
update public.profiles
set referral_code = upper(substr(md5(id::text || now()::text), 1, 8))
where referral_code is null;

-- Ensure future profiles always get a code via the trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_meta jsonb;
  v_first_name text;
  v_last_name text;
  v_email text;
  v_full_name text;
  v_referral_code text;
begin
  raw_meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_email := new.email;
  v_first_name := raw_meta ->> 'first_name';
  v_last_name := raw_meta ->> 'last_name';

  if v_first_name is null and raw_meta ? 'full_name' then
    v_full_name := raw_meta ->> 'full_name';
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := nullif(trim(substr(v_full_name, length(split_part(v_full_name, ' ', 1)) + 1)), '');
  end if;

  if v_first_name is null and raw_meta ? 'name' then
    v_full_name := raw_meta ->> 'name';
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := nullif(trim(substr(v_full_name, length(split_part(v_full_name, ' ', 1)) + 1)), '');
  end if;

  -- Generate unique 8-char referral code
  v_referral_code := upper(substr(md5(new.id::text || now()::text || random()::text), 1, 8));

  insert into public.profiles (id, role, full_name, first_name, last_name, email, referral_code)
  values (
    new.id,
    'customer',
    coalesce(v_full_name, trim(coalesce(v_first_name, '') || ' ' || coalesce(v_last_name, ''))),
    v_first_name,
    v_last_name,
    v_email,
    v_referral_code
  )
  on conflict (id) do update set
    first_name = coalesce(profiles.first_name, excluded.first_name),
    last_name = coalesce(profiles.last_name, excluded.last_name),
    email = coalesce(excluded.email, profiles.email),
    full_name = coalesce(profiles.full_name, excluded.full_name),
    referral_code = coalesce(profiles.referral_code, excluded.referral_code);

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Referrals table
-- ---------------------------------------------------------------------------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending_email'
    check (status in ('pending_email', 'pending_whatsapp_phone', 'qualified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referrals_no_self check (referrer_id <> referred_id),
  constraint referrals_unique_referred unique (referred_id)
);

create index if not exists referrals_referrer_idx on public.referrals (referrer_id);
create index if not exists referrals_referred_idx on public.referrals (referred_id);

-- ---------------------------------------------------------------------------
-- 3. Phone verification requests
-- ---------------------------------------------------------------------------
create table if not exists public.phone_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  referral_id uuid not null references public.referrals(id) on delete cascade,
  phone_country_code text not null,
  phone text not null,
  phone_normalized text not null,
  verification_code text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists phone_verif_user_idx on public.phone_verification_requests (user_id);
create index if not exists phone_verif_referral_idx on public.phone_verification_requests (referral_id);

-- ---------------------------------------------------------------------------
-- 4. Verified phones registry (one phone = one referral reward, ever)
-- ---------------------------------------------------------------------------
create table if not exists public.verified_phones (
  id uuid primary key default gen_random_uuid(),
  phone_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  verified_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. Promo codes
-- ---------------------------------------------------------------------------
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete set null,
  discount_percent integer not null default 5 check (discount_percent > 0 and discount_percent <= 100),
  status text not null default 'active'
    check (status in ('active', 'redeemed')),
  redeemed_at timestamptz,
  booking_request_id uuid references public.booking_requests(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists promo_codes_owner_idx on public.promo_codes (owner_id);
create index if not exists promo_codes_code_idx on public.promo_codes (code);

-- ---------------------------------------------------------------------------
-- 6. Add promo_code_id to booking_requests for tracking redemption
-- ---------------------------------------------------------------------------
alter table public.booking_requests
  add column if not exists promo_code_id uuid references public.promo_codes(id) on delete set null;

-- ---------------------------------------------------------------------------
-- 7. RLS policies
-- ---------------------------------------------------------------------------

-- Referrals: users can see their own (as referrer or referred)
alter table public.referrals enable row level security;

create policy "Users can read own referrals"
  on public.referrals for select
  using (referrer_id = auth.uid() or referred_id = auth.uid());

-- Phone verification: users can see their own requests
alter table public.phone_verification_requests enable row level security;

create policy "Users can read own phone verifications"
  on public.phone_verification_requests for select
  using (user_id = auth.uid());

create policy "Users can create phone verifications"
  on public.phone_verification_requests for insert
  with check (user_id = auth.uid());

-- Verified phones: no direct user access (admin only)
alter table public.verified_phones enable row level security;

-- Promo codes: users can see their own
alter table public.promo_codes enable row level security;

create policy "Users can read own promo codes"
  on public.promo_codes for select
  using (owner_id = auth.uid());
