import Link from "next/link";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { routeMap, siteConfig, type Locale } from "@/lib/site-config";
import { t } from "@/lib/i18n";
import { ReservationTrigger } from "./ReservationModal";
import WhatsAppMark from "./icons/WhatsAppMark";

const CTA_IMAGE =
  "https://images.unsplash.com/photo-1741088996480-5e4158b56396?auto=format&fit=crop&w=2200&q=80";

export default function ContactCTA({ locale }: { locale: Locale }) {
  const dict = t(locale);
  const callLabel =
    locale === "sr" ? "Pozovi nas" : locale === "ru" ? "Позвонить" : "Call us";
  const whatsappLabel =
    locale === "sr" ? "WhatsApp poruka" : locale === "ru" ? "WhatsApp" : "WhatsApp";
  const emailLabel =
    locale === "sr" ? "Email" : locale === "ru" ? "Email" : "Email";

  return (
    <section
      className="container-tight py-16 sm:py-20"
      aria-labelledby="cta-title"
    >
      <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-ink-900">
        <Image
          src={CTA_IMAGE}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 1120px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/80" aria-hidden="true" />

        <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-14">
          <div className="space-y-3">
            <a
              href={siteConfig.contact.phoneHref}
              className="flex min-h-20 items-center gap-4 rounded-xl border border-white/15 bg-black/25 px-5 py-4 text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              <Phone className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span>
                <span className="block text-xs font-semibold uppercase tracking-widest text-white/55">
                  {callLabel}
                </span>
                <span className="mt-1 block text-base font-semibold">
                  {siteConfig.contact.phone}
                </span>
              </span>
            </a>
            <a
              href={siteConfig.contact.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-20 items-center gap-4 rounded-xl border border-white/15 bg-black/25 px-5 py-4 text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              <WhatsAppMark className="h-6 w-6 shrink-0" />
              <span>
                <span className="block text-xs font-semibold uppercase tracking-widest text-white/55">
                  {whatsappLabel}
                </span>
                <span className="mt-1 block text-base font-semibold">
                  {siteConfig.contact.whatsapp}
                </span>
              </span>
            </a>
            <a
              href={siteConfig.contact.emailHref}
              className="flex min-h-20 items-center gap-4 rounded-xl border border-white/15 bg-black/25 px-5 py-4 text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              <Mail className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span>
                <span className="block text-xs font-semibold uppercase tracking-widest text-white/55">
                  {emailLabel}
                </span>
                <span className="mt-1 block break-all text-base font-semibold">
                  {siteConfig.contact.email}
                </span>
              </span>
            </a>
          </div>

          <div className="text-center lg:text-left">
            <p className="eyebrow">{dict.badges.hours247}</p>
            <h2
              id="cta-title"
              className="mt-3 font-display text-3xl text-white sm:text-5xl"
            >
              {dict.cta.readyTitle}
            </h2>
            <p className="mt-4 max-w-xl text-base text-white/72 sm:text-lg">
              {dict.cta.readyBody}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <ReservationTrigger className="btn-gold !px-8 !py-4 text-base">
                {dict.nav.requestQuote}
              </ReservationTrigger>
              <Link href={routeMap.contact[locale]} className="btn-ghost">
                {dict.nav.contact}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
