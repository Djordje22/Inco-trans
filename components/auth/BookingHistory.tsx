"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Check, Clock, Car } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";
import { routeMap } from "@/lib/site-config";

type Props = {
  locale: Locale;
  dict: Dict;
};

type BookingRow = {
  id: string;
  service: string;
  pickup: string;
  destination: string;
  pickup_at: string;
  status: string;
  full_name: string;
  email: string | null;
  phone: string;
  passengers: number;
  luggage: number;
  wifi_requested: boolean;
  flight_number: string | null;
  waiting_hours: number;
  message: string | null;
  payment_method: string;
  price_estimate: { totalPrice?: number; currency?: string } | null;
  assigned_vehicle_id: string | null;
  created_at: string;
};

const serviceLabel = (service: string, locale: Locale) => {
  const labels: Record<string, Record<Locale, string>> = {
    airport: { sr: "Aerodromski transfer", en: "Airport transfer", ru: "Трансфер из аэропорта" },
    chauffeur: { sr: "Šofer servis", en: "Chauffeur service", ru: "Шофёр-сервис" },
    business: { sr: "Duge relacije", en: "Long-distance", ru: "Дальние поездки" },
    other: { sr: "Drugo", en: "Other", ru: "Другое" }
  };
  return labels[service]?.[locale] ?? service;
};

const statusLabel = (status: string, locale: Locale, historicalSection = false) => {
  if (historicalSection) {
    return { sr: "Prethodno", en: "Past", ru: "Прошедшая" }[locale];
  }

  const labels: Record<string, Record<Locale, string>> = {
    new: { sr: "Novo", en: "New", ru: "Новый" },
    contacted: { sr: "Kontaktirano", en: "Contacted", ru: "Связались" },
    confirmed: { sr: "Potvrđeno", en: "Confirmed", ru: "Подтверждено" },
    completed: { sr: "Završeno", en: "Completed", ru: "Завершено" },
    cancelled: { sr: "Otkazano", en: "Cancelled", ru: "Отменено" },
    archived: { sr: "Arhivirano", en: "Archived", ru: "Архивировано" }
  };
  return labels[status]?.[locale] ?? status;
};

const statusColor = (status: string, historicalSection = false) => {
  if (historicalSection) return "bg-white/10 text-white/50";
  return STATUS_COLORS[status] ?? "bg-white/10 text-white/50";
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-300",
  contacted: "bg-yellow-500/20 text-yellow-300",
  confirmed: "bg-green-500/20 text-green-300",
  completed: "bg-white/10 text-white/50",
  cancelled: "bg-red-500/20 text-red-300",
  archived: "bg-white/5 text-white/30"
};

const formatDate = (value: string, locale: Locale) => {
  const d = new Date(value);
  const lc = locale === "sr" ? "sr-Latn-RS" : locale === "ru" ? "ru-RU" : "en-GB";
  return new Intl.DateTimeFormat(lc, { dateStyle: "medium", timeStyle: "short" }).format(d);
};

const paymentLabel = (method: string, locale: Locale) => {
  if (method === "card") {
    return locale === "sr" ? "Kartica" : locale === "ru" ? "Карта" : "Card";
  }
  return locale === "sr" ? "Gotovina" : locale === "ru" ? "Наличные" : "Cash";
};

