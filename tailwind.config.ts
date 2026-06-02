import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bright: {
          ink: "#08111f",
          navy: "#0c1830",
          blue: "#3b82f6",
          cyan: "#22d3ee",
          green: "#20c997",
          cloud: "#f7fafc"
        }
      },
      boxShadow: {
        premium: "0 24px 70px rgba(8, 17, 31, 0.22)"
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        "soft-pulse": {
          "0%, 100%": { opacity: ".45", transform: "scale(.96)" },
          "50%": { opacity: ".9", transform: "scale(1.04)" }
        }
      },
      animation: {
        "slide-up": "slide-up .22s ease-out",
        "soft-pulse": "soft-pulse 1.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
