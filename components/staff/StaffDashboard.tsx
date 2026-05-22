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

const serviceLabel = (service: string) => {
  const labels: Record<string, string> = {
    airport: "Airport transfer",
    chauffeur: "Chauffeur service",
    business: "Long-distance",
    other: "Other"
  };
  return labels[service] ?? service;
};

const formatDate = (value: string) => {
  const d = new Date(value);
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(d);
};

const formatAmount = (amountMinor: number, currency: string) => {
  const value = amountMinor / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value);
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

    try {
      const res = await fetch("/api/staff/confirm-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, vehicleId })
      });

      if (res.ok) {
        setConfirmResult((prev) => ({ ...prev, [bookingId]: "success" }));
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? { ...b, status: "confirmed", assigned_vehicle_id: vehicleId, assigned_vehicle_name: vehicle?.name }
              : b
          )
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
    const amountStr = paymentAmount[bookingId];
    const amount = parseFloat(amountStr);
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

  return (
    <div className="space-y-10">
      <BookingSection
        title="Active & Upcoming"
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
      />

      <BookingSection
        title="Past & Completed"
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
  showActions
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
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold mb-3">
        {title}{" "}
        <span className="text-sm font-normal text-white/40">({count})</span>
      </h2>

      {bookings.length === 0 ? (
        <p className="text-sm text-white/40 py-4">No bookings in this section.</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => {
            const isOpen = expandedId === b.id;
            const isConfirmed = b.status === "confirmed" || b.status === "completed";
            const cResult = confirmResult[b.id];
            const pResult = paymentResult[b.id];
            const canSendPaymentLink = isConfirmed && b.payment_status !== "paid" && b.email;
            const hasPaymentLink = !!b.payment_link_url;

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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? "bg-white/10 text-white/50"}`}>
                        {b.status}
                      </span>
                      {b.payment_status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${PAYMENT_STATUS_COLORS[b.payment_status] ?? "bg-white/10 text-white/40"}`}>
                          <CreditCard className="h-3 w-3" />
                          {b.payment_status}
                          {b.payment_status === "paid" && b.payment_amount && b.payment_currency
                            ? ` · ${formatAmount(b.payment_amount, b.payment_currency)}`
                            : ""}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-white/40 truncate">
                      {formatDate(b.pickup_at)} &middot; {b.pickup} &rarr; {b.destination}
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
                      <Row label="Booking ID" value={b.id} />
                      <Row label="Service" value={serviceLabel(b.service)} />
                      {b.airport_direction && <Row label="Direction" value={b.airport_direction} />}
                      <Row label="Pickup" value={b.pickup} />
                      <Row label="Destination" value={b.destination} />
                      <Row label="When" value={formatDate(b.pickup_at)} />
                      <Row label="Passengers" value={String(b.passengers)} />
                      <Row label="Luggage" value={String(b.luggage)} />
                      <Row label="Wi-Fi" value={b.wifi_requested ? "Yes" : "No"} />
                      {b.flight_number && <Row label="Flight" value={b.flight_number} />}
                      {b.waiting_hours > 0 && <Row label="Waiting" value={`${b.waiting_hours}h`} />}
                      <Row label="Name" value={b.full_name} />
                      {b.email && <Row label="Email" value={b.email} />}
                      <Row label="Phone" value={[b.phone_country_code, b.phone].filter(Boolean).join(" ")} />
                      {b.company_name && <Row label="Company" value={b.company_name} />}
                      {b.preferred_communication && <Row label="Preferred" value={b.preferred_communication} />}
                      <Row label="Payment method" value={b.payment_method} />
                      {b.price_estimate?.totalPrice != null && (
                        <Row label="Estimate" value={`${b.price_estimate.totalPrice} ${b.price_estimate.currency ?? "EUR"}`} />
                      )}
                      <Row label="Created" value={formatDate(b.created_at)} />
                      {b.assigned_vehicle_name && <Row label="Vehicle" value={b.assigned_vehicle_name} />}
                      {b.payment_status && (
                        <Row label="Payment status" value={b.payment_status} />
                      )}
                      {b.payment_amount != null && b.payment_currency && (
                        <Row label="Payment amount" value={formatAmount(b.payment_amount, b.payment_currency)} />
                      )}
                      {b.paid_at && (
                        <Row label="Paid at" value={formatDate(b.paid_at)} />
                      )}
                    </div>

                    {b.message && (
                      <div className="text-sm">
                        <span className="text-white/50">Notes:</span>
                        <p className="mt-1 text-white/70 whitespace-pre-wrap">{b.message}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={`/staff/bookings/${b.id}`}
                        className="text-xs text-gold-400 hover:text-gold-300 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Full view
                      </a>
                      {b.payment_link_url && (
                        <a
                          href={b.payment_link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gold-400 hover:text-gold-300 inline-flex items-center gap-1"
                        >
                          <CreditCard className="h-3 w-3" /> Payment link
                        </a>
                      )}
                    </div>

                    {/* Vehicle assignment — for unconfirmed bookings */}
                    {showActions && !isConfirmed && (
                      <div className="border-t border-white/5 pt-4 space-y-3">
                        <div>
                          <label htmlFor={`vehicle-${b.id}`} className="block text-xs text-white/50 mb-1.5">
                            Assign vehicle
                          </label>
                          <select
                            id={`vehicle-${b.id}`}
                            value={selectedVehicle[b.id] ?? ""}
                            onChange={(e) => onVehicleChange(b.id, e.target.value)}
                            className="glass-input w-full sm:w-auto sm:min-w-[280px] text-sm"
                          >
                            <option value="">Select vehicle...</option>
                            {vehicles.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.passengers} pax, {v.luggage} bags)
                              </option>
                            ))}
                          </select>
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
                                Confirm & Send Email
                              </>
                            )}
                          </button>

                          {cResult === "success" && (
                            <span className="text-xs text-green-400">Confirmed! Email sent.</span>
                          )}
                          {cResult === "error" && (
                            <span className="text-xs text-red-400">Failed. Try again.</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Confirmed status badge */}
                    {isConfirmed && b.assigned_vehicle_name && !canSendPaymentLink && (
                      <div className="border-t border-white/5 pt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                          <Check className="h-3.5 w-3.5" />
                          Confirmed — {b.assigned_vehicle_name}
                          {b.payment_status === "paid" && " · Paid"}
                        </span>
                      </div>
                    )}

                    {/* Payment link section — for confirmed bookings that need payment */}
                    {showActions && canSendPaymentLink && (
                      <div className="border-t border-white/5 pt-4 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-green-400 mb-2">
                          <Check className="h-3.5 w-3.5" />
                          Confirmed — {b.assigned_vehicle_name}
                        </div>

                        {hasPaymentLink && b.payment_status === "pending" ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-yellow-300">
                              <CircleDollarSign className="h-3.5 w-3.5" />
                              Payment link sent — {b.payment_amount && b.payment_currency
                                ? formatAmount(b.payment_amount, b.payment_currency)
                                : ""} — awaiting payment
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-white/40">Resend with new amount:</span>
                            </div>
                          </div>
                        ) : null}

                        <div className="flex items-center gap-2 flex-wrap">
                          <label htmlFor={`amount-${b.id}`} className="text-xs text-white/50">
                            Final price (EUR):
                          </label>
                          <input
                            id={`amount-${b.id}`}
                            type="number"
                            step="0.01"
                            min="1"
                            placeholder={b.price_estimate?.totalPrice ? String(b.price_estimate.totalPrice) : "0.00"}
                            value={paymentAmount[b.id] ?? ""}
                            onChange={(e) => onPaymentAmountChange(b.id, e.target.value)}
                            className="glass-input w-28 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => onSendPaymentLink(b.id)}
                            disabled={
                              !paymentAmount[b.id] ||
                              parseFloat(paymentAmount[b.id]) <= 0 ||
                              sendingPayment === b.id
                            }
                            className="btn-gold text-sm px-4 py-2 inline-flex items-center gap-2 disabled:opacity-40"
                          >
                            {sendingPayment === b.id ? "..." : (
                              <>
                                <Send className="h-3.5 w-3.5" />
                                Send Payment Link
                              </>
                            )}
                          </button>
                        </div>

                        {pResult === "success" && (
                          <span className="text-xs text-green-400">Payment link sent to customer!</span>
                        )}
                        {pResult === "error" && (
                          <span className="text-xs text-red-400">Failed to send payment link. Try again.</span>
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
