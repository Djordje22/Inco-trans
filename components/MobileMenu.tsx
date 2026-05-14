"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  PlaneLanding,
  CarTaxiFront,
  BriefcaseBusiness
} from "lucide-react";
import WhatsAppMark from "./icons/WhatsAppMark";
import { siteConfig, routeMap, type Locale } from "@/lib/site-config";
import { t, type ServiceKey } from "@/lib/i18n";

type Props = {
  locale: Locale;
  flatLinks: { href: string; label: string }[];
};

const SERVICE_ICONS = {
  airport: PlaneLanding,
  chauffeur: CarTaxiFront,
  business: BriefcaseBusiness
} as const;

const SERVICE_ROUTE: Record<ServiceKey, keyof typeof routeMap> = {
  airport: "airportTransfer",
  chauffeur: "chauffeurService",
  business: "businessTransfer"
};

export default function MobileMenu({ locale, flatLinks }: Props) {
  const [open, setOpen] = useState(false);
  const dict = t(locale);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const labelOpen =
    locale === "sr" ? "Otvori meni" : locale === "ru" ? "Открыть меню" : "Open menu";
  const labelClose =
    locale === "sr"
      ? "Zatvori meni"
      : locale === "ru"
        ? "Закрыть меню"
        : "Close menu";

  const services: ServiceKey[] = ["airport", "chauffeur", "business"];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labelOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={locale === "sr" ? "Navigacija" : locale === "ru" ? "Навигация" : "Navigation"}
          className="fixed inset-0 z-[60] lg:hidden"
        >
          <button
            type="button"
            aria-label={labelClose}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            className="absolute inset-x-3 top-3 glass-strong rounded-2xl p-5 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg">
                {locale === "sr" ? "Meni" : locale === "ru" ? "Меню" : "Menu"}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labelClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-5 eyebrow">{dict.nav.services}</p>
            <ul className="mt-2 space-y-1">
              {services.map((s) => {
                const Icon = SERVICE_ICONS[s];
                const item = dict.services.items[s];
                const href = routeMap[SERVICE_ROUTE[s]][locale];
                return (
                  <li key={s}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5"
                    >
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-400/15 ring-1 ring-gold-400/30 text-gold-300">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="text-sm text-white/85">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="hairline my-5" />
            <ul className="space-y-1">
              {flatLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 text-base text-white/85 hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hairline my-5" />
            <a
              href={siteConfig.contact.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold w-full justify-center"
            >
              <WhatsAppMark className="h-4 w-4" />
              {dict.hero.whatsappCta}
            </a>
            <a
              href={siteConfig.contact.phoneHref}
              className="btn-ghost mt-2 w-full justify-center"
            >
              {siteConfig.contact.phone}
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
