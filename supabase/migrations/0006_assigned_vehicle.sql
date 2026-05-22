-- =============================================================================
-- 0006_assigned_vehicle.sql — Add assigned vehicle to booking requests
-- for admin vehicle assignment workflow.
-- =============================================================================

alter table public.booking_requests
  add column if not exists assigned_vehicle_id uuid references public.vehicles(id) on delete set null;

create index if not exists booking_requests_assigned_vehicle_idx
  on public.booking_requests (assigned_vehicle_id);
