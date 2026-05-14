import { vehicles } from "@/lib/fleet-data";
import type { Locale } from "@/lib/site-config";
import FleetCard from "./FleetCard";

// With only two vehicles the previous category filter UI is removed — both
// cards are surfaced side-by-side on desktop and stacked on mobile.
export default function FleetGrid({ locale }: { locale: Locale }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {vehicles.map((v) => (
        <FleetCard key={v.slug} vehicle={v} locale={locale} />
      ))}
    </div>
  );
}
