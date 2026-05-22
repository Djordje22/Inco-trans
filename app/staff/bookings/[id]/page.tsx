import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/staff/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const metadata = { title: "Booking Details — Staff", robots: "noindex" };

type Props = {
  params: { id: string };
};

type BookingRow = {
  id: string;
  service: string;
  airport_direction: string | null;
  pickup: string;
  destination: string;
  pickup_at: string;
  passengers: number;
  luggage: number;
  wifi_requested: boolean;
  flight_number: string | null;
  waiting_hours: number;
  full_name: string;
  email: string | null;
  phone_country_code: string | null;
  phone: string;
  company_name: string | null;
  preferred_communication: string | null;
  payment_method: string;
  message: string | null;
  price_estimate: { totalPrice?: number; currency?: string } | null;
  status: string;
  created_at: string;
};

type StopRow = {
  position: number;
  value: string;
};

const formatDate = (value: string) => {
  const d = new Date(value);
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(d);
};

export default async function StaffBookingPage({ params }: Props) {
  const session = getStaffSession();
  if (!session || session.bookingId !== params.id) {
    redirect("/staff/login?error=invalid");
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) redirect("/staff/login?error=invalid");

  const { data: booking } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!booking) redirect("/staff/login?error=invalid");

  const b = booking as BookingRow;

  const { data: stops } = await supabase
    .from("booking_stops")
    .select("position, value")
    .eq("booking_request_id", params.id)
    .order("position", { ascending: true });

  return (
    <div className="min-h-screen bg-ink-950 text-white p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="font-display text-xl font-semibold">Booking Details</h1>
          <p className="text-sm text-white/50">ID: {b.id}</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-6">
          <Section title="Service">
            <Row label="Type" value={b.service} />
            {b.airport_direction && (
              <Row label="Direction" value={b.airport_direction} />
            )}
            <Row label="Status" value={b.status} />
            <Row label="Created" value={formatDate(b.created_at)} />
          </Section>

          <Section title="Trip">
            <Row label="Pickup" value={b.pickup} />
            <Row label="Destination" value={b.destination} />
            {(stops as StopRow[] | null)?.map((s) => (
              <Row key={s.position} label={`Stop ${s.position}`} value={s.value} />
            ))}
            <Row label="When" value={formatDate(b.pickup_at)} />
            <Row label="Passengers" value={String(b.passengers)} />
            <Row label="Luggage" value={String(b.luggage)} />
            {b.flight_number && <Row label="Flight" value={b.flight_number} />}
            {b.waiting_hours > 0 && <Row label="Waiting" value={`${b.waiting_hours}h`} />}
            <Row label="Wi-Fi" value={b.wifi_requested ? "Yes" : "No"} />
          </Section>

          <Section title="Contact">
            <Row label="Name" value={b.full_name} />
            {b.email && <Row label="Email" value={b.email} />}
            <Row label="Phone" value={[b.phone_country_code, b.phone].filter(Boolean).join(" ")} />
            {b.company_name && <Row label="Company" value={b.company_name} />}
            {b.preferred_communication && (
              <Row label="Preferred" value={b.preferred_communication} />
            )}
          </Section>

          <Section title="Payment">
            <Row label="Method" value={b.payment_method} />
            {b.price_estimate?.totalPrice != null && (
              <Row
                label="Estimate"
                value={`${b.price_estimate.totalPrice} ${b.price_estimate.currency ?? "EUR"}`}
              />
            )}
          </Section>

          {b.message && (
            <Section title="Notes">
              <p className="text-sm text-white/80 whitespace-pre-wrap">{b.message}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="eyebrow mb-2">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-white/50 shrink-0 min-w-[100px]">{label}</span>
      <span className="text-white/85">{value}</span>
    </div>
  );
}
