"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink,
  CreditCard,
  Send,
  CircleDollarSign
} from "lucide-react";
import {
  airportDirectionLabel,
  communicationLabel,
  formatStaffAmount,
  formatStaffDate,
  paymentMethodLabel,
  paymentStatusLabel,
  serviceLabel,
  statusLabel,
  TERMINAL_STATUSES,
  yesNoLabel
} from "@/lib/staff/labels";

type Vehicle = {
  id: string;
  name: string;
  slug: string;
  passengers: number;
  luggage: number;
};

type Booking = {
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
  assigned_vehicle_name?: string;
  payment_status: string | null;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_link_url: string | null;
  paid_at: string | null;
  created_at: string;
};

type Props = {
  bookings: Booking[];
  vehicles: Vehicle[];
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-300",
  contacted: "bg-yellow-500/20 text-yellow-300",
  confirmed: "bg-green-500/20 text-green-300",
  completed: "bg-white/10 text-white/50",
  cancelled: "bg-red-500/20 text-red-300",
  archived: "bg-white/5 text-white/30"
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300",
  paid: "bg-green-500/20 text-green-300",
  failed: "bg-red-500/20 text-red-300",
  expired: "bg-white/10 text-white/40",
  cancelled: "bg-red-500/20 text-red-300"
};

const statusBadge = (booking: Booking, historicalSection: boolean) => {
  return {
    label: statusLabel(booking.status, historicalSection),
    className:
      historicalSection && !TERMINAL_STATUSES.has(booking.status)
        ? "bg-white/10 text-white/50"
        : STATUS_COLORS[booking.status] ?? "bg-white/10 text-white/50"
  };
};

