import type { Locale } from "./site-config";

export type Vehicle = {
  slug: string;
  name: string;
  // Short positioning line under the model name.
  tagline: { sr: string; en: string; ru: string };
  image: string;
  passengers: number;
  luggage: number;
  transmission: { sr: string; en: string; ru: string };
  fuel: { sr: string; en: string; ru: string };
  // Comfort bullet list shown on the vehicle card / fleet page.
  comfort: { sr: string[]; en: string[]; ru: string[] };
};

// Two-vehicle fleet. Do not add more without updating AGENT.md.
export const vehicles: Vehicle[] = [
  {
    slug: "mercedes-e-class",
    name: "Mercedes E Class",
    tagline: {
      sr: "Poslovna limuzina za šofer servis i transfere",
      en: "Executive sedan for chauffeur service and transfers",
      ru: "Бизнес-седан для шофёр-сервиса и трансферов"
    },
    image: "/fleet/airport-audi.jpg",
    passengers: 4,
    luggage: 4,
    transmission: { sr: "Automatik", en: "Automatic", ru: "Автомат" },
    fuel: { sr: "Dizel", en: "Diesel", ru: "Дизель" },
    comfort: {
      sr: [
        "Profesionalni šofer",
        "Kožna sedišta i klima",
        "Voda i Wi-Fi uključeni",
        "Diskretan i tih enterijer"
      ],
      en: [
        "Professional chauffeur",
        "Leather seats and climate control",
        "Bottled water and Wi-Fi included",
        "Discreet, quiet cabin"
      ],
      ru: [
        "Профессиональный шофёр",
        "Кожаный салон и климат-контроль",
        "Вода и Wi-Fi включены",
        "Тихий, комфортный салон"
      ]
    }
  },
  {
    slug: "audi-a6",
    name: "Audi A6",
    tagline: {
      sr: "Premium limuzina za aerodromske transfere i duže vožnje",
      en: "Premium sedan for airport transfers and longer rides",
      ru: "Премиальный седан для трансферов из аэропорта и дальних поездок"
    },
    image: "/fleet/airport-audi.jpg",
    passengers: 4,
    luggage: 4,
    transmission: { sr: "Automatik", en: "Automatic", ru: "Автомат" },
    fuel: { sr: "Dizel", en: "Diesel", ru: "Дизель" },
    comfort: {
      sr: [
        "Profesionalni šofer",
        "Udobna limuzina za aerodromske transfere",
        "Kožna sedišta i klima",
        "Voda i Wi-Fi uključeni"
      ],
      en: [
        "Professional chauffeur",
        "Comfortable sedan for airport transfers",
        "Leather seats and climate control",
        "Bottled water and Wi-Fi included"
      ],
      ru: [
        "Профессиональный шофёр",
        "Комфортный седан для трансферов из аэропорта",
        "Кожаный салон и климат-контроль",
        "Вода и Wi-Fi включены"
      ]
    }
  }
];

export function pricePlaceholder(locale: Locale): string {
  return locale === "sr"
    ? "od 30€"
    : locale === "ru"
      ? "от 30€"
      : "from €30";
}
