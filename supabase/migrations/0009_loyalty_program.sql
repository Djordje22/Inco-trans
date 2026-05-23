-- =============================================================================
-- 0009_loyalty_program.sql — Loyalty program: every 5th completed ride earns
-- a free-ride promo code (airport/business, up to 25km).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add promo_type and loyalty_milestone to promo_codes
-- ---------------------------------------------------------------------------
alter table public.promo_codes
  add column if not exists promo_type text not null default 'referral_percent'
    check (promo_type in ('referral_percent', 'loyalty_free_ride')),
  add column if not exists loyalty_milestone integer;

-- Widen discount_percent constraint to allow 100 for loyalty codes
-- (existing constraint already allows up to 100, so no change needed)

-- Update the status check to include new promo_type values
-- (no constraint change needed, status stays 'active'/'redeemed')
