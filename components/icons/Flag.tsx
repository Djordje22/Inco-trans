import type { Locale } from "@/lib/site-config";

// Country code per locale. Serbia, United Kingdom (English), Russia.
const COUNTRY: Record<Locale, { cc: string; alt: string }> = {
  sr: { cc: "rs", alt: "Srbija" },
  en: { cc: "gb", alt: "United Kingdom" },
  ru: { cc: "ru", alt: "Россия" }
};

// Crisp inline flag from flagcdn.com. Small PNGs, no domain config needed.
// Rendered as a plain <img> with explicit dimensions to avoid layout shift.
export default function Flag({
  locale,
  className
}: {
  locale: Locale;
  className?: string;
}) {
  const { cc, alt } = COUNTRY[locale];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${cc}.png`}
      srcSet={`https://flagcdn.com/w80/${cc}.png 2x`}
      width={20}
      height={15}
      alt={alt}
      loading="lazy"
      className={className ?? "h-[15px] w-5 rounded-sm object-cover shrink-0"}
    />
  );
}
