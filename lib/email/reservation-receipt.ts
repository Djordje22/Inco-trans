import { siteConfig, type Locale } from "@/lib/site-config";
import type { BookingRequestPayload } from "@/lib/backend/payloads";

type SendReservationReceiptArgs = {
  bookingId: string;
  payload: BookingRequestPayload;
  staffAccessUrl?: string;
};

type SendReservationReceiptResult =
  | { sent: true }
  | { sent: false; reason: string };

type SendReservationEmailsResult = {
  receiptSent: boolean;
  adminSent: boolean;
  reminderScheduled: boolean;
  reasons: string[];
};

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
      sr: "Duge relacije",
      en: "Long-distance transfer",
      ru: "Дальняя поездка"
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

const formatPrice = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "sr" ? "sr-RS" : locale === "ru" ? "ru-RU" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value);

const formatDistance = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "sr" ? "sr-RS" : locale === "ru" ? "ru-RU" : "en-GB", {
    maximumFractionDigits: 1
  }).format(value);

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const promoDiscountAmount = (payload: BookingRequestPayload) => {
  if (!payload.priceEstimate || !payload.promoCode) return 0;
  const percent = payload.promoDiscountPercent ?? 0;
  if (percent <= 0) return 0;
  return roundMoney(payload.priceEstimate.totalPrice * (percent / 100));
};

const totalAfterPromo = (payload: BookingRequestPayload) => {
  const total = payload.priceEstimate?.totalPrice ?? 0;
  return roundMoney(total - promoDiscountAmount(payload));
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
      dropoffDateTime: "Traje do",
      duration: "Trajanje",
      passengers: "Putnici",
      luggage: "Prtljag",
      wifi: "Wi-Fi",
      yes: "Da",
      no: "Ne",
      flight: "Let",
      vehicle: "Vozilo",
      payment: "Plaćanje",
      companyName: "Naziv kompanije",
      companyVatNumber: "PIB",
      companyAddress: "Adresa kompanije",
      promoDiscount: "Promo popust",
      price: "Okvirna cena",
      basePrice: "Osnovna cena",
      waitingPrice: "Čekanje",
      distanceOverage: "Dodatna kilometraža",
      chauffeurService: "Šofer servis",
      chauffeurExtraHours: "Dodatni sati",
      longDistanceTransfer: "Duge relacije",
      totalPrice: "Ukupno okvirno",
      distance: "Obračunska kilometraža",
      notes: "Napomena",
      bookingForOther: "Rezervacija za drugu osobu",
      passengerName: "Ime putnika",
      passengerPhone: "Telefon putnika",
      reminder: "Podsetnik",
      reminderEnabled: "Da, 5 minuta nakon slanja zahteva",
      reminderSubject: "Podsetnik za Inco Trans vožnju",
      reminderPreview: "Vaša zakazana vožnja je uskoro.",
      reminderHeading: "Podsetnik za vožnju",
      reminderIntro:
        "Podsećamo vas na zakazanu Inco Trans vožnju. Ako treba da izmenite detalje, javite nam se što pre.",
      next:
        "Javićemo se što je pre moguće sa potvrdom dostupnosti i cenom. Za hitne izmene pošaljite nam WhatsApp poruku.",
      footer: "Inco Trans | Online rezervacije"
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
      dropoffDateTime: "До",
      duration: "Длительность",
      passengers: "Пассажиры",
      luggage: "Багаж",
      wifi: "Wi-Fi",
      yes: "Да",
      no: "Нет",
      flight: "Рейс",
      vehicle: "Автомобиль",
      payment: "Оплата",
      companyName: "Компания",
      companyVatNumber: "VAT/PIB",
      companyAddress: "Адрес компании",
      promoDiscount: "Промокод",
      price: "Ориентировочная цена",
      basePrice: "Базовая цена",
      waitingPrice: "Ожидание",
      distanceOverage: "Дополнительный километраж",
      chauffeurService: "Шофёр-сервис",
      chauffeurExtraHours: "Дополнительные часы",
      longDistanceTransfer: "Дальняя поездка",
      totalPrice: "Итого ориентировочно",
      distance: "Расчётный километраж",
      notes: "Комментарий",
      bookingForOther: "Бронирование для другого человека",
      passengerName: "Имя пассажира",
      passengerPhone: "Телефон пассажира",
      reminder: "Напоминание",
      reminderEnabled: "Да, через 5 минут после отправки запроса",
      reminderSubject: "Напоминание о поездке Inco Trans",
      reminderPreview: "Ваша запланированная поездка скоро.",
      reminderHeading: "Напоминание о поездке",
      reminderIntro:
        "Напоминаем о запланированной поездке Inco Trans. Если нужно изменить детали, пожалуйста, свяжитесь с нами как можно раньше.",
      next:
        "Мы как можно скорее ответим с подтверждением доступности и цены. Для срочных изменений напишите нам в WhatsApp.",
      footer: "Inco Trans | Онлайн-бронирование"
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
    dropoffDateTime: "Until",
    duration: "Duration",
    passengers: "Passengers",
    luggage: "Luggage",
    wifi: "Wi-Fi",
    yes: "Yes",
    no: "No",
    flight: "Flight",
    vehicle: "Vehicle",
    payment: "Payment",
    companyName: "Company name",
    companyVatNumber: "VAT number",
    companyAddress: "Company address",
    promoDiscount: "Promo discount",
    price: "Estimated price",
    basePrice: "Base price",
    waitingPrice: "Waiting time",
    distanceOverage: "Distance overage",
    chauffeurService: "Chauffeur service",
    chauffeurExtraHours: "Additional hours",
    longDistanceTransfer: "Long-distance transfer",
    totalPrice: "Total estimate",
    distance: "Billable distance",
    notes: "Notes",
    bookingForOther: "Booking for another person",
    passengerName: "Passenger name",
    passengerPhone: "Passenger phone",
    reminder: "Reminder",
    reminderEnabled: "Yes, 5 minutes after request submission",
    reminderSubject: "Inco Trans trip reminder",
    reminderPreview: "Your scheduled ride is coming up.",
    reminderHeading: "Trip reminder",
    reminderIntro:
      "This is a reminder for your scheduled Inco Trans ride. If you need to change any details, please contact us as soon as possible.",
    next:
      "We will reply as soon as possible with availability and price confirmation. For urgent changes, message us on WhatsApp.",
    footer: "Inco Trans | Online reservations"
  };
};

