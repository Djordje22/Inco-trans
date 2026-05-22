import PageShell from "@/components/PageShell";
import AuthFormShell from "@/components/auth/AuthFormShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

const locale = "en" as const;
const dict = t(locale);

export const metadata = buildMetadata({
  locale,
  routeKey: "resetPassword",
  title: dict.auth.resetPasswordTitle,
  description: dict.auth.resetPasswordSubtitle
});

export default function ResetPasswordPage() {
  return (
    <PageShell locale={locale} routeKey="resetPassword">
      <AuthFormShell
        title={dict.auth.resetPasswordTitle}
        subtitle={dict.auth.resetPasswordSubtitle}
      >
        <ResetPasswordForm locale={locale} dict={dict} />
      </AuthFormShell>
    </PageShell>
  );
}
