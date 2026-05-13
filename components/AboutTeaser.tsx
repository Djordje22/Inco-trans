import Link from "next/link";
import { t } from "@/lib/i18n";
import { routeMap, type Locale } from "@/lib/site-config";

export default function AboutTeaser({ locale }: { locale: Locale }) {
  const dict = t(locale);

  return (
    <section
      className="container-tight py-16 sm:py-20"
      aria-labelledby="about-teaser-title"
    >
      <div className="glass-strong rounded-3xl p-8 sm:p-12 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="eyebrow">{dict.nav.about}</p>
          <h2
            id="about-teaser-title"
            className="mt-2 font-display text-3xl sm:text-4xl text-white"
          >
            {dict.about.title}
          </h2>
          <div className="mt-4 space-y-3 text-white/70">
            {dict.about.body.map((p, i) => (
              <p key={i} className="text-sm sm:text-base">
                {p}
              </p>
            ))}
          </div>
          <Link
            href={routeMap.about[locale]}
            className="mt-6 inline-flex items-center gap-1 text-sm text-gold-300 hover:text-gold-200"
          >
            {locale === "sr" ? "Saznaj više" : "Learn more"} →
          </Link>
        </div>

        <ul className="grid grid-cols-1 gap-3">
          {dict.about.values.map((v) => (
            <li
              key={v}
              className="glass rounded-xl px-4 py-3 text-sm text-white/80"
            >
              {v}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