export default function BookingHistory({ locale, dict }: Props) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [vehicleNames, setVehicleNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = routeMap.login[locale];
        return;
      }

      const res = await fetch("/api/user-bookings");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const { bookings: fetched } = await res.json();

      const rows = (fetched as BookingRow[]) ?? [];
      setBookings(rows);

      // Fetch vehicle names for assigned bookings
      const vehicleIds = [...new Set(rows.map((b) => b.assigned_vehicle_id).filter(Boolean))] as string[];
      if (vehicleIds.length > 0) {
        const { data: vehicles } = await supabase
          .from("vehicles")
          .select("id, name")
          .in("id", vehicleIds);
        if (vehicles) {
          const map: Record<string, string> = {};
          for (const v of vehicles) map[v.id] = v.name;
          setVehicleNames(map);
        }
      }

      setLoading(false);
    };
    load();
  }, [locale]);

  if (loading) {
    return <div className="py-8 text-center text-white/50">...</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="py-8 text-center text-white/50">
        <p>{dict.auth.noBookings}</p>
      </div>
    );
  }

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => new Date(b.pickup_at) >= now && b.status !== "completed" && b.status !== "cancelled" && b.status !== "archived"
  );
  const past = bookings.filter(
    (b) => new Date(b.pickup_at) < now || b.status === "completed" || b.status === "cancelled" || b.status === "archived"
  );

  return (
    <div className="space-y-8">
      {upcoming.length > 0 && (
        <BookingSection
          title={dict.auth.upcomingTitle}
          icon={<Clock className="h-4 w-4 text-gold-400" />}
          bookings={upcoming}
          locale={locale}
          dict={dict}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
          vehicleNames={vehicleNames}
          historicalSection={false}
        />
      )}

      {past.length > 0 && (
        <BookingSection
          title={dict.auth.pastTitle}
          bookings={past}
          locale={locale}
          dict={dict}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
          vehicleNames={vehicleNames}
          historicalSection
        />
      )}
    </div>
  );
}

function BookingSection({
  title,
  icon,
  bookings,
  locale,
  dict,
  expandedId,
  onToggle,
  vehicleNames,
  historicalSection
}: {
  title: string;
  icon?: React.ReactNode;
  bookings: BookingRow[];
  locale: Locale;
  dict: Dict;
  expandedId: string | null;
  onToggle: (id: string) => void;
  vehicleNames: Record<string, string>;
  historicalSection: boolean;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
        {icon}
        {title}
        <span className="text-white/30 font-normal normal-case">({bookings.length})</span>
      </h2>
      <div className="space-y-3">
        {bookings.map((b) => {
          const isOpen = expandedId === b.id;
          const vehicleName = b.assigned_vehicle_id ? vehicleNames[b.assigned_vehicle_id] : null;

          return (
            <div key={b.id} className="glass rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => onToggle(b.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white/90">
                      {serviceLabel(b.service, locale)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(b.status, historicalSection)}`}>
                      {statusLabel(b.status, locale, historicalSection)}
                    </span>
                    {b.status === "confirmed" && vehicleName && (
                      <span className="text-xs text-green-400 inline-flex items-center gap-1">
                        <Car className="h-3 w-3" /> {vehicleName}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-white/50 truncate">
                    {formatDate(b.pickup_at, locale)} &middot; {b.pickup} &rarr; {b.destination}
                  </p>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-white/40" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-4 pt-1 border-t border-white/5 space-y-2 text-sm">
                  <Row label={dict.auth.bookingService} value={serviceLabel(b.service, locale)} />
                  <Row label={dict.auth.bookingDate} value={formatDate(b.pickup_at, locale)} />
                  <Row label={dict.auth.bookingPickup} value={b.pickup} />
                  <Row label={dict.auth.bookingDestination} value={b.destination} />
                  <Row label={dict.modal.rent.review.passengersLabel} value={String(b.passengers)} />
                  <Row label={dict.modal.rent.review.luggageLabel} value={String(b.luggage)} />
                  <Row label={dict.modal.rent.review.wifiLabel} value={b.wifi_requested ? dict.modal.rent.review.yes : dict.modal.rent.review.no} />
                  {b.flight_number && (
                    <Row label={dict.modal.rent.review.flightLabel} value={b.flight_number} />
                  )}
                  {b.waiting_hours > 0 && (
                    <Row label={dict.modal.rent.review.waitingLabel} value={`${b.waiting_hours}h`} />
                  )}
                  <Row label={dict.modal.rent.review.paymentCardTitle} value={paymentLabel(b.payment_method, locale)} />
                  {vehicleName && (
                    <Row label={dict.modal.rent.review.vehicleLabel} value={vehicleName} />
                  )}
                  {b.price_estimate?.totalPrice != null && (
                    <Row
                      label={dict.modal.rent.review.totalEstimateLabel}
                      value={`${b.price_estimate.totalPrice} ${b.price_estimate.currency ?? "EUR"}`}
                    />
                  )}
                  {b.message && (
                    <Row label={dict.modal.rent.review.messageLabel} value={b.message} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-white/50 shrink-0">{label}:</span>
      <span className="text-white/80">{value}</span>
    </div>
  );
}
