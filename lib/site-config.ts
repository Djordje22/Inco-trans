// Single source of truth for business + brand details.
// Do not duplicate any of these values elsewhere.

export const siteConfig = {
  name: "Inco Trans",
  legalName: "Inco Trans",
  tagline: {
    sr: "Šofer i luksuzni transfer u Beogradu",
    en: "Chauffeur & luxury transfer in Belgrade",
    ru: "Шофёр и люкс-трансфер в Белграде"
  },
  description: {
    sr: "Inco Trans nudi profesionalni šofer servis i luksuzni transfer u Beogradu i Srbiji: aerodromski transfer, duge relacije i VIP prevoz. Online rezervacije su dostupne uvek, a pozivi od 08:00 do 22:00 po vremenu u Beogradu.",
    en: "Inco Trans provides professional chauffeur service and luxury transfer in Belgrade and Serbia: airport transfer, long-distance transfers and VIP transport. Online reservations are always available, with calls from 08:00 to 22:00 Belgrade time.",
    ru: "Inco Trans предлагает профессиональный шофёр-сервис и люкс-трансфер в Белграде и Сербии: трансфер из аэропорта, дальние поездки и VIP-перевозки. Онлайн-бронирование доступно всегда, звонки принимаем с 08:00 до 22:00 по времени Белграда."
  },
  url: "https://incotrans.netlify.app",
  domain: "incotrans.netlify.app",
  defaultLocale: "sr" as const,
  locales: ["sr", "en", "ru"] as const,

  // Phone number is +381 65 283 3289 (national: 065 28 33 289).
  contact: {
    phone: "+381 65 283 3289",
    phoneHref: "tel:+381652833289",
    whatsapp: "+381 65 283 3289",
    whatsappHref:
      "https://api.whatsapp.com/send/?phone=381652833289&text&type=phone_number&app_absent=0",
    email: "dorde.bojovic@rechargeapps",
    emailHref: "mailto:dorde.bojovic@rechargeapps",
    address: "Belgrade, Serbia",
    city: "Beograd",
    country: "RS",
    hours: {
      sr: "Pozivi: 08:00-22:00, vreme u Beogradu",
      en: "Calls: 08:00-22:00, Belgrade time",
      ru: "Звонки: 08:00-22:00, время Белграда"
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

// Long names for the language switcher menu, used as the visible label inside
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
    sr: "/duge-relacije",
    en: "/en/long-distance-transfer",
    ru: "/ru/long-distance-transfer"
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
  },
  login: {
    sr: "/prijava",
    en: "/en/login",
    ru: "/ru/login"
  },
  signup: {
    sr: "/registracija",
    en: "/en/signup",
    ru: "/ru/signup"
  },
  forgotPassword: {
    sr: "/zaboravljena-lozinka",
    en: "/en/forgot-password",
    ru: "/ru/forgot-password"
  },
  resetPassword: {
    sr: "/nova-lozinka",
    en: "/en/reset-password",
    ru: "/ru/reset-password"
  },
  profile: {
    sr: "/profil",
    en: "/en/profile",
    ru: "/ru/profile"
  },
  bookingHistory: {
    sr: "/istorija",
    en: "/en/history",
    ru: "/ru/history"
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
