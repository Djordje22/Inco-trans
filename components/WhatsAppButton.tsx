import { siteConfig } from "@/lib/site-config";
import WhatsAppMark from "./icons/WhatsAppMark";

type Props = {
  label: string;
  variant?: "gold" | "ghost";
  className?: string;
};

export default function WhatsAppButton({
  label,
  variant = "gold",
  className
}: Props) {
  const base = variant === "gold" ? "btn-gold" : "btn-ghost";
  return (
    <a
      href={siteConfig.contact.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? base}
      data-cta="whatsapp"
    >
      <WhatsAppMark className="h-4 w-4" />
      {label}
    </a>
  );
}
