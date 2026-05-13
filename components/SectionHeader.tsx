type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left"
}: Props) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`${alignClass} max-w-2xl`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-2 font-display text-3xl sm:text-4xl text-white">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-base text-white/65">{subtitle}</p>
      ) : null}
    </div>
  );
}
