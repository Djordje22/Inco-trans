import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08080a",
          900: "#0c0c0f",
          800: "#141418",
          700: "#1d1d23",
          600: "#26262d"
        },
        gold: {
          50: "#fffaeb",
          100: "#fff1c2",
          200: "#ffe387",
          300: "#ffd24a",
          400: "#f5bf26",
          500: "#e5a90c",
          600: "#c18807",
          700: "#9a6708",
          800: "#7c500d",
          900: "#67410f"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"]
      },
      backgroundImage: {
        "radial-gold":
          "radial-gradient(ellipse at top, rgba(245,191,38,0.18), transparent 60%)",
        "hero-fade":
          "linear-gradient(to bottom, rgba(8,8,10,0.20) 0%, rgba(8,8,10,0.65) 60%, rgba(8,8,10,0.92) 100%)"
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0,0,0,0.45)",
        gold: "0 10px 30px -10px rgba(245,191,38,0.55)"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both"
      }
    }
  },
  plugins: []
};

export default config;