export default function StaffDashboard({ bookings: initialBookings, vehicles }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmResult, setConfirmResult] = useState<Record<string, "success" | "error">>({});

  // Payment link state
  const [paymentAmount, setPaymentAmount] = useState<Record<string, string>>({});
  const [sendingPayment, setSendingPayment] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<Record<string, "success" | "error">>({});

  // Complete booking state
  const [completing, setCompleting] = useState<string | null>(null);
  const [completeResult, setCompleteResult] = useState<Record<string, "success" | "error" | "loyalty">>({});

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => new Date(b.pickup_at) >= now && b.status !== "completed" && b.status !== "cancelled" && b.status !== "archived"
  );
  const past = bookings.filter(
    (b) => new Date(b.pickup_at) < now || b.status === "completed" || b.status === "cancelled" || b.status === "archived"
  );

  const handleConfirm = async (bookingId: string) => {
    const vehicleId = selectedVehicle[bookingId];
    if (!vehicleId) return;

    setConfirming(bookingId);
    setConfirmResult((prev) => ({ ...prev, [bookingId]: undefined as any }));

    const finalPrice = paymentAmount[bookingId] ? parseFloat(paymentAmount[bookingId]) : undefined;

    try {
      const res = await fetch("/api/staff/confirm-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, vehicleId, finalPrice })
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmResult((prev) => ({ ...prev, [bookingId]: "success" }));
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        setBookings((prev) =>
          prev.map((b) => {
            if (b.id !== bookingId) return b;
            const updated: Booking = {
              ...b,
              status: "confirmed",
              assigned_vehicle_id: vehicleId,
              assigned_vehicle_name: vehicle?.name
            };
            if (data.paymentLinkUrl) {
              updated.payment_status = "pending";
              updated.payment_amount = finalPrice ? Math.round(finalPrice * 100) : b.payment_amount;
              updated.payment_currency = "EUR";
              updated.payment_link_url = data.paymentLinkUrl;
            }
            return updated;
          })
        );
      } else {
        setConfirmResult((prev) => ({ ...prev, [bookingId]: "error" }));
      }
    } catch {
      setConfirmResult((prev) => ({ ...prev, [bookingId]: "error" }));
    } finally {
      setConfirming(null);
    }
  };

  const handleSendPaymentLink = async (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    const amountStr = paymentAmount[bookingId];
    const amount = amountStr ? parseFloat(amountStr) : booking?.price_estimate?.totalPrice;
    if (!amount || amount <= 0) return;

    setSendingPayment(bookingId);
    setPaymentResult((prev) => ({ ...prev, [bookingId]: undefined as any }));

    try {
      const res = await fetch("/api/staff/send-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, amount })
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentResult((prev) => ({ ...prev, [bookingId]: "success" }));
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  payment_status: "pending",
                  payment_amount: Math.round(amount * 100),
                  payment_currency: "EUR",
                  payment_link_url: data.paymentLinkUrl
                }
              : b
          )
        );
      } else {
        setPaymentResult((prev) => ({ ...prev, [bookingId]: "error" }));
      }
    } catch {
      setPaymentResult((prev) => ({ ...prev, [bookingId]: "error" }));
    } finally {
      setSendingPayment(null);
    }
  };

  const handleComplete = async (bookingId: string) => {
    setCompleting(bookingId);
    setCompleteResult((prev) => ({ ...prev, [bookingId]: undefined as any }));

    try {
      const res = await fetch("/api/staff/complete-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId })
      });

      if (res.ok) {
        const data = await res.json();
        setCompleteResult((prev) => ({
          ...prev,
          [bookingId]: data.loyaltyCodeGenerated ? "loyalty" : "success"
        }));
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: "completed" } : b))
        );
      } else {
        const data = await res.json();
        if (data.error === "already_completed") {
          setCompleteResult((prev) => ({ ...prev, [bookingId]: "success" }));
        } else {
          setCompleteResult((prev) => ({ ...prev, [bookingId]: "error" }));
        }
      }
    } catch {
      setCompleteResult((prev) => ({ ...prev, [bookingId]: "error" }));
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="space-y-10">
      <BookingSection
        title="Aktivne i predstojeće"
        count={upcoming.length}
        bookings={upcoming}
        vehicles={vehicles}
        expandedId={expandedId}
        onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
        selectedVehicle={selectedVehicle}
        onVehicleChange={(bookingId, vehicleId) =>
          setSelectedVehicle((prev) => ({ ...prev, [bookingId]: vehicleId }))
        }
        onConfirm={handleConfirm}
        confirming={confirming}
        confirmResult={confirmResult}
        paymentAmount={paymentAmount}
        onPaymentAmountChange={(bookingId, val) =>
          setPaymentAmount((prev) => ({ ...prev, [bookingId]: val }))
        }
        onSendPaymentLink={handleSendPaymentLink}
        sendingPayment={sendingPayment}
        paymentResult={paymentResult}
        showActions
        historicalSection={false}
        onComplete={handleComplete}
        completing={completing}
        completeResult={completeResult}
      />

      <BookingSection
        title="Prethodne i završene"
        count={past.length}
        bookings={past}
        vehicles={vehicles}
        expandedId={expandedId}
        onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
        selectedVehicle={selectedVehicle}
        onVehicleChange={() => {}}
        onConfirm={() => {}}
        confirming={null}
        confirmResult={confirmResult}
        paymentAmount={{}}
        onPaymentAmountChange={() => {}}
        onSendPaymentLink={() => {}}
        sendingPayment={null}
        paymentResult={{}}
        showActions={false}
        historicalSection
        onComplete={handleComplete}
        completing={completing}
        completeResult={completeResult}
      />
    </div>
  );
}

