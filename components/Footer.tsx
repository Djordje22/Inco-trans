import Link from "next/link";
import { siteConfig, routeMap, type Locale } from "@/lib/site-config";
import { t } from "@/lib/i18n";

type Props = { locale: Locale };

export default function Footer({ locale }: Props) {
  const dict = t(locale);
  const year = new Date().getFullYear();

  const quickLinks = [
    { href: routeMap.fleet[locale], label: dict.nav.fleet },
    { href: routeMap.about[locale], label: dict.nav.about },
    { href: routeMap.contact[locale], label: dict.nav.contact }
  ];

  const serviceLinks = [
    {
      href: routeMap.airportTransfer[locale],
      label: dict.nav.airportTransfer
    },
    {
      href: routeMap.chauffeurService[locale],
      label: dict.nav.chauffeurService
    },
    {
      href: routeMap.businessTransfer[locale],
      label: dict.nav.businessTransfer
    }
  ];

  return (
    <footer className="mt-24 border-t border-white/5 bg-ink-950">
      <div className="container-tight py-12 grid gap-10 md:grid-cols-4">
        <div>
          <div className="font-display text-xl text-white">
            {siteConfig.name}
          </div>
          <p className="mt-2 text-sm text-white/55 max-w-xs">
            {siteConfig.tagline[locale]}
          </p>
          <p className="mt-3 text-xs text-white/45 max-w-xs">
            {dict.hero.subtitle}
          </p>
        </div>

        <div>
          <h3 className="eyebrow">{dict.footer.servicesHeading}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {serviceLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/70 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="eyebrow mt-6">{dict.footer.quickLinks}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/70 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow">{dict.footer.contact}</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>
              <a
                href={siteConfig.contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                {dict.contact.whatsappLabel}: {siteConfig.contact.whatsapp}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.contact.phoneHref}
                className="hover:text-white"
              >
                {siteConfig.contact.phone}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.contact.emailHref}
                className="hover:text-white"
              >
                {siteConfig.contact.email}
              </a>
            </li>
            <li>{siteConfig.contact.address}</li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow">{dict.footer.payments}</h3>
          <p className="mt-3 text-sm text-white/70">
            {dict.footer.paymentsValue}
          </p>
          <h3 className="eyebrow mt-6">{dict.contact.hoursLabel}</h3>
          <p className="mt-3 text-sm text-white/70">
            {dict.footer.hoursValue}
          </p>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container-tight py-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-white/50">
          <p>
            © {year} {siteConfig.legalName}. {dict.footer.rights}
          </p>
          <p className="max-w-xl sm:text-right">{dict.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
