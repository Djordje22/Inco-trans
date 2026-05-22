import PageShell from "@/components/PageShell";
import AuthFormShell from "@/components/auth/AuthFormShell";
import SignupForm from "@/components/auth/SignupForm";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

const locale = "en" as const;
const dict = t(locale);

export const metadata = buildMetadata({
  locale,
  routeKey: "signup",
  title: dict.auth.signupTitle,
  description: dict.auth.signupSubtitle
});

export default function SignupPage() {
  return (
    <PageShell locale={locale} routeKey="signup">
      <AuthFormShell title={dict.auth.signupTitle} subtitle={dict.auth.signupSubtitle}>
        <SignupForm locale={locale} dict={dict} />
      </AuthFormShell>
    </PageShell>
  );
}
