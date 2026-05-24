import { vehicles } from "@/lib/fleet-data";
import { type Locale } from "@/lib/site-config";
import { t } from "@/lib/i18n";
import FleetCard from "./FleetCard";
import SectionHeader from "./SectionHeader";

export default function FleetPreview({ locale }: { locale: Locale }) {
  const dict = t(locale);

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
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {vehicles.map((v) => (
          <FleetCard key={v.slug} vehicle={v} locale={locale} />
        ))}
      </div>
    </section>
  );
}
