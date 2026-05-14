import ServicePage from "@/components/ServicePage";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

const locale = "ru" as const;
const page = t(locale).servicePages.chauffeur;

export const metadata = buildMetadata({
  locale,
  routeKey: "chauffeurService",
  title: page.title,
  description: page.subtitle
});

export default function RuChauffeurServicePage() {
  return <ServicePage locale={locale} service="chauffeur" />;
}
