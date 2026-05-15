import LegalPage from "@/components/LegalPage";
import { buildMetadata } from "@/lib/metadata";
import { termsContent } from "@/lib/legal-content";

const locale = "ru" as const;
const content = termsContent[locale];

export const metadata = buildMetadata({
  locale,
  routeKey: "terms",
  title: content.title,
  description: content.description
});

export default function RuTermsPage() {
  return (
    <LegalPage
      locale={locale}
      routeKey="terms"
      title={content.title}
      subtitle={content.subtitle}
      sections={content.sections}
    />
  );
}
