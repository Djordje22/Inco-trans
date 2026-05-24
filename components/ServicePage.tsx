import Link from "next/link";
import PageShell from "./PageShell";
import PageHero from "./PageHero";
import ContactCTA from "./ContactCTA";
import JsonLd from "./JsonLd";
import { ReservationTrigger } from "./ReservationModal";
import FleetCard from "./FleetCard";
import { vehicles } from "@/lib/fleet-data";
import { routeMap, type Locale, type RouteKey } from "@/lib/site-config";
import { t } from "@/lib/i18n";
import type { ServiceKey } from "@/lib/i18n";

type Props = {
  locale: Locale;
  service: ServiceKey;
};

const ROUTE_KEY_FOR_SERVICE: Record<ServiceKey, RouteKey> = {
  airport: "airportTransfer",
  chauffeur: "chauffeurService",
  business: "businessTransfer"
};

export default function ServicePage({ locale, service }: Props) {
  const dict = t(locale);
  const page = dict.servicePages[service];
  const routeKey = ROUTE_KEY_FOR_SERVICE[service];

  const otherServices: ServiceKey[] = (
    ["airport", "chauffeur", "business"] as ServiceKey[]
  ).filter((s) => s !== service);

  return (
    <PageShell locale={locale} routeKey={routeKey}>
      <JsonLd locale={locale} />
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        subtitle={page.subtitle}
      />

      <section className="container-tight pb-16 sm:pb-20">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="glass-strong rounded-2xl p-6 sm:p-10">
            <p className="text-base sm:text-lg text-white/80">{page.heroBody}</p>

            <h2 className="mt-8 font-display text-2xl text-white">
              {page.includedTitle}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {page.included.map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rotate-45 rounded-[1px] bg-gold-400"
                  />
                  <span>{i}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-10 font-display text-2xl text-white">
              {page.detailTitle}
            </h2>
            <div className="mt-4 space-y-3 text-sm sm:text-base text-white/75">
              {page.detailBody.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <ReservationTrigger service={service}>{page.ctaText}</ReservationTrigger>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="eyebrow">{page.crossLinkTitle}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {otherServices.map((s) => {
                  const route = routeMap[ROUTE_KEY_FOR_SERVICE[s]][locale];
                  return (
                    <li key={s}>
                      <Link
                        href={route}
                        className="text-white/80 hover:text-white flex items-center gap-1"
                      >
                        {dict.servicePages[s].title} →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="container-tight pb-16 sm:pb-20">
        <h2 className="font-display text-2xl sm:text-3xl text-white">
          {dict.fleetPreview.title}
        </h2>
        <p className="mt-2 text-white/65">{dict.fleetPreview.subtitle}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {vehicles.map((v) => (
            <FleetCard key={v.slug} vehicle={v} locale={locale} />
          ))}
        </div>
      </section>

      <ContactCTA locale={locale} />
    </PageShell>
  );
}