const priceRows = (payload: BookingRequestPayload, locale: Locale) => {
  const estimate = payload.priceEstimate;
  if (!estimate) return "";

  const copy = copyForLocale(locale);
  const discountAmount = promoDiscountAmount(payload);
  const longDistanceLabel = `${copy.longDistanceTransfer} (${formatDistance(
    estimate.distanceKm,
    locale
  )} km ${locale === "sr" ? "povratna ruta" : locale === "ru" ? "туда и обратно" : "round trip"})`;
  const chauffeurBaseLabel = `${copy.chauffeurService} ${locale === "sr" ? "do" : locale === "ru" ? "до" : "up to"} ${formatDistance(
    estimate.chauffeurIncludedHours ?? 10,
    locale
  )}h (${formatDistance(estimate.includedDistanceKm, locale)} km ${
    locale === "sr" ? "uključeno" : locale === "ru" ? "включено" : "included"
  })`;
  const rows = [
    detailRow(copy.distance, `${formatDistance(estimate.distanceKm, locale)} km`),
    estimate.pricingModel === "long_distance"
      ? detailRow(longDistanceLabel, formatPrice(estimate.overagePrice, locale))
      : estimate.pricingModel === "chauffeur"
        ? detailRow(chauffeurBaseLabel, formatPrice(estimate.basePrice, locale))
      : detailRow(copy.basePrice, formatPrice(estimate.basePrice, locale)),
    estimate.waitingPrice > 0
      ? detailRow(
          estimate.pricingModel === "chauffeur"
            ? copy.chauffeurExtraHours
            : copy.waitingPrice,
          `${formatPrice(estimate.waitingPrice, locale)} (${estimate.waitingHours}h)`
        )
      : "",
    estimate.pricingModel !== "long_distance" && estimate.distanceOverageKm > 0
      ? detailRow(
          copy.distanceOverage,
          `${formatPrice(estimate.overagePrice, locale)} (${formatDistance(
            estimate.distanceOverageKm,
            locale
          )} km over ${formatDistance(estimate.includedDistanceKm, locale)} km)`
        )
      : "",
    discountAmount > 0
      ? detailRow(
          `${copy.promoDiscount} (${payload.promoCode})`,
          `-${formatPrice(discountAmount, locale)}`
        )
      : "",
    detailRow(copy.totalPrice, formatPrice(totalAfterPromo(payload), locale))
  ].join("");

  return `
    <h2 style="margin:24px 0 10px;color:#111827;font-size:17px;">${escapeHtml(copy.price)}</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #ece7dd;border-bottom:1px solid #ece7dd;">
      ${rows}
    </table>
  `;
};

