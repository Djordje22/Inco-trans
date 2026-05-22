-- =============================================================================
-- 0007_payment_tracking.sql — Payment tracking fields for Adyen Pay by Link.
-- Booking remains unpaid until the webhook confirms payment.
-- =============================================================================

-- Payment status lifecycle: null → pending → paid | failed | expired | cancelled
create type public.payment_status as enum ('pending', 'paid', 'failed', 'expired', 'cancelled');

alter table public.booking_requests
  add column if not exists payment_provider text,           -- e.g. 'adyen'
  add column if not exists payment_provider_ref text,       -- Adyen pspReference or paymentLink id
  add column if not exists payment_link_url text,           -- The hosted checkout URL sent to customer
  add column if not exists payment_status public.payment_status,
  add column if not exists payment_amount integer,          -- Amount in minor units (e.g. cents)
  add column if not exists payment_currency text default 'EUR',
  add column if not exists paid_at timestamptz;

create index if not exists booking_requests_payment_provider_ref_idx
  on public.booking_requests (payment_provider_ref);
