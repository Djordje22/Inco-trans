import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";
import SectionHeader from "./SectionHeader";

const PATHS = [
  // shield (premium)
  "M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3Z",
  // tag (price)
  "M3 12V4h8l10 10-8 8L3 12Zm5-5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z",
  // pin (location)
  "M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  // lock (privacy)
  "M6 11V8a6 6 0 1 1 12 0v3M5 11h14v10H5z"
];

export default function WhyUs({ locale }: { locale: Locale }) {
  const dict = t(locale);

  return (
    <section
      className="relative isolate py-16 sm:py-20"
      aria-labelledby="why-title"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-ink-900/60 to-transparent" />

      <div className="container-tight">
        <SectionHeader
          eyebrow="Inco Trans"
          title={dict.why.title}
        />
        <h2 id="why-title" className="sr-only">
          {dict.why.title}
        </h2>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {dict.why.items.map((item, i) => (
            <li key={item.title} className="glass rounded-2xl p-5 sm:p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 text-gold-300">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={PATHS[i]} />
                </svg>
              </span>
              <h3 className="mt-4 font-display text-lg text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-white/65">{item.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
