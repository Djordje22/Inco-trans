import { redirect } from "next/navigation";
import { getStaffSession, getStaffDashboardSession } from "@/lib/staff/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  airportDirectionLabel,
  communicationLabel,
  formatStaffDate,
  paymentMethodLabel,
  serviceLabel,
  statusLabel,
  yesNoLabel
} from "@/lib/staff/labels";

export const metadata = { title: "Detalji rezervacije — Administracija", robots: "noindex" };

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
  assigned_vehicle_id: string | null;
  created_at: string;
};

type StopRow = {
  position: number;
  value: string;
};

export default async function StaffBookingPage({ params }: Props) {
  // Accept either per-booking session or dashboard session
  const session = getStaffSession();
  const dashboardSession = getStaffDashboardSession();

  if (session && session.bookingId === params.id) {
    // OK — per-booking access
  } else if (dashboardSession) {
    // OK — dashboard-wide access
  } else {
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold">Detalji rezervacije</h1>
            <p className="text-sm text-white/50">ID: {b.id}</p>
          </div>
          {dashboardSession && (
            <a
              href="/staff/dashboard"
              className="text-sm text-gold-400 hover:text-gold-300"
            >
              &larr; Nazad na administraciju
            </a>
          )}
        </div>

        <div className="glass rounded-2xl p-6 space-y-6">
          <Section title="Usluga">
            <Row label="Tip" value={serviceLabel(b.service)} />
            {b.airport_direction && (
              <Row label="Smer" value={airportDirectionLabel(b.airport_direction)} />
            )}
            <Row label="Status" value={statusLabel(b.status, new Date(b.pickup_at) < new Date())} />
            <Row label="Kreirano" value={formatStaffDate(b.created_at)} />
          </Section>

          <Section title="Vožnja">
            <Row label="Polazak" value={b.pickup} />
            <Row label="Odredište" value={b.destination} />
            {(stops as StopRow[] | null)?.map((s) => (
              <Row key={s.position} label={`Stanica ${s.position}`} value={s.value} />
            ))}
            <Row label="Vreme" value={formatStaffDate(b.pickup_at)} />
            <Row label="Putnici" value={String(b.passengers)} />
            <Row label="Prtljag" value={String(b.luggage)} />
            {b.flight_number && <Row label="Let" value={b.flight_number} />}
            {b.waiting_hours > 0 && <Row label="Čekanje" value={`${b.waiting_hours}h`} />}
            <Row label="Wi-Fi" value={yesNoLabel(b.wifi_requested)} />
          </Section>

          <Section title="Kontakt">
            <Row label="Ime" value={b.full_name} />
            {b.email && <Row label="Email" value={b.email} />}
            <Row label="Telefon" value={[b.phone_country_code, b.phone].filter(Boolean).join(" ")} />
            {b.company_name && <Row label="Kompanija" value={b.company_name} />}
            {b.preferred_communication && (
              <Row label="Preferirani kontakt" value={communicationLabel(b.preferred_communication)} />
            )}
          </Section>

          <Section title="Plaćanje">
            <Row label="Način plaćanja" value={paymentMethodLabel(b.payment_method)} />
            {b.price_estimate?.totalPrice != null && (
              <Row
                label="Procena"
                value={`${b.price_estimate.totalPrice} ${b.price_estimate.currency ?? "EUR"}`}
              />
            )}
          </Section>

          {b.message && (
            <Section title="Napomene">
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
