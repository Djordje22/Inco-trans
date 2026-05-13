import Link from "next/link";
import { vehicles } from "@/lib/fleet-data";
import { routeMap, type Locale } from "@/lib/site-config";
import { t } from "@/lib/i18n";
import FleetCard from "./FleetCard";
import SectionHeader from "./SectionHeader";

export default function FleetPreview({ locale }: { locale: Locale }) {
  const dict = t(locale);
  const featured = vehicles.slice(0, 4);

  return (
    <section
      className="container-tight py-16 sm:py-20"
      aria-labelledby="fleet-preview-title"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          title={dict.fleetPreview.title}
          subtitle={dict.fleetPreview.subtitle}
        />
        <h2 id="fleet-preview-title" className="sr-only">
          {dict.fleetPreview.title}
        </h2>
        <Link
          href={routeMap.fleet[locale]}
          className="self-start md:self-auto inline-flex items-center gap-1 text-sm text-gold-300 hover:text-gold-200"
        >
          {dict.fleetPreview.viewAll} →
        </Link>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((v) => (
          <FleetCard key={v.slug} vehicle={v} locale={locale} />
        ))}
      </div>
    </section>
  );
}
