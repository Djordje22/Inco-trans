import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";
import SectionHeader from "./SectionHeader";

export default function HowItWorks({ locale }: { locale: Locale }) {
  const dict = t(locale);

  return (
    <section
      className="container-tight py-16 sm:py-20"
      aria-labelledby="how-title"
    >
      <SectionHeader title={dict.how.title} />
      <h2 id="how-title" className="sr-only">
        {dict.how.title}
      </h2>

      <ol className="mt-10 grid gap-5 sm:grid-cols-3">
        {dict.how.steps.map((step) => (
          <li key={step.title} className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg text-gold-300">{step.title}</h3>
            <p className="mt-2 text-sm text-white/65">{step.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
