import LegalPage from "@/components/LegalPage";
import { buildMetadata } from "@/lib/metadata";
import { termsContent } from "@/lib/legal-content";

const locale = "en" as const;
const content = termsContent[locale];

export const metadata = buildMetadata({
  locale,
  routeKey: "terms",
  title: content.title,
  description: content.description
});

export default function TermsPage() {
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