const priceTextRows = (payload: BookingRequestPayload, locale: Locale) => {
  const estimate = payload.priceEstimate;
  if (!estimate) return [];

  const copy = copyForLocale(locale);
  const discountAmount = promoDiscountAmount(payload);
  const longDistanceLabel = `${copy.longDistanceTransfer} (${formatDistance(
    estimate.distanceKm,
    locale
  )} km ${locale === "sr" ? "povratna ruta" : locale === "ru" ? "туда и обратно" : "round trip"})`;
  const chauffeurBaseLabel = `${copy.chauffeurService} ${locale === "sr" ? "do" : locale === "ru" ? "до" : "up to"} ${formatDistance(
    estimate.chauffeurIncludedHours ?? 10,
    locale
  )}h (${formatDistance(estimate.includedDistanceKm, locale)} km ${
    locale === "sr" ? "uključeno" : locale === "ru" ? "включено" : "included"
  })`;
  return [
    "",
    copy.price,
    `${copy.distance}: ${formatDistance(estimate.distanceKm, locale)} km`,
    estimate.pricingModel === "long_distance"
      ? `${longDistanceLabel}: ${formatPrice(estimate.overagePrice, locale)}`
      : estimate.pricingModel === "chauffeur"
        ? `${chauffeurBaseLabel}: ${formatPrice(estimate.basePrice, locale)}`
      : `${copy.basePrice}: ${formatPrice(estimate.basePrice, locale)}`,
    estimate.waitingPrice > 0
      ? `${estimate.pricingModel === "chauffeur" ? copy.chauffeurExtraHours : copy.waitingPrice}: ${formatPrice(estimate.waitingPrice, locale)} (${estimate.waitingHours}h)`
      : "",
    estimate.pricingModel !== "long_distance" && estimate.distanceOverageKm > 0
      ? `${copy.distanceOverage}: ${formatPrice(estimate.overagePrice, locale)} (${formatDistance(
          estimate.distanceOverageKm,
          locale
        )} km over ${formatDistance(estimate.includedDistanceKm, locale)} km)`
      : "",
    discountAmount > 0
      ? `${copy.promoDiscount} (${payload.promoCode}): -${formatPrice(discountAmount, locale)}`
      : "",
    `${copy.totalPrice}: ${formatPrice(totalAfterPromo(payload), locale)}`
  ].filter(Boolean);
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

const yesNo = (value: boolean | undefined, yes: string, no: string) =>
  (value ?? true) ? yes : no;

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
    payload.service === "chauffeur"
      ? detailRow(
          copy.dropoffDateTime,
          payload.dropoffDateTime
            ? formatDateTime(payload.dropoffDateTime, payload.locale)
            : null
        )
      : "",
    payload.service === "chauffeur"
      ? detailRow(
          copy.duration,
          payload.chauffeurDurationHours ? `${payload.chauffeurDurationHours}h` : null
        )
      : "",
    detailRow(copy.passengers, payload.passengers),
    detailRow(copy.luggage, payload.luggage ?? 0),
    detailRow(copy.wifi, yesNo(payload.wifi, copy.yes, copy.no)),
    detailRow(copy.flight, payload.flight),
    detailRow(copy.payment, labelForPayment(payload.paymentMethod ?? "cash", payload.locale)),
    detailRow(copy.companyName, payload.companyName),
    detailRow(copy.companyVatNumber, payload.companyVatNumber),
    detailRow(copy.companyAddress, payload.companyAddress),
    payload.bookingForOther
      ? detailRow(copy.bookingForOther, copy.yes)
      : "",
    payload.bookingForOther
      ? detailRow(copy.passengerName, payload.passengerName)
      : "",
    payload.bookingForOther
      ? detailRow(
          copy.passengerPhone,
          [payload.passengerPhoneCountryCode, payload.passengerPhone].filter(Boolean).join(" ")
        )
      : "",
    payload.reminderRequested ? detailRow(copy.reminder, copy.reminderEnabled) : "",
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
                  ${priceRows(payload, payload.locale)}
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
    payload.service === "chauffeur" && payload.dropoffDateTime
      ? `${copy.dropoffDateTime}: ${formatDateTime(payload.dropoffDateTime, payload.locale)}`
      : "",
    payload.service === "chauffeur" && payload.chauffeurDurationHours
      ? `${copy.duration}: ${payload.chauffeurDurationHours}h`
      : "",
    `${copy.passengers}: ${payload.passengers}`,
    `${copy.luggage}: ${payload.luggage ?? 0}`,
    `${copy.wifi}: ${yesNo(payload.wifi, copy.yes, copy.no)}`,
    payload.flight ? `${copy.flight}: ${payload.flight}` : "",
    `${copy.payment}: ${labelForPayment(payload.paymentMethod ?? "cash", payload.locale)}`,
    payload.companyName ? `${copy.companyName}: ${payload.companyName}` : "",
    payload.companyVatNumber
      ? `${copy.companyVatNumber}: ${payload.companyVatNumber}`
      : "",
    payload.companyAddress ? `${copy.companyAddress}: ${payload.companyAddress}` : "",
    payload.bookingForOther ? `${copy.bookingForOther}: ${copy.yes}` : "",
    payload.bookingForOther && payload.passengerName
      ? `${copy.passengerName}: ${payload.passengerName}`
      : "",
    payload.bookingForOther && payload.passengerPhone
      ? `${copy.passengerPhone}: ${[payload.passengerPhoneCountryCode, payload.passengerPhone]
          .filter(Boolean)
          .join(" ")}`
      : "",
    payload.reminderRequested ? `${copy.reminder}: ${copy.reminderEnabled}` : "",
    payload.message ? `${copy.notes}: ${payload.message}` : "",
    ...priceTextRows(payload, payload.locale),
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

function buildReservationReminderEmail({
  bookingId,
  payload
}: SendReservationReceiptArgs) {
  const copy = copyForLocale(payload.locale);
  const route = `${payload.pickup} -> ${payload.destination}`;
  const rows = [
    detailRow(copy.bookingId, bookingId),
    detailRow(copy.service, labelForService(payload.service, payload.locale)),
    detailRow(copy.route, route),
    detailRow(copy.dateTime, formatDateTime(payload.dateTime, payload.locale)),
    detailRow(copy.passengers, payload.passengers)
  ].join("");

  const html = `
    <div style="margin:0;padding:0;background:#f4f1ea;font-family:Inter,Arial,sans-serif;color:#111827;">
      <span style="display:none;opacity:0;visibility:hidden;">${escapeHtml(copy.reminderPreview)}</span>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1ea;padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6dccb;">
              <tr>
                <td style="background:#111111;padding:26px 28px;">
                  <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#d7b56d;">${escapeHtml(siteConfig.name)}</div>
                  <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;line-height:1.2;font-weight:700;">${escapeHtml(copy.reminderHeading)}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 18px;color:#374151;font-size:15px;line-height:1.7;">${escapeHtml(copy.reminderIntro)}</p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #ece7dd;border-bottom:1px solid #ece7dd;">
                    ${rows}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    copy.reminderHeading,
    "",
    copy.reminderIntro,
    "",
    `${copy.bookingId}: ${bookingId}`,
    `${copy.service}: ${labelForService(payload.service, payload.locale)}`,
    `${copy.route}: ${route}`,
    `${copy.dateTime}: ${formatDateTime(payload.dateTime, payload.locale)}`,
    `${copy.passengers}: ${payload.passengers}`
  ].join("\n");

  return {
    subject: copy.reminderSubject,
    html,
    text
  };
}

function buildReservationAdminEmail({
  bookingId,
  payload,
  staffAccessUrl
}: SendReservationReceiptArgs) {
  const copy = copyForLocale("sr");
  const route = `${payload.pickup} -> ${payload.destination}`;
  const stops = payload.stops?.filter(Boolean).join(" -> ");
  const rows = [
    detailRow("Broj zahteva", bookingId),
    detailRow("Izvor", payload.source),
    detailRow("Jezik sajta", payload.locale),
    detailRow("Usluga", labelForService(payload.service, "sr")),
    detailRow("Smer aerodroma", payload.airportDirection),
    detailRow("Ruta", route),
    detailRow("Stajališta", stops),
    detailRow("Datum i vreme", formatDateTime(payload.dateTime, "sr")),
    payload.service === "chauffeur"
      ? detailRow(
          "Traje do",
          payload.dropoffDateTime ? formatDateTime(payload.dropoffDateTime, "sr") : null
        )
      : "",
    payload.service === "chauffeur"
      ? detailRow(
          "Trajanje",
          payload.chauffeurDurationHours ? `${payload.chauffeurDurationHours}h` : null
        )
      : "",
    detailRow("Putnici", payload.passengers),
    detailRow("Prtljag", payload.luggage ?? 0),
    detailRow("Wi-Fi", yesNo(payload.wifi, "Da", "Ne")),
    detailRow("Let", payload.flight),
    detailRow("Plaćanje", labelForPayment(payload.paymentMethod ?? "cash", "sr")),
    payload.bookingForOther
      ? detailRow(copy.bookingForOther, copy.yes)
      : "",
    payload.bookingForOther ? detailRow(copy.passengerName, payload.passengerName) : "",
    payload.bookingForOther
      ? detailRow(
          copy.passengerPhone,
          [payload.passengerPhoneCountryCode, payload.passengerPhone].filter(Boolean).join(" ")
        )
      : "",
    payload.reminderRequested ? detailRow(copy.reminder, copy.reminderEnabled) : "",
    detailRow(
      "Promo popust",
      promoDiscountAmount(payload) > 0
        ? `${payload.promoCode} / -${formatPrice(promoDiscountAmount(payload), "sr")}`
        : null
    ),
    detailRow(
      "Ukupna okvirna cena",
      payload.priceEstimate ? formatPrice(totalAfterPromo(payload), "sr") : null
    ),
    detailRow(
      "Obračunska kilometraža",
      payload.priceEstimate
        ? `${formatDistance(payload.priceEstimate.distanceKm, "sr")} km`
        : null
    ),
    detailRow(
      payload.priceEstimate?.pricingModel === "long_distance"
        ? "Duge relacije"
        : "Dodatna kilometraža",
      payload.priceEstimate && payload.priceEstimate.distanceOverageKm > 0
        ? `${formatDistance(
            payload.priceEstimate.pricingModel === "long_distance"
              ? payload.priceEstimate.distanceKm
              : payload.priceEstimate.distanceOverageKm,
            "sr"
          )} km / ${formatPrice(payload.priceEstimate.overagePrice, "sr")}`
        : null
    ),
    detailRow(
      payload.priceEstimate?.pricingModel === "chauffeur" ? "Dodatni sati" : "Cena čekanja",
      payload.priceEstimate && payload.priceEstimate.waitingPrice > 0
        ? formatPrice(payload.priceEstimate.waitingPrice, "sr")
        : null
    ),
    detailRow("Ime i prezime", payload.fullName),
    detailRow("Email", payload.email),
    detailRow(
      "Telefon",
      [payload.phoneCountryCode, payload.phone].filter(Boolean).join(" ")
    ),
    detailRow("Firma", payload.companyName),
    detailRow("PIB", payload.companyVatNumber),
    detailRow("Adresa kompanije", payload.companyAddress),
    detailRow("Željeni način komunikacije", payload.preferredCommunication),
    detailRow("Napomena", payload.message)
  ].join("");

  const subject = `Novi Inco Trans zahtev za rezervaciju: ${payload.fullName}`;
  const html = `
    <div style="margin:0;padding:0;background:#f4f1ea;font-family:Inter,Arial,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1ea;padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6dccb;">
              <tr>
                <td style="background:#111111;padding:26px 28px;">
                  <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#d7b56d;">${escapeHtml(siteConfig.name)}</div>
                  <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;line-height:1.2;font-weight:700;">Novi zahtev za rezervaciju</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 18px;color:#374151;font-size:15px;line-height:1.7;">Novi zahtev za rezervaciju je poslat preko sajta.</p>
                  ${staffAccessUrl ? `<p style="margin:0 0 18px;"><a href="${escapeHtml(staffAccessUrl)}" style="display:inline-block;padding:10px 20px;background:#d7b56d;color:#111;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Pregledaj rezervaciju</a></p>` : ""}
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #ece7dd;border-bottom:1px solid #ece7dd;">
                    ${rows}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    "Novi zahtev za rezervaciju",
    staffAccessUrl ? `\nPregledaj rezervaciju: ${staffAccessUrl}` : "",
    "",
    `Broj zahteva: ${bookingId}`,
    `Izvor: ${payload.source}`,
    `Jezik sajta: ${payload.locale}`,
    `Usluga: ${labelForService(payload.service, "sr")}`,
    payload.airportDirection ? `Smer aerodroma: ${payload.airportDirection}` : "",
    `Ruta: ${route}`,
    stops ? `Stajališta: ${stops}` : "",
    `Datum i vreme: ${formatDateTime(payload.dateTime, "sr")}`,
    payload.service === "chauffeur" && payload.dropoffDateTime
      ? `Traje do: ${formatDateTime(payload.dropoffDateTime, "sr")}`
      : "",
    payload.service === "chauffeur" && payload.chauffeurDurationHours
      ? `Trajanje: ${payload.chauffeurDurationHours}h`
      : "",
    `Putnici: ${payload.passengers}`,
    `Prtljag: ${payload.luggage ?? 0}`,
    `Wi-Fi: ${yesNo(payload.wifi, "Da", "Ne")}`,
    payload.flight ? `Let: ${payload.flight}` : "",
    `Plaćanje: ${labelForPayment(payload.paymentMethod ?? "cash", "sr")}`,
    payload.bookingForOther ? `${copy.bookingForOther}: ${copy.yes}` : "",
    payload.bookingForOther && payload.passengerName
      ? `${copy.passengerName}: ${payload.passengerName}`
      : "",
    payload.bookingForOther && payload.passengerPhone
      ? `${copy.passengerPhone}: ${[payload.passengerPhoneCountryCode, payload.passengerPhone]
          .filter(Boolean)
          .join(" ")}`
      : "",
    payload.reminderRequested ? `${copy.reminder}: ${copy.reminderEnabled}` : "",
    ...(payload.priceEstimate
      ? [
          promoDiscountAmount(payload) > 0
            ? `Promo popust (${payload.promoCode}): -${formatPrice(promoDiscountAmount(payload), "sr")}`
            : "",
          `Ukupna okvirna cena: ${formatPrice(totalAfterPromo(payload), "sr")}`,
          `Obračunska kilometraža: ${formatDistance(payload.priceEstimate.distanceKm, "sr")} km`,
          payload.priceEstimate.distanceOverageKm > 0
            ? `${payload.priceEstimate.pricingModel === "long_distance" ? "Duge relacije" : "Dodatna kilometraža"}: ${formatDistance(
                payload.priceEstimate.pricingModel === "long_distance"
                  ? payload.priceEstimate.distanceKm
                  : payload.priceEstimate.distanceOverageKm,
                "sr"
              )} km / ${formatPrice(payload.priceEstimate.overagePrice, "sr")}`
            : "",
          payload.priceEstimate.waitingPrice > 0
            ? `${payload.priceEstimate.pricingModel === "chauffeur" ? "Dodatni sati" : "Cena čekanja"}: ${formatPrice(payload.priceEstimate.waitingPrice, "sr")}`
            : ""
        ]
      : []),
    "",
    `Ime i prezime: ${payload.fullName}`,
    payload.email ? `Email: ${payload.email}` : "",
    `Telefon: ${[payload.phoneCountryCode, payload.phone].filter(Boolean).join(" ")}`,
    payload.companyName ? `Firma: ${payload.companyName}` : "",
    payload.companyVatNumber ? `PIB: ${payload.companyVatNumber}` : "",
    payload.companyAddress ? `Adresa kompanije: ${payload.companyAddress}` : "",
    payload.preferredCommunication
      ? `Željeni način komunikacije: ${payload.preferredCommunication}`
      : "",
    payload.message ? `Napomena: ${payload.message}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    html,
    text
  };
}

async function sendResendEmail({
  apiKey,
  from,
  to,
  replyTo,
  subject,
  html,
  text,
  scheduledAt
}: {
  apiKey: string;
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  scheduledAt?: string;
}): Promise<SendReservationReceiptResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: replyTo?.startsWith("TODO") ? undefined : replyTo,
      subject,
      html,
      text,
      scheduled_at: scheduledAt
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
  return sendResendEmail({
    apiKey,
    from,
    to: payload.email,
    replyTo,
    subject: email.subject,
    html: email.html,
    text: email.text
  });
}

function reminderScheduledAt(payload: BookingRequestPayload): string | null {
  const minutesAfterSubmit = payload.reminderMinutesBefore ?? 5;
  const scheduledAt = new Date(Date.now() + minutesAfterSubmit * 60 * 1000);
  const maximum = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (scheduledAt > maximum) return null;
  return scheduledAt.toISOString();
}

async function scheduleReservationReminderEmail({
  bookingId,
  payload
}: SendReservationReceiptArgs): Promise<SendReservationReceiptResult> {
  if (!payload.reminderRequested) {
    return { sent: false, reason: "Reminder was not requested." };
  }
  if (!payload.email) {
    return { sent: false, reason: "Booking request does not include an email." };
  }

  const scheduledAt = reminderScheduledAt(payload);
  if (!scheduledAt) {
    return {
      sent: false,
      reason: "Reminder time is outside the email provider scheduling window."
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESERVATION_EMAIL_FROM;
  const replyTo = process.env.RESERVATION_EMAIL_REPLY_TO || siteConfig.contact.email;

  if (!apiKey || !from) {
    return { sent: false, reason: "Email provider is not configured." };
  }

  const email = buildReservationReminderEmail({ bookingId, payload });
  return sendResendEmail({
    apiKey,
    from,
    to: payload.email,
    replyTo,
    subject: email.subject,
    html: email.html,
    text: email.text,
    scheduledAt
  });
}

export async function sendReservationEmails({
  bookingId,
  payload,
  staffAccessUrl
}: SendReservationReceiptArgs): Promise<SendReservationEmailsResult> {
  const reasons: string[] = [];
  const receiptResult = await sendReservationReceiptEmail({ bookingId, payload });
  if (!receiptResult.sent) {
    reasons.push(`Customer receipt: ${receiptResult.reason}`);
  }
  const reminderResult = await scheduleReservationReminderEmail({
    bookingId,
    payload
  });
  if (payload.reminderRequested && !reminderResult.sent) {
    reasons.push(`Customer reminder: ${reminderResult.reason}`);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESERVATION_EMAIL_FROM;
  const replyTo = process.env.RESERVATION_EMAIL_REPLY_TO || siteConfig.contact.email;
  const adminEmail = process.env.RESERVATION_ADMIN_EMAIL || process.env.RESERVATION_EMAIL_REPLY_TO;

  if (!apiKey || !from) {
    reasons.push("Admin notification: Email provider is not configured.");
    return {
      receiptSent: receiptResult.sent,
      adminSent: false,
      reminderScheduled: reminderResult.sent,
      reasons
    };
  }

  if (!adminEmail || adminEmail.startsWith("TODO")) {
    reasons.push("Admin notification: Admin email is not configured.");
    return {
      receiptSent: receiptResult.sent,
      adminSent: false,
      reminderScheduled: reminderResult.sent,
      reasons
    };
  }

  const email = buildReservationAdminEmail({ bookingId, payload, staffAccessUrl: staffAccessUrl });
  const adminResult = await sendResendEmail({
    apiKey,
    from,
    to: adminEmail,
    replyTo: payload.email || replyTo,
    subject: email.subject,
    html: email.html,
    text: email.text
  });

  if (!adminResult.sent) {
    reasons.push(`Admin notification: ${adminResult.reason}`);
  }

  return {
    receiptSent: receiptResult.sent,
    adminSent: adminResult.sent,
    reminderScheduled: reminderResult.sent,
    reasons
  };
}
