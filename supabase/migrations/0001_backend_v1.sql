create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'admin');
create type public.booking_service as enum ('airport', 'chauffeur', 'business', 'other');
create type public.airport_direction as enum ('from', 'to');
create type public.request_source as enum ('quote_form', 'reservation_modal', 'handle_everything');
create type public.request_status as enum ('new', 'contacted', 'confirmed', 'completed', 'cancelled', 'archived');
create type public.preferred_communication as enum ('phone_sms', 'viber_whatsapp', 'email');
create type public.payment_method as enum ('card', 'cash');
create type public.contact_source as enum ('contact_page', 'reservation_modal');
create type public.media_kind as enum ('image', 'video');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline jsonb not null default '{}'::jsonb,
  image_url text,
  passengers integer not null check (passengers between 1 and 20),
  luggage integer not null default 0 check (luggage between 0 and 20),
  transmission jsonb not null default '{}'::jsonb,
  fuel jsonb not null default '{}'::jsonb,
  comfort jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicle_media (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  kind public.media_kind not null,
  bucket text not null,
  object_path text not null,
  alt_text jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('sr', 'en', 'ru')),
  source public.request_source not null,
  status public.request_status not null default 'new',
  service public.booking_service not null,
  airport_direction public.airport_direction,
  pickup text not null,
  destination text not null,
  waiting_hours integer not null default 0 check (waiting_hours between 0 and 24),
  pickup_at timestamptz not null,
  passengers integer not null check (passengers between 1 and 20),
  luggage integer not null default 0 check (luggage between 0 and 4),
  wifi_requested boolean not null default true,
  flight_number text,
  vehicle_slug text,
  full_name text not null,
  email text,
  phone_country_code text,
  phone text not null,
  company_name text,
  preferred_communication public.preferred_communication,
  payment_method public.payment_method not null default 'cash',
  pickup_place jsonb,
  destination_place jsonb,
  route_distance_meters integer,
  route_duration_seconds integer,
  price_estimate jsonb,
  message text,
  terms_accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_stops (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  position integer not null check (position > 0),
  value text not null,
  place jsonb,
  created_at timestamptz not null default now(),
  unique (booking_request_id, position)
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('sr', 'en', 'ru')),
  source public.contact_source not null default 'contact_page',
  status public.request_status not null default 'new',
  full_name text not null,
  email text,
  phone_country_code text,
  phone text,
  preferred_communication public.preferred_communication,
  company_name text,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index booking_requests_created_at_idx on public.booking_requests (created_at desc);
create index booking_requests_status_idx on public.booking_requests (status);
create index booking_requests_service_idx on public.booking_requests (service);
create index booking_requests_pickup_at_idx on public.booking_requests (pickup_at);
create index contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index contact_messages_status_idx on public.contact_messages (status);
create index vehicle_media_vehicle_id_idx on public.vehicle_media (vehicle_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger vehicles_set_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

create trigger booking_requests_set_updated_at
before update on public.booking_requests
for each row execute function public.set_updated_at();

create trigger contact_messages_set_updated_at
before update on public.contact_messages
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_media enable row level security;
alter table public.booking_requests enable row level security;
alter table public.booking_stops enable row level security;
alter table public.contact_messages enable row level security;
alter table public.admin_audit_log enable row level security;

create policy "Profiles can read self"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "Admins manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read published vehicles"
on public.vehicles for select
using (is_published = true);

create policy "Admins manage vehicles"
on public.vehicles for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read published vehicle media"
on public.vehicle_media for select
using (
  is_published = true
  and exists (
    select 1
    from public.vehicles
    where vehicles.id = vehicle_media.vehicle_id
      and vehicles.is_published = true
  )
);

create policy "Admins manage vehicle media"
on public.vehicle_media for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins read booking requests"
on public.booking_requests for select
using (public.is_admin());

create policy "Admins update booking requests"
on public.booking_requests for update
using (public.is_admin())
with check (public.is_admin());

create policy "Public can create booking requests"
on public.booking_requests for insert
with check (true);

create policy "Admins manage booking stops"
on public.booking_stops for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can create booking stops"
on public.booking_stops for insert
with check (true);

create policy "Admins read contact messages"
on public.contact_messages for select
using (public.is_admin());

create policy "Admins update contact messages"
on public.contact_messages for update
using (public.is_admin())
with check (public.is_admin());

create policy "Public can create contact messages"
on public.contact_messages for insert
with check (true);

create policy "Admins read audit log"
on public.admin_audit_log for select
using (public.is_admin());

insert into public.vehicles (
  slug,
  name,
  tagline,
  image_url,
  passengers,
  luggage,
  transmission,
  fuel,
  comfort,
  sort_order
) values
(
  'mercedes-e-class',
  'Mercedes E Class',
  '{"sr":"Poslovna limuzina za šofer servis i transfere","en":"Executive sedan for chauffeur service and transfers","ru":"Бизнес-седан для шофёр-сервиса и трансферов"}',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80',
  4,
  3,
  '{"sr":"Automatik","en":"Automatic","ru":"Автомат"}',
  '{"sr":"Dizel","en":"Diesel","ru":"Дизель"}',
  '{"sr":["Profesionalni šofer","Kožna sedišta i klima","Voda i Wi-Fi na zahtev","Diskretan i tih enterijer"],"en":["Professional chauffeur","Leather seats and climate control","Bottled water and Wi-Fi on request","Discreet, quiet cabin"],"ru":["Профессиональный шофёр","Кожаный салон и климат-контроль","Вода и Wi-Fi по запросу","Тихий, комфортный салон"]}',
  1
),
(
  'audi-a6',
  'Audi A6',
  '{"sr":"Premium limuzina za aerodromske transfere i duže vožnje","en":"Premium sedan for airport transfers and longer rides","ru":"Премиальный седан для трансферов из аэропорта и дальних поездок"}',
  'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1600&q=80',
  4,
  4,
  '{"sr":"Automatik","en":"Automatic","ru":"Автомат"}',
  '{"sr":"Dizel","en":"Diesel","ru":"Дизель"}',
  '{"sr":["Profesionalni šofer","Udobna limuzina za aerodromske transfere","Kožna sedišta i klima","Voda i Wi-Fi na zahtev"],"en":["Professional chauffeur","Comfortable sedan for airport transfers","Leather seats and climate control","Bottled water and Wi-Fi on request"],"ru":["Профессиональный шофёр","Комфортный седан для трансферов из аэропорта","Кожаный салон и климат-контроль","Вода и Wi-Fi по запросу"]}',
  2
)
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-media', 'site-media', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
  ('admin-uploads', 'admin-uploads', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'])
on conflict (id) do nothing;

create policy "Public can read site media"
on storage.objects for select
using (bucket_id = 'site-media');

create policy "Admins manage site media"
on storage.objects for all
using (bucket_id = 'site-media' and public.is_admin())
with check (bucket_id = 'site-media' and public.is_admin());

create policy "Admins manage private uploads"
on storage.objects for all
using (bucket_id = 'admin-uploads' and public.is_admin())
with check (bucket_id = 'admin-uploads' and public.is_admin());
