import { Clock, Tag, UserRound, CreditCard, Trophy, Gift } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";
import SectionHeader from "./SectionHeader";

const ICONS: LucideIcon[] = [Clock, Tag, UserRound, CreditCard, Trophy, Gift];

export default function WhyUs({ locale }: { locale: Locale }) {
  const dict = t(locale);

  return (
    <section
      className="relative isolate py-16 sm:py-20"
      aria-labelledby="why-title"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-ink-900/60 to-transparent" />

      <div className="container-tight">
        <SectionHeader eyebrow="Inco Trans" title={dict.why.title} />
        <h2 id="why-title" className="sr-only">
          {dict.why.title}
        </h2>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dict.why.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <li key={item.title} className="glass rounded-2xl p-5 sm:p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 text-gold-300">
                  <Icon
                    className="h-6 w-6"
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                </span>
                <h3 className="mt-4 font-display text-lg text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-white/65">{item.desc}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
