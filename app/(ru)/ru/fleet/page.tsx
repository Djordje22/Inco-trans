import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import FleetGrid from "@/components/FleetGrid";
import ContactCTA from "@/components/ContactCTA";
import JsonLd from "@/components/JsonLd";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

const locale = "ru" as const;
const dict = t(locale);

export const metadata = buildMetadata({
  locale,
  routeKey: "fleet",
  title: dict.fleetPage.title,
  description: dict.fleetPage.subtitle
});

export default function RuFleetPage() {
  return (
    <PageShell locale={locale} routeKey="fleet">
      <JsonLd locale={locale} />
      <PageHero
        eyebrow={dict.nav.fleet}
        title={dict.fleetPage.title}
        subtitle={dict.fleetPage.subtitle}
      />
      <section className="container-tight pb-16 sm:pb-20">
        <FleetGrid locale={locale} />
      </section>
      <ContactCTA locale={locale} />
    </PageShell>
  );
}
