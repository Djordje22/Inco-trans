import { redirect } from "next/navigation";
import { getStaffDashboardSession } from "@/lib/staff/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import StaffDashboard from "@/components/staff/StaffDashboard";
import ReferralVerifications from "@/components/staff/ReferralVerifications";
import StaffLogoutButton from "@/components/staff/StaffLogoutButton";

export const metadata = { title: "Administracija — Inco Trans", robots: "noindex" };
export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const session = getStaffDashboardSession();
  if (!session) {
    redirect("/staff/login");
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    redirect("/staff/login");
  }

  // Fetch all bookings with assigned vehicle name
  const { data: bookings } = await supabase
    .from("booking_requests")
    .select("*, vehicles:assigned_vehicle_id(name)")
    .order("pickup_at", { ascending: false });

  // Fetch all published vehicles for the assignment dropdown
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, name, slug, passengers, luggage")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  // Map vehicle name into booking rows
  const mappedBookings = (bookings ?? []).map((b: any) => ({
    ...b,
    assigned_vehicle_name: b.vehicles?.name ?? null,
    vehicles: undefined
  }));

  return (
    <div className="min-h-screen bg-ink-950 text-white p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Administracija</h1>
            <p className="mt-1 text-sm text-white/50">
              Upravljanje zahtevima za rezervacije, dodela vozila i potvrda vožnji.
            </p>
          </div>
          <StaffLogoutButton />
        </div>

        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold mb-4 text-white/80">Referral potvrde</h2>
          <ReferralVerifications />
        </section>

        <StaffDashboard
          bookings={mappedBookings}
          vehicles={vehicles ?? []}
        />
      </div>
    </div>
  );
}
