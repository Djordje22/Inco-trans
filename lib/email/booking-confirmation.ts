import { siteConfig, type Locale } from "@/lib/site-config";

type BookingRow = {
  id: string;
  locale: string;
  service: string;
  airport_direction: string | null;
  pickup: string;
  destination: string;
  pickup_at: string;
  passengers: number;
  luggage: number;
  wifi_requested: boolean;
  flight_number: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  phone_country_code: string | null;
  payment_method: string;
  price_estimate: { totalPrice?: number; currency?: string } | null;
};

type SendConfirmationArgs = {
  bookingId: string;
  booking: BookingRow;
  vehicleName: string;
};

type SendResult = { sent: true } | { sent: false; reason: string };

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const serviceLabel = (service: string, locale: Locale) => {
  const labels: Record<string, Record<Locale, string>> = {
    airport: { sr: "Aerodromski transfer", en: "Airport transfer", ru: "Трансфер из аэропорта" },
    chauffeur: { sr: "Šofer servis", en: "Chauffeur service", ru: "Шофёр-сервис" },
    business: { sr: "Duge relacije", en: "Long-distance transfer", ru: "Дальняя поездка" },
    other: { sr: "Drugo", en: "Other", ru: "Другое" }
  };
  return labels[service]?.[locale] ?? service;
};

const formatDateTime = (value: string, locale: Locale) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const localeCode = locale === "sr" ? "sr-Latn-RS" : locale === "ru" ? "ru-RU" : "en-GB";
  return new Intl.DateTimeFormat(localeCode, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formatPrice = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "sr" ? "sr-RS" : locale === "ru" ? "ru-RU" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value);

const detailRow = (label: string, value?: string | number | null) => {
  if (value === undefined || value === null || String(value).trim() === "") return "";
  return `
    <tr>
      <td style="padding:10px 0;color:#8a8f98;font-size:13px;vertical-align:top;width:34%;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(String(value))}</td>
    </tr>
  `;
};

const copyForLocale = (locale: Locale) => {
  if (locale === "sr") {
    return {
      subject: "Vaša Inco Trans vožnja je potvrđena",
      preview: "Vaša rezervacija je potvrđena — vozilo je dodeljeno.",
      heading: "Vaša vožnja je potvrđena!",
      intro: "Vaša Inco Trans rezervacija je potvrđena. Evo detalja vaše vožnje:",
      bookingId: "Broj rezervacije",
      service: "Usluga",
      route: "Ruta",
      dateTime: "Datum i vreme",
      passengers: "Putnici",
      luggage: "Prtljag",
      flight: "Broj leta",
      vehicle: "Vozilo",
      payment: "Plaćanje",
      price: "Cena",
      wifi: "Wi-Fi",
      yes: "Da",
      no: "Ne",
      next: "Vozač će vas sačekati na dogovorenom mestu. Za izmene ili pitanja, pošaljite nam WhatsApp poruku.",
      footer: "Inco Trans | Online rezervacije"
    };
  }
  if (locale === "ru") {
    return {
      subject: "Ваша поездка Inco Trans подтверждена",
      preview: "Ваше бронирование подтверждено — автомобиль назначен.",
      heading: "Ваша поездка подтверждена!",
      intro: "Ваше бронирование Inco Trans подтверждено. Вот детали вашей поездки:",
      bookingId: "Номер бронирования",
      service: "Услуга",
      route: "Маршрут",
      dateTime: "Дата и время",
      passengers: "Пассажиры",
      luggage: "Багаж",
      flight: "Номер рейса",
      vehicle: "Автомобиль",
      payment: "Оплата",
      price: "Цена",
      wifi: "Wi-Fi",
      yes: "Да",
      no: "Нет",
      next: "Водитель будет ждать вас в условленном месте. Для изменений или вопросов напишите нам в WhatsApp.",
      footer: "Inco Trans | Онлайн-бронирование"
    };
  }
  return {
    subject: "Your Inco Trans ride is confirmed",
    preview: "Your reservation is confirmed — vehicle assigned.",
    heading: "Your ride is confirmed!",
    intro: "Your Inco Trans reservation has been confirmed. Here are your ride details:",
    bookingId: "Booking ID",
    service: "Service",
    route: "Route",
    dateTime: "Date and time",
    passengers: "Passengers",
    luggage: "Luggage",
    flight: "Flight",
    vehicle: "Vehicle",
    payment: "Payment",
    price: "Price",
    wifi: "Wi-Fi",
    yes: "Yes",
    no: "No",
    next: "Your driver will be waiting at the agreed location. For changes or questions, message us on WhatsApp.",
    footer: "Inco Trans | Online reservations"
  };
};

