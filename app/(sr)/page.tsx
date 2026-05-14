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
  locale: "sr",
  routeKey: "home",
  title: `${siteConfig.name} — ${siteConfig.tagline.sr}`,
  description: siteConfig.description.sr
});

export default function SrHomePage() {
  return (
    <PageShell locale="sr" routeKey="home">
      <JsonLd locale="sr" />
      <Hero locale="sr" />
      <Services locale="sr" />
      <FleetPreview locale="sr" />
      <WhyUs locale="sr" />
      <HowItWorks locale="sr" />
      <AboutTeaser locale="sr" />
      <ContactCTA locale="sr" />
    </PageShell>
  );
}
