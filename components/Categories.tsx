import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";
import SectionHeader from "./SectionHeader";

const ICONS = [
  // sedan
  "M3 13l2-5a3 3 0 0 1 3-2h8a3 3 0 0 1 3 2l2 5v4h-2a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3v-4Z",
  // suv
  "M3 14l2-6a3 3 0 0 1 3-2h8a3 3 0 0 1 3 2l2 6v5h-2a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3v-5Z",
  // sport
  "M2 14l3-5c1-2 3-3 5-3h4c2 0 4 1 5 3l3 5v3h-3a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H2v-3Z",
  // van
  "M3 5h13a3 3 0 0 1 3 3v9h-2a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3V5Z"
];

export default function Categories({ locale }: { locale: Locale }) {
  const dict = t(locale);

  return (
    <section
      className="container-tight py-16 sm:py-20"
      aria-labelledby="categories-title"
    >
      <SectionHeader
        eyebrow={dict.categories.title.toUpperCase()}
        title={dict.categories.title}
        subtitle={dict.categories.subtitle}
      />
      <h2 id="categories-title" className="sr-only">
        {dict.categories.title}
      </h2>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dict.categories.items.map((item, i) => (
          <li key={item.title} className="glass rounded-2xl p-5 sm:p-6">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-400/15 ring-1 ring-gold-400/30 text-gold-300">
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
                <path d={ICONS[i]} />
              </svg>
            </span>
            <h3 className="mt-4 font-display text-lg text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-white/65">{item.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
