"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  flight_number: string | null;
  message: string | null;
  price_estimate: { totalPrice?: number; currency?: string } | null;
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

const statusLabel = (status: string, locale: Locale) => {
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

const formatDate = (value: string, locale: Locale) => {
  const d = new Date(value);
  const lc = locale === "sr" ? "sr-Latn-RS" : locale === "ru" ? "ru-RU" : "en-GB";
  return new Intl.DateTimeFormat(lc, { dateStyle: "medium", timeStyle: "short" }).format(d);
};

export default function BookingHistory({ locale, dict }: Props) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
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

      const { data } = await supabase
        .from("booking_requests")
        .select("id, service, pickup, destination, pickup_at, status, full_name, email, phone, passengers, luggage, flight_number, message, price_estimate, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setBookings((data as BookingRow[]) ?? []);
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

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const isOpen = expandedId === b.id;
        return (
          <div key={b.id} className="glass rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : b.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white/90">
                    {serviceLabel(b.service, locale)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                    {statusLabel(b.status, locale)}
                  </span>
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
                {b.flight_number && (
                  <Row label={dict.modal.rent.review.flightLabel} value={b.flight_number} />
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
