import { Inter, Playfair_Display } from "next/font/google";

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter"
});

export const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-display",
  weight: ["500", "600", "700"]
});
