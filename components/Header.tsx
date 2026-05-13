import Link from "next/link";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import { ReservationTrigger } from "./ReservationModal";
import { siteConfig, routeMap, type Locale, type RouteKey } from "@/lib/site-config";
import { t } from "@/lib/i18n";

type Props = {
  locale: Locale;
  routeKey: RouteKey;
};

export default function Header({ locale, routeKey }: Props) {
  const dict = t(locale);
  const home = routeMap.home[locale];
  const links = [
    { href: routeMap.fleet[locale], label: dict.nav.fleet },
    { href: routeMap.quote[locale], label: dict.nav.quote },
    { href: routeMap.about[locale], label: dict.nav.about },
    { href: routeMap.contact[locale], label: dict.nav.contact }
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/85 to-ink-950/55 backdrop-blur-md border-b border-white/5" />
      <div className="container-tight flex h-16 items-center gap-3 sm:h-20">
        <Logo
          href={home}
          brand={siteConfig.name}
          tagline={dict.hero.eyebrow}
        />

        <nav
          aria-label={locale === "sr" ? "Glavna navigacija" : "Primary"}
          className="ml-auto hidden md:flex items-center gap-1"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-white/75 hover:text-white transition-colors rounded-md"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto md:ml-3 flex items-center gap-2">
          <LanguageSwitcher current={locale} routeKey={routeKey} />
          <ReservationTrigger className="hidden sm:inline-flex btn-gold !py-2 !px-3 text-sm">
            {dict.nav.requestQuote}
          </ReservationTrigger>
          <MobileMenu locale={locale} links={links} />
        </div>
      </div>
    </header>
  );
}
