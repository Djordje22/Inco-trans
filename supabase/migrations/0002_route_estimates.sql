alter table public.booking_requests
add column if not exists pickup_place jsonb,
add column if not exists destination_place jsonb,
add column if not exists route_distance_meters integer,
add column if not exists route_duration_seconds integer,
add column if not exists price_estimate jsonb;

alter table public.booking_stops
add column if not exists place jsonb;
