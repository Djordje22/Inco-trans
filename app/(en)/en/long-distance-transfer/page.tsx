import ServicePage from "@/components/ServicePage";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

const locale = "en" as const;
const page = t(locale).servicePages.business;

export const metadata = buildMetadata({
  locale,
  routeKey: "businessTransfer",
  title: page.title,
  description: page.subtitle
});

export default function LongDistanceTransferPage() {
  return <ServicePage locale={locale} service="business" />;
}
