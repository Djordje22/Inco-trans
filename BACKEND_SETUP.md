# Inco Trans Backend Setup

The app now uses Supabase through Next.js API routes. You do not run a separate custom backend server; `npm run dev` runs the frontend and the API routes together.

## What Is Already Set Up

- Supabase local config: `supabase/config.toml`
- Database/storage migration: `supabase/migrations/0001_backend_v1.sql`
- API routes:
  - `POST /api/booking-requests`
  - `POST /api/contact-messages`
- Environment template: `.env.example`

## Local Supabase Test Setup

1. Open Docker Desktop and wait until Docker is running.
2. Start Supabase locally:

```bash
npm run supabase:start
```

3. Print local Supabase keys:

```bash
npm run supabase:status
```

4. Create `.env.local` from `.env.example` and fill it with the local values from the status output:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local_anon_key_from_status
NEXT_PUBLIC_SUPABASE_ANON_KEY=local_anon_key_from_status
SUPABASE_SERVICE_ROLE_KEY=local_service_role_key_from_status
```

5. Start the Next app:

```bash
npm run dev
```

6. Submit the quote form, contact form, or reservation modal.

7. Open local Supabase Studio, usually:

```text
http://127.0.0.1:54323
```

Check:
- `booking_requests`
- `booking_stops`
- `contact_messages`

## Delete Test Data

In Supabase Studio SQL editor:

```sql
delete from booking_stops;
delete from booking_requests;
delete from contact_messages;
```

Delete `booking_stops` first because it references `booking_requests`.

## Production Supabase Setup

1. Create a Supabase cloud project.
2. Open SQL Editor.
3. Run `supabase/migrations/0001_backend_v1.sql`.
4. Copy these from Project Settings -> API:
   - Project URL
   - anon public key
   - service_role key
5. Add them to the frontend host environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` is optional for public form inserts because RLS allows insert-only writes. Add it later for admin/server management features. Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code. It must only be set as a server-side environment variable on the host.

## Reservation Emails

Booking requests are saved first. If the request includes an email address and email env vars are configured, the API sends a reservation-request receipt to the customer. It also sends an admin notification with the booking details.

Recommended provider: Resend.

Add these environment variables locally and in production:

```bash
RESEND_API_KEY=your_resend_api_key
RESERVATION_EMAIL_FROM="Inco Trans <reservations@your-domain.com>"
RESERVATION_EMAIL_REPLY_TO=your_contact_email
RESERVATION_ADMIN_EMAIL=admin_notification_email
```

Until these are configured, bookings still save to Supabase, but `emailSent` and `adminEmailSent` can be `false` in the API response. If `RESERVATION_ADMIN_EMAIL` is not set, admin notifications fall back to `RESERVATION_EMAIL_REPLY_TO`.

## Google Address Autocomplete + Route Estimates

The reservation modal can use Google Maps Platform for address suggestions and route-based estimates. Add this environment variable locally and in production:

```bash
GOOGLE_MAPS_API_KEY=your_google_maps_server_key
```

Enable these Google Maps Platform APIs for that key:

- Places API
- Routes API

If the key is missing, billing/quota is exhausted, or Google returns an error, users can still enter addresses manually and submit the booking. In that fallback state the review step hides the automatic price estimate, and the team confirms the final price manually.

## Current Blocker

Local startup requires Docker Desktop to be running. Cloud setup requires access to the client's Supabase account/project keys.
