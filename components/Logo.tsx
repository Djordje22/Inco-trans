import Image from "next/image";
import Link from "next/link";

type Props = {
  href: string;
  brand: string;
  tagline?: string;
};

export default function Logo({ href, brand, tagline }: Props) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 group"
      aria-label={`${brand} ${tagline ?? ""}`.trim()}
    >
      <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-white/10 bg-black/30">
        <Image
          src="/brand/inco_logo_icon_256.png"
          alt=""
          width={36}
          height={36}
          priority
          className="h-9 w-9 object-contain"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-base sm:text-lg tracking-wide text-white">
          {brand}
        </span>
        {tagline ? (
          <span className="mt-1 hidden text-[11px] uppercase tracking-[0.22em] text-white/55 sm:block">
            {tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
