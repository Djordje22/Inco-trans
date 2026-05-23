import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const cookieStore = cookies();
  const userClient = createServerClient(url, anonKey!, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      }
    }
  });

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
  }

  // Fetch bookings matching the user's account ID or their email address.
  // This ensures older bookings created before account-linking are still visible.
  const { data, error } = await supabase
    .from("booking_requests")
    .select("id, service, pickup, destination, pickup_at, status, full_name, email, phone, passengers, luggage, wifi_requested, flight_number, waiting_hours, message, payment_method, price_estimate, assigned_vehicle_id, created_at")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .order("pickup_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch user bookings:", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }

  return NextResponse.json({ bookings: data ?? [] });
}
