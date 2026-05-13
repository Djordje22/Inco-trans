// Single source of truth for business + brand details.
// TODO placeholders are surfaced in the UI verbatim so they are easy to find
// and replace later. Do not duplicate any of these values elsewhere.

export const siteConfig = {
  name: "Inco Trans",
  legalName: "Inco Trans",
  tagline: {
    sr: "Premium iznajmljivanje automobila u Beogradu",
    en: "Premium car rental in Belgrade"
  },
  description: {
    sr: "Inco Trans nudi luksuzno iznajmljivanje automobila bez vozača u Beogradu. Transparentne cene, gotovinsko plaćanje, održana flota.",
    en: "Inco Trans offers self-drive luxury car rental in Belgrade. Transparent pricing, cash payment, well-maintained fleet."
  },
  url: "https://incotransit.netlify.app",
  domain: "incotransit.netlify.app",
  defaultLocale: "sr" as const,
  locales: ["sr", "en"] as const,

  contact: {
    phone: "TODO: telefon",
    phoneHref: "tel:TODO",
    whatsapp: "TODO: WhatsApp",
    whatsappHref: "https://wa.me/TODO",
    email: "TODO: email",
    emailHref: "mailto:TODO",
    address: "TODO: adresa, Beograd, Srbija",
    city: "Beograd",
    country: "RS",
    hours: {
      sr: "TODO: radno vreme",
      en: "TODO: opening hours"
    }
  },

  social: {
    instagram: "TODO: instagram",
    facebook: "TODO: facebook"
  },

  payment: {
    methods: ["cash"] as const
  }
};

export type Locale = (typeof siteConfig.locales)[number];

export const localeLabels: Record<Locale, string> = {
  sr: "SR",
  en: "EN"
};

// Mapping of equivalent routes across locales used by the language switcher
// and hreflang alternates. Keep in sync when adding new pages.
export const routeMap = {
  home: { sr: "/", en: "/en" },
  fleet: { sr: "/flota", en: "/en/fleet" },
  quote: { sr: "/ponuda", en: "/en/quote" },
  about: { sr: "/o-nama", en: "/en/about" },
  contact: { sr: "/kontakt", en: "/en/contact" }
} as const;

export type RouteKey = keyof typeof routeMap;

export function getAlternateUrl(currentPath: string, target: Locale): string {
  const entry = (Object.values(routeMap) as Array<Record<Locale, string>>).find(
    (r) => r.sr === currentPath || r.en === currentPath
  );
  if (!entry) return target === "sr" ? "/" : "/en";
  return entry[target];
}