function BookingSection({
  title,
  count,
  bookings,
  vehicles,
  expandedId,
  onToggle,
  selectedVehicle,
  onVehicleChange,
  onConfirm,
  confirming,
  confirmResult,
  paymentAmount,
  onPaymentAmountChange,
  onSendPaymentLink,
  sendingPayment,
  paymentResult,
  showActions,
  historicalSection,
  onComplete,
  completing,
  completeResult
}: {
  title: string;
  count: number;
  bookings: Booking[];
  vehicles: Vehicle[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  selectedVehicle: Record<string, string>;
  onVehicleChange: (bookingId: string, vehicleId: string) => void;
  onConfirm: (bookingId: string) => void;
  confirming: string | null;
  confirmResult: Record<string, "success" | "error">;
  paymentAmount: Record<string, string>;
  onPaymentAmountChange: (bookingId: string, value: string) => void;
  onSendPaymentLink: (bookingId: string) => void;
  sendingPayment: string | null;
  paymentResult: Record<string, "success" | "error">;
  showActions: boolean;
  historicalSection: boolean;
  onComplete: (bookingId: string) => void;
  completing: string | null;
  completeResult: Record<string, "success" | "error" | "loyalty">;
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold mb-3">
        {title}{" "}
        <span className="text-sm font-normal text-white/40">({count})</span>
      </h2>

      {bookings.length === 0 ? (
        <p className="text-sm text-white/40 py-4">Nema rezervacija u ovoj sekciji.</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => {
            const isOpen = expandedId === b.id;
            const isConfirmed = b.status === "confirmed" || b.status === "completed";
            const cResult = confirmResult[b.id];
            const pResult = paymentResult[b.id];
            const hasPaymentLink = !!b.payment_link_url;
            const displayStatus = statusBadge(b, historicalSection);

            return (
              <div key={b.id} className="glass rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => onToggle(b.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white/90">
                        {b.full_name}
                      </span>
                      <span className="text-xs text-white/50">
                        {serviceLabel(b.service)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${displayStatus.className}`}>
                        {displayStatus.label}
                      </span>
                      {b.payment_status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${PAYMENT_STATUS_COLORS[b.payment_status] ?? "bg-white/10 text-white/40"}`}>
                          <CreditCard className="h-3 w-3" />
                          {paymentStatusLabel(b.payment_status)}
                          {b.payment_status === "paid" && b.payment_amount && b.payment_currency
                            ? ` · ${formatStaffAmount(b.payment_amount, b.payment_currency)}`
                            : ""}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-white/40 truncate">
                      {formatStaffDate(b.pickup_at)} &middot; {b.pickup} &rarr; {b.destination}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-white/40" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-white/5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <Row label="ID rezervacije" value={b.id} />
                      <Row label="Usluga" value={serviceLabel(b.service)} />
                      {b.airport_direction && <Row label="Smer" value={airportDirectionLabel(b.airport_direction)} />}
                      <Row label="Polazak" value={b.pickup} />
                      <Row label="Odredište" value={b.destination} />
                      <Row label="Vreme" value={formatStaffDate(b.pickup_at)} />
                      <Row label="Putnici" value={String(b.passengers)} />
                      <Row label="Prtljag" value={String(b.luggage)} />
                      <Row label="Wi-Fi" value={yesNoLabel(b.wifi_requested)} />
                      {b.flight_number && <Row label="Let" value={b.flight_number} />}
                      {b.waiting_hours > 0 && <Row label="Čekanje" value={`${b.waiting_hours}h`} />}
                      <Row label="Ime" value={b.full_name} />
                      {b.email && <Row label="Email" value={b.email} />}
                      <Row label="Telefon" value={[b.phone_country_code, b.phone].filter(Boolean).join(" ")} />
                      {b.company_name && <Row label="Kompanija" value={b.company_name} />}
                      {b.preferred_communication && <Row label="Preferirani kontakt" value={communicationLabel(b.preferred_communication)} />}
                      <Row label="Način plaćanja" value={paymentMethodLabel(b.payment_method)} />
                      {b.price_estimate?.totalPrice != null && (
                        <Row label="Procena" value={`${b.price_estimate.totalPrice} ${b.price_estimate.currency ?? "EUR"}`} />
                      )}
                      <Row label="Kreirano" value={formatStaffDate(b.created_at)} />
                      {b.assigned_vehicle_name && <Row label="Vozilo" value={b.assigned_vehicle_name} />}
                      {b.payment_status && (
                        <Row label="Status plaćanja" value={paymentStatusLabel(b.payment_status)} />
                      )}
                      {b.payment_amount != null && b.payment_currency && (
                        <Row label="Iznos plaćanja" value={formatStaffAmount(b.payment_amount, b.payment_currency)} />
                      )}
                      {b.paid_at && (
                        <Row label="Plaćeno" value={formatStaffDate(b.paid_at)} />
                      )}
                    </div>

                    {b.message && (
                      <div className="text-sm">
                        <span className="text-white/50">Napomene:</span>
                        <p className="mt-1 text-white/70 whitespace-pre-wrap">{b.message}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={`/staff/bookings/${b.id}`}
                        className="text-xs text-gold-400 hover:text-gold-300 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Detaljan pregled
                      </a>
                      {b.payment_link_url && (
                        <a
                          href={b.payment_link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gold-400 hover:text-gold-300 inline-flex items-center gap-1"
                        >
                          <CreditCard className="h-3 w-3" /> Link za plaćanje
                        </a>
                      )}
                    </div>

                    {/* Dodela vozila i cena za nepotvrđene rezervacije */}
                    {showActions && !isConfirmed && (
                      <div className="border-t border-white/5 pt-4 space-y-3">
                        <div>
                          <label htmlFor={`vehicle-${b.id}`} className="block text-xs text-white/50 mb-1.5">
                            Dodeli vozilo
                          </label>
                          <select
                            id={`vehicle-${b.id}`}
                            value={selectedVehicle[b.id] ?? ""}
                            onChange={(e) => onVehicleChange(b.id, e.target.value)}
                            className="glass-input w-full sm:w-auto sm:min-w-[280px] text-sm"
                          >
                            <option value="">Izaberi vozilo...</option>
                            {vehicles.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.passengers} putnika, {v.luggage} prtljag)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <label htmlFor={`amount-${b.id}`} className="text-xs text-white/50">
                            Konačna cena (EUR):
                          </label>
                          <input
                            id={`amount-${b.id}`}
                            type="number"
                            step="0.01"
                            min="1"
                            placeholder={b.price_estimate?.totalPrice ? String(b.price_estimate.totalPrice) : ""}
                            value={paymentAmount[b.id] ?? ""}
                            onChange={(e) => onPaymentAmountChange(b.id, e.target.value)}
                            className="glass-input w-28 text-sm"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onConfirm(b.id)}
                            disabled={!selectedVehicle[b.id] || confirming === b.id}
                            className="btn-gold text-sm px-4 py-2 inline-flex items-center gap-2 disabled:opacity-40"
                          >
                            {confirming === b.id ? "..." : (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Potvrdi i pošalji email
                              </>
                            )}
                          </button>
                          {cResult === "success" && (
                            <span className="text-xs text-green-400">
                              {b.payment_method === "card" ? "Potvrđeno! Email sa linkom za plaćanje je poslat." : "Potvrđeno! Email je poslat."}
                            </span>
                          )}
                          {cResult === "error" && (
                            <span className="text-xs text-red-400">Neuspešno.</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Potvrđena rezervacija */}
                    {isConfirmed && b.assigned_vehicle_name && (
                      <div className="border-t border-white/5 pt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                          <Check className="h-3.5 w-3.5" />
                          Potvrđeno — {b.assigned_vehicle_name}
                          {b.payment_status === "paid" && " · Plaćeno"}
                          {hasPaymentLink && b.payment_status === "pending" && " · Čeka se uplata"}
                        </span>
                      </div>
                    )}

                    {/* Mark as completed button */}
                    {b.status === "confirmed" && (
                      <div className="border-t border-white/5 pt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onComplete(b.id)}
                          disabled={completing === b.id}
                          className="rounded-lg bg-green-500/20 px-4 py-2 text-sm text-green-300 hover:bg-green-500/30 transition-colors disabled:opacity-40 inline-flex items-center gap-2"
                        >
                          {completing === b.id ? "..." : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Označi kao završeno
                            </>
                          )}
                        </button>
                        {completeResult[b.id] === "success" && (
                          <span className="text-xs text-green-400">Završeno!</span>
                        )}
                        {completeResult[b.id] === "loyalty" && (
                          <span className="text-xs text-gold-400">Završeno! Loyalty kod je generisan.</span>
                        )}
                        {completeResult[b.id] === "error" && (
                          <span className="text-xs text-red-400">Neuspešno.</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-white/40 shrink-0">{label}:</span>
      <span className="text-white/80 break-all">{value}</span>
    </div>
  );
}
