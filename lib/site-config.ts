// Single source of truth for business + brand details.
// TODO placeholders are surfaced in the UI verbatim so they are easy to find
// and replace later. Do not duplicate any of these values elsewhere.

export const siteConfig = {
  name: "Inco Trans",
  legalName: "Inco Trans",
  tagline: {
    sr: "Šofer i luksuzni transfer u Beogradu",
    en: "Chauffeur & luxury transfer in Belgrade",
    ru: "Шофёр и люкс-трансфер в Белграде"
  },
  description: {
    sr: "Inco Trans nudi profesionalni šofer servis i luksuzni transfer u Beogradu i Srbiji — aerodromski transfer, poslovni transfer, VIP prevoz. 24/7, gotovina ili kartica, WhatsApp rezervacija.",
    en: "Inco Trans provides professional chauffeur service and luxury transfer in Belgrade and Serbia — airport transfer, business transfer, VIP transport. 24/7, cash or card, WhatsApp booking.",
    ru: "Inco Trans — профессиональный шофёр-сервис и люкс-трансфер в Белграде и Сербии: трансфер из аэропорта, бизнес-трансфер, VIP-перевозки. 24/7, оплата наличными или картой, бронирование в WhatsApp."
  },
  url: "https://incotrans.netlify.app",
  domain: "incotrans.netlify.app",
  defaultLocale: "sr" as const,
  locales: ["sr", "en", "ru"] as const,

  // Phone number is +381 65 283 3289 (national: 065 28 33 289).
  // WhatsApp URL mirrors bgdiplomat's format so the deep-link works on mobile
  // and falls back to web on desktop. Strip the leading 0, prefix country code.
  contact: {
    phone: "+381 65 283 3289",
    phoneHref: "tel:+381652833289",
    whatsapp: "+381 65 283 3289",
    whatsappHref:
      "https://api.whatsapp.com/send/?phone=381652833289&text&type=phone_number&app_absent=0",
    email: "TODO: email",
    emailHref: "mailto:TODO",
    address: "TODO: adresa, Beograd, Srbija",
    city: "Beograd",
    country: "RS",
    hours: {
      sr: "Dostupni 24/7",
      en: "Available 24/7",
      ru: "Доступны 24/7"
    }
  },

  social: {
    instagram: "TODO: instagram",
    facebook: "TODO: facebook"
  },

  payment: {
    methods: ["cash", "card"] as const
  }
};

export type Locale = (typeof siteConfig.locales)[number];

export const localeLabels: Record<Locale, string> = {
  sr: "SR",
  en: "EN",
  ru: "RU"
};

// Long names for the language switcher menu — used as the visible label inside
// the dropdown and as the `aria-label` for screen readers.
export const localeNames: Record<Locale, string> = {
  sr: "Srpski",
  en: "English",
  ru: "Русский"
};

// Mapping of equivalent routes across locales used by the language switcher
// and hreflang alternates. Keep in sync when adding new pages.
export const routeMap = {
  home: { sr: "/", en: "/en", ru: "/ru" },
  fleet: { sr: "/flota", en: "/en/fleet", ru: "/ru/fleet" },
  quote: { sr: "/ponuda", en: "/en/quote", ru: "/ru/quote" },
  about: { sr: "/o-nama", en: "/en/about", ru: "/ru/about" },
  contact: { sr: "/kontakt", en: "/en/contact", ru: "/ru/contact" },
  airportTransfer: {
    sr: "/aerodromski-transfer",
    en: "/en/airport-transfer",
    ru: "/ru/airport-transfer"
  },
  chauffeurService: {
    sr: "/sofer-servis",
    en: "/en/chauffeur-service",
    ru: "/ru/chauffeur-service"
  },
  businessTransfer: {
    sr: "/poslovni-transfer",
    en: "/en/business-transfer",
    ru: "/ru/business-transfer"
  },
  terms: {
    sr: "/uslovi-koriscenja",
    en: "/en/terms",
    ru: "/ru/terms"
  },
  privacy: {
    sr: "/politika-privatnosti",
    en: "/en/privacy",
    ru: "/ru/privacy"
  }
} as const;

export type RouteKey = keyof typeof routeMap;

export function getAlternateUrl(currentPath: string, target: Locale): string {
  const entry = (Object.values(routeMap) as Array<Record<Locale, string>>).find(
    (r) => r.sr === currentPath || r.en === currentPath || r.ru === currentPath
  );
  if (!entry) {
    return target === "sr" ? "/" : target === "en" ? "/en" : "/ru";
  }
  return entry[target];
}
