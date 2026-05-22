import PageShell from "@/components/PageShell";
import AuthFormShell from "@/components/auth/AuthFormShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

const locale = "ru" as const;
const dict = t(locale);

export const metadata = buildMetadata({
  locale,
  routeKey: "forgotPassword",
  title: dict.auth.forgotPasswordTitle,
  description: dict.auth.forgotPasswordSubtitle
});

export default function ForgotPasswordPage() {
  return (
    <PageShell locale={locale} routeKey="forgotPassword">
      <AuthFormShell
        title={dict.auth.forgotPasswordTitle}
        subtitle={dict.auth.forgotPasswordSubtitle}
      >
        <ForgotPasswordForm locale={locale} dict={dict} />
      </AuthFormShell>
    </PageShell>
  );
}
