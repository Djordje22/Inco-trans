import Link from "next/link";
import { siteConfig, type Locale, type RouteKey, routeMap } from "@/lib/site-config";

type Props = {
  current: Locale;
  routeKey: RouteKey;
};

export default function LanguageSwitcher({ current, routeKey }: Props) {
  return (
    <div
      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-xs"
      role="group"
      aria-label={current === "sr" ? "Promena jezika" : "Language"}
    >
      {siteConfig.locales.map((loc) => {
        const isActive = loc === current;
        const href = routeMap[routeKey][loc];
        const label = loc === "sr" ? "SR" : "EN";
        const aria =
          loc === "sr" ? "Srpski (latinica)" : "English";
        return (
          <Link
            key={loc}
            href={href}
            hrefLang={loc}
            aria-label={aria}
            aria-current={isActive ? "true" : undefined}
            className={
              "rounded-full px-2.5 py-1 font-semibold tracking-wide transition-colors " +
              (isActive
                ? "bg-gold-400 text-ink-900"
                : "text-white/70 hover:text-white")
            }
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
