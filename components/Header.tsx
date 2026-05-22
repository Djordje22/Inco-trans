import Link from "next/link";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import NavServicesMenu from "./NavServicesMenu";
import AccountMenu from "./AccountMenu";
import { ReservationTrigger } from "./ReservationModal";
import {
  siteConfig,
  routeMap,
  type Locale,
  type RouteKey
} from "@/lib/site-config";
import { t } from "@/lib/i18n";

type Props = {
  locale: Locale;
  routeKey: RouteKey;
};

export default function Header({ locale, routeKey }: Props) {
  const dict = t(locale);
  const home = routeMap.home[locale];

  // Top-level links. Services live in the dropdown.
  const flatLinks = [
    { href: routeMap.fleet[locale], label: dict.nav.fleet },
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
          tagline={siteConfig.tagline[locale]}
        />

        <nav
          aria-label={
            locale === "sr"
              ? "Glavna navigacija"
              : locale === "ru"
                ? "Основная навигация"
                : "Primary"
          }
          className="ml-auto hidden lg:flex items-center gap-0.5"
        >
          <NavServicesMenu locale={locale} />
          {flatLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2.5 py-2 text-[13px] text-white/75 hover:text-white transition-colors rounded-md"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto lg:ml-3 flex items-center gap-2">
          <LanguageSwitcher current={locale} routeKey={routeKey} />
          <ReservationTrigger className="hidden sm:inline-flex btn-gold !py-2 !px-3 text-sm">
            {dict.nav.requestQuote}
          </ReservationTrigger>
          <div className="hidden lg:block">
            <AccountMenu locale={locale} />
          </div>
          <MobileMenu
            locale={locale}
            flatLinks={flatLinks}
          />
        </div>
      </div>
    </header>
  );
}
