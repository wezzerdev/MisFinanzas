import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: "#0a0a0a",
          900: "#121212",
          800: "#181818",
          700: "#222222",
          border: "#262626",
        },
        corporate: {
          primary: "#009fdb",
          "primary-hover": "#0088bd",
          deep: "#153D64",
        },
        fintech: {
          blue: "#009fdb",
          "blue-dark": "#153D64",
          navy: "#0a0a0a",
          surface: "#121212",
          emerald: "#10b981",
          rose: "#e11d48",
        },
      },
      minHeight: {
        touch: "48px",
      },
      minWidth: {
        touch: "48px",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
        card: "0 12px 28px -6px rgba(0, 0, 0, 0.7), 0 8px 12px -6px rgba(0, 0, 0, 0.5)",
        glow: "0 0 18px -4px rgba(0, 159, 219, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
