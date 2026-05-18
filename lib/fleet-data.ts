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
    image:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80",
    passengers: 4,
    luggage: 3,
    transmission: { sr: "Automatik", en: "Automatic", ru: "Автомат" },
    fuel: { sr: "Dizel", en: "Diesel", ru: "Дизель" },
    comfort: {
      sr: [
        "Profesionalni šofer",
        "Kožna sedišta i klima",
        "Voda i Wi-Fi na zahtev",
        "Diskretan i tih enterijer"
      ],
      en: [
        "Professional chauffeur",
        "Leather seats and climate control",
        "Bottled water and Wi-Fi on request",
        "Discreet, quiet cabin"
      ],
      ru: [
        "Профессиональный шофёр",
        "Кожаный салон и климат-контроль",
        "Вода и Wi-Fi по запросу",
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
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1600&q=80",
    passengers: 4,
    luggage: 4,
    transmission: { sr: "Automatik", en: "Automatic", ru: "Автомат" },
    fuel: { sr: "Dizel", en: "Diesel", ru: "Дизель" },
    comfort: {
      sr: [
        "Profesionalni šofer",
        "Udobna limuzina za aerodromske transfere",
        "Kožna sedišta i klima",
        "Voda i Wi-Fi na zahtev"
      ],
      en: [
        "Professional chauffeur",
        "Comfortable sedan for airport transfers",
        "Leather seats and climate control",
        "Bottled water and Wi-Fi on request"
      ],
      ru: [
        "Профессиональный шофёр",
        "Комфортный седан для трансферов из аэропорта",
        "Кожаный салон и климат-контроль",
        "Вода и Wi-Fi по запросу"
      ]
    }
  }
];

export function pricePlaceholder(locale: Locale): string {
  return locale === "sr"
    ? "Cena na upit"
    : locale === "ru"
      ? "Цена по запросу"
      : "Price on request";
}
