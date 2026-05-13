import Image from "next/image";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { routeMap, type Locale } from "@/lib/site-config";
import QuoteForm from "./QuoteForm";
import { ReservationTrigger } from "./ReservationModal";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2400&q=80";

export default function Hero({ locale }: { locale: Locale }) {
  const dict = t(locale);

  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
      <div className="absolute inset-0 -z-20">
        <Image
          src={HERO_IMAGE}
          alt={
            locale === "sr"
              ? "Luksuzni automobil osvetljen u noći — Inco Trans Beograd"
              : "Luxury car lit at night — Inco Trans Belgrade"
          }
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-hero-fade" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-radial-gold" aria-hidden="true" />

      <div className="container-tight pt-14 pb-16 sm:pt-20 sm:pb-24 md:pt-28 md:pb-32">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-10">
          <div className="animate-fade-up">
            <span className="eyebrow">{dict.hero.eyebrow}</span>
            <h1
              id="hero-title"
              className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl leading-tight"
            >
              <span className="block text-white">{dict.hero.title1}</span>
              <span className="block bg-gradient-to-r from-gold-300 via-gold-400 to-gold-200 bg-clip-text text-transparent">
                {dict.hero.title2}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg text-white/75">
              {dict.hero.subtitle}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ReservationTrigger>{dict.hero.ctaPrimary}</ReservationTrigger>
              <Link href={routeMap.fleet[locale]} className="btn-ghost">
                {dict.hero.ctaSecondary}
              </Link>
            </div>
          </div>

          <div className="animate-fade-up md:justify-self-end w-full md:max-w-md">
            <QuoteForm locale={locale} variant="card" />
          </div>
        </div>
      </div>
    </section>
  );
}