const paymentLabel = (method: string, locale: Locale) => {
  if (method === "card") {
    return locale === "sr" ? "Kartica" : locale === "ru" ? "Карта" : "Card";
  }
  return locale === "sr" ? "Gotovina" : locale === "ru" ? "Наличные" : "Cash";
};

function buildConfirmationEmail({ bookingId, booking, vehicleName }: SendConfirmationArgs) {
  const locale = (booking.locale as Locale) || "en";
  const copy = copyForLocale(locale);
  const route = `${booking.pickup} → ${booking.destination}`;
  const customerName = booking.full_name.split(" ")[0] || booking.full_name;

  const rows = [
    detailRow(copy.bookingId, bookingId),
    detailRow(copy.service, serviceLabel(booking.service, locale)),
    detailRow(copy.route, route),
    detailRow(copy.dateTime, formatDateTime(booking.pickup_at, locale)),
    detailRow(copy.passengers, booking.passengers),
    detailRow(copy.luggage, booking.luggage),
    detailRow(copy.wifi, booking.wifi_requested ? copy.yes : copy.no),
    booking.flight_number ? detailRow(copy.flight, booking.flight_number) : "",
    detailRow(copy.vehicle, vehicleName),
    detailRow(copy.payment, paymentLabel(booking.payment_method, locale)),
    booking.price_estimate?.totalPrice != null
      ? detailRow(copy.price, formatPrice(booking.price_estimate.totalPrice, locale))
      : ""
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
    `${customerName}, ${copy.intro}`,
    "",
    `${copy.bookingId}: ${bookingId}`,
    `${copy.service}: ${serviceLabel(booking.service, locale)}`,
    `${copy.route}: ${route}`,
    `${copy.dateTime}: ${formatDateTime(booking.pickup_at, locale)}`,
    `${copy.passengers}: ${booking.passengers}`,
    `${copy.luggage}: ${booking.luggage}`,
    `${copy.wifi}: ${booking.wifi_requested ? copy.yes : copy.no}`,
    booking.flight_number ? `${copy.flight}: ${booking.flight_number}` : "",
    `${copy.vehicle}: ${vehicleName}`,
    `${copy.payment}: ${paymentLabel(booking.payment_method, locale)}`,
    booking.price_estimate?.totalPrice != null
      ? `${copy.price}: ${formatPrice(booking.price_estimate.totalPrice, locale)}`
      : "",
    "",
    copy.next
  ].filter(Boolean).join("\n");

  return { subject: copy.subject, html, text };
}

export async function sendBookingConfirmationEmail(
  args: SendConfirmationArgs
): Promise<{ sent: true } | { sent: false; reason: string }> {
  if (!args.booking.email) {
    return { sent: false, reason: "No customer email." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESERVATION_EMAIL_FROM;
  const replyTo = process.env.RESERVATION_EMAIL_REPLY_TO || siteConfig.contact.email;

  if (!apiKey || !from) {
    return { sent: false, reason: "Email provider not configured." };
  }

  const email = buildConfirmationEmail(args);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: args.booking.email,
      reply_to: replyTo?.startsWith("TODO") ? undefined : replyTo,
      subject: email.subject,
      html: email.html,
      text: email.text
    })
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    return { sent: false, reason: error || `Resend returned ${response.status}.` };
  }

  return { sent: true };
}
