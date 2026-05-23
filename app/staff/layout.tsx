import { inter, playfair } from "@/lib/fonts";
import "../globals.css";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-ink-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
