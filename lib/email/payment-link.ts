import { siteConfig, type Locale } from "@/lib/site-config";

type SendPaymentLinkArgs = {
  bookingId: string;
  customerEmail: string;
  customerName: string;
  locale: Locale;
  paymentUrl: string;
  amount: number;
  currency: string;
  service: string;
  pickup: string;
  destination: string;
  pickupAt: string;
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

const formatPrice = (valueMinor: number, currency: string, locale: Locale) => {
  const value = valueMinor / 100;
  return new Intl.NumberFormat(locale === "sr" ? "sr-RS" : locale === "ru" ? "ru-RU" : "en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value);
};

const copyForLocale = (locale: Locale) => {
  if (locale === "sr") {
    return {
      subject: "Link za plaćanje — Inco Trans rezervacija",
      preview: "Vaš link za plaćanje za Inco Trans vožnju je spreman.",
      heading: "Vaš link za plaćanje",
      intro: "Vaša Inco Trans rezervacija je potvrđena. Molimo izvršite plaćanje putem linka ispod kako biste finalizovali rezervaciju.",
      bookingId: "Broj rezervacije",
      service: "Usluga",
      route: "Ruta",
      dateTime: "Datum i vreme",
      vehicle: "Vozilo",
      amount: "Iznos za plaćanje",
      payButton: "Platite sada",
      payNote: "Link za plaćanje važi 7 dana. Plaćanje je obezbeđeno preko Adyen-a.",
      next: "Nakon uspešnog plaćanja, vaša rezervacija je u potpunosti potvrđena. Za pitanja, pošaljite nam WhatsApp poruku.",
      footer: "Inco Trans | Online rezervacije"
    };
  }
  if (locale === "ru") {
    return {
      subject: "Ссылка для оплаты — бронирование Inco Trans",
      preview: "Ссылка для оплаты вашей поездки Inco Trans готова.",
      heading: "Ссылка для оплаты",
      intro: "Ваше бронирование Inco Trans подтверждено. Пожалуйста, оплатите по ссылке ниже для завершения бронирования.",
      bookingId: "Номер бронирования",
      service: "Услуга",
      route: "Маршрут",
      dateTime: "Дата и время",
      vehicle: "Автомобиль",
      amount: "Сумма к оплате",
      payButton: "Оплатить",
      payNote: "Ссылка для оплаты действует 7 дней. Оплата защищена через Adyen.",
      next: "После успешной оплаты ваше бронирование полностью подтверждено. По вопросам напишите нам в WhatsApp.",
      footer: "Inco Trans | Онлайн-бронирование"
    };
  }
  return {
    subject: "Payment link — Inco Trans booking",
    preview: "Your payment link for your Inco Trans ride is ready.",
    heading: "Your payment link",
    intro: "Your Inco Trans reservation has been confirmed. Please complete the payment below to finalize your booking.",
    bookingId: "Booking ID",
    service: "Service",
    route: "Route",
    dateTime: "Date and time",
    vehicle: "Vehicle",
    amount: "Amount due",
    payButton: "Pay now",
    payNote: "The payment link is valid for 7 days. Payment is secured via Adyen.",
    next: "After successful payment, your booking is fully confirmed. For questions, message us on WhatsApp.",
    footer: "Inco Trans | Online reservations"
  };
};

const detailRow = (label: string, value?: string | null) => {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:8px 0;color:#8a8f98;font-size:13px;vertical-align:top;width:34%;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>
  `;
};

function buildPaymentLinkEmail(args: SendPaymentLinkArgs) {
  const copy = copyForLocale(args.locale);
  const route = `${args.pickup} → ${args.destination}`;
  const customerName = args.customerName.split(" ")[0] || args.customerName;
  const priceFormatted = formatPrice(args.amount, args.currency, args.locale);

  const rows = [
    detailRow(copy.bookingId, args.bookingId),
    detailRow(copy.service, serviceLabel(args.service, args.locale)),
    detailRow(copy.route, route),
    detailRow(copy.dateTime, formatDateTime(args.pickupAt, args.locale)),
    detailRow(copy.vehicle, args.vehicleName),
    detailRow(copy.amount, priceFormatted)
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
                  <div style="text-align:center;margin:24px 0;">
                    <a href="${escapeHtml(args.paymentUrl)}" style="display:inline-block;padding:14px 32px;background:#d7b56d;color:#111;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;">${escapeHtml(copy.payButton)}</a>
                  </div>
                  <p style="margin:0 0 12px;color:#6b7280;font-size:12px;text-align:center;">${escapeHtml(copy.payNote)}</p>
                  <p style="margin:16px 0 0;color:#374151;font-size:14px;line-height:1.7;">${escapeHtml(copy.next)}</p>
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
    `${copy.bookingId}: ${args.bookingId}`,
    `${copy.service}: ${serviceLabel(args.service, args.locale)}`,
    `${copy.route}: ${route}`,
    `${copy.dateTime}: ${formatDateTime(args.pickupAt, args.locale)}`,
    `${copy.vehicle}: ${args.vehicleName}`,
    `${copy.amount}: ${priceFormatted}`,
    "",
    `${copy.payButton}: ${args.paymentUrl}`,
    "",
    copy.payNote,
    "",
    copy.next
  ].join("\n");

  return { subject: copy.subject, html, text };
}

export async function sendPaymentLinkEmail(
  args: SendPaymentLinkArgs
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESERVATION_EMAIL_FROM;
  const replyTo = process.env.RESERVATION_EMAIL_REPLY_TO || siteConfig.contact.email;

  if (!apiKey || !from) {
    return { sent: false, reason: "Email provider not configured." };
  }

  const email = buildPaymentLinkEmail(args);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: args.customerEmail,
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
