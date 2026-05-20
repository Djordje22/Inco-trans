import Link from "next/link";
import { PlaneLanding, CarTaxiFront, Route } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import { routeMap, type Locale } from "@/lib/site-config";
import type { ServiceKey } from "@/lib/i18n";
import SectionHeader from "./SectionHeader";

const ICONS: Record<ServiceKey, LucideIcon> = {
  airport: PlaneLanding,
  chauffeur: CarTaxiFront,
  business: Route
};

const ROUTE_KEYS: Record<ServiceKey, keyof typeof routeMap> = {
  airport: "airportTransfer",
  chauffeur: "chauffeurService",
  business: "businessTransfer"
};

export default function Services({ locale }: { locale: Locale }) {
  const dict = t(locale);
  const order: ServiceKey[] = ["airport", "chauffeur", "business"];

  return (
    <section
      className="container-tight py-16 sm:py-20"
      aria-labelledby="services-title"
    >
      <SectionHeader
        eyebrow={dict.nav.services.toUpperCase()}
        title={dict.services.title}
        subtitle={dict.services.subtitle}
      />
      <h2 id="services-title" className="sr-only">
        {dict.services.title}
      </h2>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {order.map((key) => {
          const Icon = ICONS[key];
          const item = dict.services.items[key];
          const href = routeMap[ROUTE_KEYS[key]][locale];
          return (
            <li key={key} className="glass rounded-2xl p-6 flex flex-col">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-400/15 ring-1 ring-gold-400/30 text-gold-300">
                <Icon className="h-6 w-6" aria-hidden="true" strokeWidth={1.5} />
              </span>
              <h3 className="mt-4 font-display text-lg text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-white/65 flex-1">{item.desc}</p>
              <Link
                href={href}
                className="mt-5 inline-flex items-center gap-1 text-sm text-gold-300 hover:text-gold-200"
              >
                {dict.services.learnMore} →
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
