import type { Locale } from "./site-config";

export type VehicleCategory = "sedan" | "suv" | "sport" | "van";

export type Vehicle = {
  slug: string;
  name: string;
  category: VehicleCategory;
  image: string;
  passengers: number;
  luggage: number;
  transmission: { sr: string; en: string };
  fuel: { sr: string; en: string };
  // Daily price placeholder. Use null to render "na upit" / "on request".
  pricePerDayEur: number | null;
};

export const categoryLabels: Record<
  VehicleCategory,
  { sr: string; en: string }
> = {
  sedan: { sr: "Limuzine", en: "Sedans" },
  suv: { sr: "SUV vozila", en: "SUVs" },
  sport: { sr: "Sportski / luxury", en: "Sport / luxury" },
  van: { sr: "Vanovi", en: "Vans" }
};

// License-safe Unsplash demo images. Replace before going live.
export const vehicles: Vehicle[] = [
  {
    slug: "executive-sedan",
    name: "Executive sedan",
    category: "sedan",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    passengers: 4,
    luggage: 3,
    transmission: { sr: "Automatik", en: "Automatic" },
    fuel: { sr: "Dizel", en: "Diesel" },
    pricePerDayEur: null
  },
  {
    slug: "business-sedan",
    name: "Business sedan",
    category: "sedan",
    image:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    passengers: 4,
    luggage: 3,
    transmission: { sr: "Automatik", en: "Automatic" },
    fuel: { sr: "Benzin", en: "Petrol" },
    pricePerDayEur: null
  },
  {
    slug: "premium-suv",
    name: "Premium SUV",
    category: "suv",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
    passengers: 5,
    luggage: 4,
    transmission: { sr: "Automatik", en: "Automatic" },
    fuel: { sr: "Dizel", en: "Diesel" },
    pricePerDayEur: null
  },
  {
    slug: "family-suv",
    name: "Family SUV",
    category: "suv",
    image:
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
    passengers: 7,
    luggage: 5,
    transmission: { sr: "Automatik", en: "Automatic" },
    fuel: { sr: "Dizel", en: "Diesel" },
    pricePerDayEur: null
  },
  {
    slug: "luxury-coupe",
    name: "Luxury coupe",
    category: "sport",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    passengers: 2,
    luggage: 2,
    transmission: { sr: "Automatik", en: "Automatic" },
    fuel: { sr: "Benzin", en: "Petrol" },
    pricePerDayEur: null
  },
  {
    slug: "sport-convertible",
    name: "Sport convertible",
    category: "sport",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
    passengers: 2,
    luggage: 1,
    transmission: { sr: "Automatik", en: "Automatic" },
    fuel: { sr: "Benzin", en: "Petrol" },
    pricePerDayEur: null
  },
  {
    slug: "group-van",
    name: "Group van",
    category: "van",
    image:
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1200&q=80",
    passengers: 8,
    luggage: 8,
    transmission: { sr: "Automatik", en: "Automatic" },
    fuel: { sr: "Dizel", en: "Diesel" },
    pricePerDayEur: null
  },
  {
    slug: "comfort-van",
    name: "Comfort van",
    category: "van",
    image:
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80",
    passengers: 6,
    luggage: 6,
    transmission: { sr: "Automatik", en: "Automatic" },
    fuel: { sr: "Dizel", en: "Diesel" },
    pricePerDayEur: null
  }
];

export function formatPrice(
  vehicle: Vehicle,
  locale: Locale,
  placeholder: string
): string {
  if (vehicle.pricePerDayEur == null) return placeholder;
  return locale === "sr"
    ? `${vehicle.pricePerDayEur} € / dan`
    : `€${vehicle.pricePerDayEur} / day`;
}
