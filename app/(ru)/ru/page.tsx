import PageShell from "@/components/PageShell";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import FleetPreview from "@/components/FleetPreview";
import WhyUs from "@/components/WhyUs";
import HowItWorks from "@/components/HowItWorks";
import AboutTeaser from "@/components/AboutTeaser";
import ContactCTA from "@/components/ContactCTA";
import JsonLd from "@/components/JsonLd";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata = buildMetadata({
  locale: "ru",
  routeKey: "home",
  title: `${siteConfig.name} ${siteConfig.tagline.ru}`,
  description: siteConfig.description.ru
});

export default function RuHomePage() {
  return (
    <PageShell locale="ru" routeKey="home">
      <JsonLd locale="ru" />
      <Hero locale="ru" />
      <Services locale="ru" />
      <FleetPreview locale="ru" />
      <WhyUs locale="ru" />
      <HowItWorks locale="ru" />
      <AboutTeaser locale="ru" />
      <ContactCTA locale="ru" />
    </PageShell>
  );
}
