import { siteConfig, type Locale } from "@/lib/site-config";

type Props = {
  locale: Locale;
};

export default function JsonLd({ locale }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": ["AutoRental", "LocalBusiness"],
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description[locale],
    image: `${siteConfig.url}/brand/inco_logo_icon_512.png`,
    logo: `${siteConfig.url}/brand/inco_logo_icon_512.png`,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: "$$$",
    paymentAccepted: "Cash",
    currenciesAccepted: "EUR, RSD",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address,
      addressLocality: siteConfig.contact.city,
      addressCountry: siteConfig.contact.country
    },
    areaServed: {
      "@type": "City",
      name: "Belgrade"
    },
    sameAs: [
      siteConfig.social.instagram,
      siteConfig.social.facebook
    ].filter((u) => u && !u.startsWith("TODO"))
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
