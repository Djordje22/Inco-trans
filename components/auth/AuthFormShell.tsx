import type { Locale } from "@/lib/site-config";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthFormShell({ title, subtitle, children }: Props) {
  return (
    <section className="container-tight py-16 sm:py-20">
      <div className="mx-auto max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">
            {title}
          </h1>
          <p className="mt-2 text-sm text-white/60">{subtitle}</p>
        </div>
        <div className="glass rounded-2xl p-6 sm:p-8">{children}</div>
      </div>
    </section>
  );
}
