import ServicePage from "@/components/ServicePage";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

const locale = "en" as const;
const page = t(locale).servicePages.airport;

export const metadata = buildMetadata({
  locale,
  routeKey: "airportTransfer",
  title: page.title,
  description: page.subtitle
});

export default function AirportTransferPage() {
  return <ServicePage locale={locale} service="airport" />;
}
