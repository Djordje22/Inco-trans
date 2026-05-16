import { vehicles } from "@/lib/fleet-data";
import { siteConfig, type Locale } from "@/lib/site-config";
import type { BookingRequestPayload } from "@/lib/backend/payloads";

type SendReservationReceiptArgs = {
  bookingId: string;
  payload: BookingRequestPayload;
};

type SendReservationReceiptResult =
  | { sent: true }
  | { sent: false; reason: string };

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const labelForService = (service: BookingRequestPayload["service"], locale: Locale) => {
  const labels = {
    airport: {
      sr: "Aerodromski transfer",
      en: "Airport transfer",
      ru: "Трансфер из аэропорта"
    },
    chauffeur: {
      sr: "Šofer servis",
      en: "Chauffeur service",
      ru: "Шофёр-сервис"
    },
    business: {
      sr: "Poslovni transfer",
      en: "Business transfer",
      ru: "Бизнес-трансфер"
    },
    other: {
      sr: "Drugo",
      en: "Other",
      ru: "Другое"
    }
  } satisfies Record<BookingRequestPayload["service"], Record<Locale, string>>;

  return labels[service][locale];
};

const labelForPayment = (
  paymentMethod: BookingRequestPayload["paymentMethod"],
  locale: Locale
) => {
  if (paymentMethod === "card") {
    return locale === "sr" ? "Kartica" : locale === "ru" ? "Карта" : "Card";
  }

  return locale === "sr" ? "Gotovina" : locale === "ru" ? "Наличные" : "Cash";
};

