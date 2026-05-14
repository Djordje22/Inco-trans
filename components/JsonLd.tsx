import { siteConfig, routeMap, type Locale } from "@/lib/site-config";
import { vehicles } from "@/lib/fleet-data";
import { t } from "@/lib/i18n";

type Props = {
  locale: Locale;
};

// Joins the canonical url with a path, mirroring lib/metadata.ts.
function joinUrl(base: string, path: string): string {
  return path === "/" ? base : `${base}${path}`;
}

export default function JsonLd({ locale }: Props) {
  const dict = t(locale);
  const url = siteConfig.url;
  const logo = `${url}/brand/inco_logo_icon_512.png`;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#business`,
    name: siteConfig.name,
    url,
    description: siteConfig.description[locale],
    image: logo,
    logo,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: "$$$",
    paymentAccepted: "Cash, Credit Card",
    currenciesAccepted: "EUR, RSD",
    openingHours: "Mo-Su 00:00-23:59",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address,
      addressLocality: siteConfig.contact.city,
      addressCountry: siteConfig.contact.country
    },
    areaServed: [
      { "@type": "City", name: "Belgrade" },
      { "@type": "Country", name: "Serbia" }
    ],
    sameAs: [siteConfig.social.instagram, siteConfig.social.facebook].filter(
      (u) => u && !u.startsWith("TODO")
    )
  };

  const provider = { "@id": `${url}#business` };

  const services = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${url}#service-airport`,
      name: dict.servicePages.airport.title,
      serviceType: "Airport transfer",
      description: dict.servicePages.airport.subtitle,
      areaServed: { "@type": "City", name: "Belgrade" },
      provider,
      url: joinUrl(url, routeMap.airportTransfer[locale])
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${url}#service-chauffeur`,
      name: dict.servicePages.chauffeur.title,
      serviceType: "Chauffeur service",
      description: dict.servicePages.chauffeur.subtitle,
      areaServed: [
        { "@type": "City", name: "Belgrade" },
        { "@type": "Country", name: "Serbia" }
      ],
      provider,
      url: joinUrl(url, routeMap.chauffeurService[locale])
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${url}#service-business`,
      name: dict.servicePages.business.title,
      serviceType: "Business transfer",
      description: dict.servicePages.business.subtitle,
      areaServed: { "@type": "City", name: "Belgrade" },
      provider,
      url: joinUrl(url, routeMap.businessTransfer[locale])
    }
  ];

  const vehicleNodes = vehicles.map((v) => ({
    "@context": "https://schema.org",
    "@type": "Vehicle",
    "@id": `${url}#vehicle-${v.slug}`,
    name: v.name,
    image: v.image,
    vehicleSeatingCapacity: v.passengers,
    vehicleTransmission: v.transmission.en,
    fuelType: v.fuel.en
  }));

  const graph = {
    "@context": "https://schema.org",
    "@graph": [localBusiness, ...services, ...vehicleNodes]
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
