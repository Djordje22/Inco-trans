type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export default function PageHero({ eyebrow, title, subtitle }: Props) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-radial-gold" aria-hidden="true" />
      <div className="container-tight pt-28 pb-12 sm:pt-32 sm:pb-16">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/70">
            {subtitle}
          </p>
        ) : null}
        <div className="hairline mt-8" />
      </div>
    </section>
  );
}
