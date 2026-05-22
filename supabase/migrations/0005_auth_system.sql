-- =============================================================================
-- 0005_auth_system.sql — Auth system: profile fields, user_id on bookings,
-- staff access links, security events, RLS, and profile-creation trigger.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend profiles with contact/company fields
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists email text,
  add column if not exists phone_country_code text,
  add column if not exists phone text,
  add column if not exists company_name text,
  add column if not exists company_vat_number text,
  add column if not exists company_address text;

-- ---------------------------------------------------------------------------
-- 2. Add user_id + company fields to booking_requests
-- ---------------------------------------------------------------------------
alter table public.booking_requests
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists company_vat_number text,
  add column if not exists company_address text;

create index if not exists booking_requests_user_id_idx
  on public.booking_requests (user_id);

-- ---------------------------------------------------------------------------
-- 3. Add company fields to contact_messages
-- ---------------------------------------------------------------------------
alter table public.contact_messages
  add column if not exists company_vat_number text,
  add column if not exists company_address text;

-- ---------------------------------------------------------------------------
-- 4. Staff access links
-- ---------------------------------------------------------------------------
create table if not exists public.staff_access_links (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  token_hash text not null,
  jti_hash text not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_access_links_booking_idx
  on public.staff_access_links (booking_request_id);
create index if not exists staff_access_links_jti_hash_idx
  on public.staff_access_links (jti_hash);

alter table public.staff_access_links enable row level security;

-- Staff access links are only accessed via service role (server-side).
-- No public or user RLS policies needed.

-- ---------------------------------------------------------------------------
-- 5. Staff login attempts (rate limiting + audit)
-- ---------------------------------------------------------------------------
create table if not exists public.staff_login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  email text,
  token_jti_hash text,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists staff_login_attempts_ip_idx
  on public.staff_login_attempts (ip_address, created_at desc);

alter table public.staff_login_attempts enable row level security;

-- ---------------------------------------------------------------------------
-- 6. Updated_at trigger for staff_access_links
-- ---------------------------------------------------------------------------
create trigger staff_access_links_set_updated_at
  before update on public.staff_access_links
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. RLS: Customers can read/update their own profile
-- ---------------------------------------------------------------------------
create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 8. RLS: Customers can read their own bookings (by user_id)
-- ---------------------------------------------------------------------------
create policy "Users can read own booking requests"
  on public.booking_requests for select
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 9. RLS: Booking stops readable through owned booking requests
-- ---------------------------------------------------------------------------
create policy "Users can read own booking stops"
  on public.booking_stops for select
  using (
    exists (
      select 1 from public.booking_requests br
      where br.id = booking_stops.booking_request_id
        and br.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 10. Profile creation trigger for new Supabase Auth users
-- ---------------------------------------------------------------------------
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
begin
  raw_meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_email := new.email;
  v_first_name := raw_meta ->> 'first_name';
  v_last_name := raw_meta ->> 'last_name';

  -- Google OAuth provides full_name or name
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

  insert into public.profiles (id, role, full_name, first_name, last_name, email)
  values (
    new.id,
    'customer',
    coalesce(v_full_name, trim(coalesce(v_first_name, '') || ' ' || coalesce(v_last_name, ''))),
    v_first_name,
    v_last_name,
    v_email
  )
  on conflict (id) do update set
    first_name = coalesce(profiles.first_name, excluded.first_name),
    last_name = coalesce(profiles.last_name, excluded.last_name),
    email = coalesce(excluded.email, profiles.email),
    full_name = coalesce(profiles.full_name, excluded.full_name);

  return new;
end;
$$;

-- Drop if exists so we can recreate cleanly
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