const formatDateTime = (value: string, locale: Locale) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const localeCode = locale === "sr" ? "sr-Latn-RS" : locale === "ru" ? "ru-RU" : "en-GB";
  return new Intl.DateTimeFormat(localeCode, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

const vehicleName = (slug?: string) => {
  if (!slug) return "Any vehicle";
  return vehicles.find((vehicle) => vehicle.slug === slug)?.name ?? slug;
};

const copyForLocale = (locale: Locale) => {
  if (locale === "sr") {
    return {
      subject: "Primili smo vaš zahtev za Inco Trans rezervaciju",
      preview: "Vaš zahtev za luksuzni transfer je primljen.",
      heading: "Vaš zahtev je primljen",
      intro:
        "Hvala vam. Primili smo zahtev za Inco Trans luksuzni transfer. Ovo nije potvrđena vožnja dok naš tim ne potvrdi dostupnost, rutu i cenu.",
      details: "Detalji zahteva",
      bookingId: "Broj zahteva",
      service: "Usluga",
      route: "Ruta",
      stops: "Stajališta",
      dateTime: "Datum i vreme",
      passengers: "Putnici",
      luggage: "Prtljag",
      flight: "Let",
      vehicle: "Vozilo",
      payment: "Plaćanje",
      notes: "Napomena",
      next:
        "Javićemo se što je pre moguće sa potvrdom dostupnosti i cenom. Za hitne izmene pošaljite nam WhatsApp poruku.",
      footer: "Inco Trans | Dostupni 24/7"
    };
  }

  if (locale === "ru") {
    return {
      subject: "Мы получили ваш запрос на бронирование Inco Trans",
      preview: "Ваш запрос на люкс-трансфер получен.",
      heading: "Ваш запрос получен",
      intro:
        "Спасибо. Мы получили запрос на люкс-трансфер Inco Trans. Поездка не подтверждена, пока наша команда не подтвердит доступность, маршрут и цену.",
      details: "Детали запроса",
      bookingId: "Номер запроса",
      service: "Услуга",
      route: "Маршрут",
      stops: "Остановки",
      dateTime: "Дата и время",
      passengers: "Пассажиры",
      luggage: "Багаж",
      flight: "Рейс",
      vehicle: "Автомобиль",
      payment: "Оплата",
      notes: "Комментарий",
      next:
        "Мы как можно скорее ответим с подтверждением доступности и цены. Для срочных изменений напишите нам в WhatsApp.",
      footer: "Inco Trans | Доступны 24/7"
    };
  }

  return {
    subject: "We received your Inco Trans reservation request",
    preview: "Your luxury transfer request has been received.",
    heading: "Your request has been received",
    intro:
      "Thank you. We received your Inco Trans luxury transfer request. This is not a confirmed ride until our team confirms availability, route and price.",
    details: "Request details",
    bookingId: "Request ID",
    service: "Service",
    route: "Route",
    stops: "Stops",
    dateTime: "Date and time",
    passengers: "Passengers",
    luggage: "Luggage",
    flight: "Flight",
    vehicle: "Vehicle",
    payment: "Payment",
    notes: "Notes",
    next:
      "We will reply as soon as possible with availability and price confirmation. For urgent changes, message us on WhatsApp.",
    footer: "Inco Trans | Available 24/7"
  };
};

const detailRow = (label: string, value?: string | number | null) => {
  if (value === undefined || value === null || String(value).trim() === "") return "";

  return `
    <tr>
      <td style="padding:10px 0;color:#8a8f98;font-size:13px;vertical-align:top;width:34%;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(String(value))}</td>
    </tr>
  `;
};

function buildReservationReceiptEmail({
  bookingId,
  payload
}: SendReservationReceiptArgs) {
  const copy = copyForLocale(payload.locale);
  const route = `${payload.pickup} -> ${payload.destination}`;
  const stops = payload.stops?.filter(Boolean).join(" -> ");
  const customerName = payload.fullName.split(" ")[0] || payload.fullName;

  const rows = [
    detailRow(copy.bookingId, bookingId),
    detailRow(copy.service, labelForService(payload.service, payload.locale)),
    detailRow(copy.route, route),
    detailRow(copy.stops, stops),
    detailRow(copy.dateTime, formatDateTime(payload.dateTime, payload.locale)),
    detailRow(copy.passengers, payload.passengers),
    detailRow(copy.luggage, payload.luggage ?? 0),
    detailRow(copy.flight, payload.flight),
    detailRow(copy.vehicle, vehicleName(payload.vehicle)),
    detailRow(copy.payment, labelForPayment(payload.paymentMethod ?? "cash", payload.locale)),
    detailRow(copy.notes, payload.message)
  ].join("");

  const html = `
    <div style="margin:0;padding:0;background:#f4f1ea;font-family:Inter,Arial,sans-serif;color:#111827;">
      <span style="display:none;opacity:0;visibility:hidden;">${escapeHtml(copy.preview)}</span>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1ea;padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6dccb;">
              <tr>
                <td style="background:#111111;padding:26px 28px;">
                  <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#d7b56d;">${escapeHtml(siteConfig.name)}</div>
                  <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;line-height:1.2;font-weight:700;">${escapeHtml(copy.heading)}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 18px;color:#374151;font-size:15px;line-height:1.7;">${escapeHtml(customerName)}, ${escapeHtml(copy.intro)}</p>
                  <h2 style="margin:24px 0 10px;color:#111827;font-size:17px;">${escapeHtml(copy.details)}</h2>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #ece7dd;border-bottom:1px solid #ece7dd;">
                    ${rows}
                  </table>
                  <p style="margin:22px 0 0;color:#374151;font-size:14px;line-height:1.7;">${escapeHtml(copy.next)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 28px;background:#faf8f3;color:#6b7280;font-size:12px;">
                  ${escapeHtml(copy.footer)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    copy.heading,
    "",
    copy.intro,
    "",
    `${copy.bookingId}: ${bookingId}`,
    `${copy.service}: ${labelForService(payload.service, payload.locale)}`,
    `${copy.route}: ${route}`,
    stops ? `${copy.stops}: ${stops}` : "",
    `${copy.dateTime}: ${formatDateTime(payload.dateTime, payload.locale)}`,
    `${copy.passengers}: ${payload.passengers}`,
    `${copy.luggage}: ${payload.luggage ?? 0}`,
    payload.flight ? `${copy.flight}: ${payload.flight}` : "",
    `${copy.vehicle}: ${vehicleName(payload.vehicle)}`,
    `${copy.payment}: ${labelForPayment(payload.paymentMethod ?? "cash", payload.locale)}`,
    payload.message ? `${copy.notes}: ${payload.message}` : "",
    "",
    copy.next
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: copy.subject,
    html,
    text
  };
}

export async function sendReservationReceiptEmail({
  bookingId,
  payload
}: SendReservationReceiptArgs): Promise<SendReservationReceiptResult> {
  if (!payload.email) {
    return { sent: false, reason: "Booking request does not include an email." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESERVATION_EMAIL_FROM;
  const replyTo = process.env.RESERVATION_EMAIL_REPLY_TO || siteConfig.contact.email;

  if (!apiKey || !from) {
    return { sent: false, reason: "Email provider is not configured." };
  }

  const email = buildReservationReceiptEmail({ bookingId, payload });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: payload.email,
      reply_to: replyTo.startsWith("TODO") ? undefined : replyTo,
      subject: email.subject,
      html: email.html,
      text: email.text
    })
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    return {
      sent: false,
      reason: error || `Resend returned ${response.status}.`
    };
  }

  return { sent: true };
}
