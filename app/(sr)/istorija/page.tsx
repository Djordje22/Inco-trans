import PageShell from "@/components/PageShell";
import BookingHistory from "@/components/auth/BookingHistory";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

const locale = "sr" as const;
const dict = t(locale);

export const metadata = buildMetadata({
  locale,
  routeKey: "bookingHistory",
  title: dict.auth.historyTitle,
  description: dict.auth.historySubtitle
});

export default function IstorijaPage() {
  return (
    <PageShell locale={locale} routeKey="bookingHistory">
      <section className="container-tight py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">
              {dict.auth.historyTitle}
            </h1>
            <p className="mt-2 text-sm text-white/60">{dict.auth.historySubtitle}</p>
          </div>
          <BookingHistory locale={locale} dict={dict} />
        </div>
      </section>
    </PageShell>
  );
}
