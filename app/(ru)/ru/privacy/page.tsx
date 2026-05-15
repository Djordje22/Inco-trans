import LegalPage from "@/components/LegalPage";
import { buildMetadata } from "@/lib/metadata";
import { privacyContent } from "@/lib/legal-content";

const locale = "ru" as const;
const content = privacyContent[locale];

export const metadata = buildMetadata({
  locale,
  routeKey: "privacy",
  title: content.title,
  description: content.description
});

export default function RuPrivacyPage() {
  return (
    <LegalPage
      locale={locale}
      routeKey="privacy"
      title={content.title}
      subtitle={content.subtitle}
      sections={content.sections}
    />
  );
}
