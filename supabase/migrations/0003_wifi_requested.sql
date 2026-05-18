alter table public.booking_requests
add column if not exists wifi_requested boolean not null default true;

alter table public.booking_requests
drop constraint if exists booking_requests_luggage_check;

alter table public.booking_requests
add constraint booking_requests_luggage_check check (luggage between 0 and 4);
