import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: "#060D17",
          900: "#0B192C",
          800: "#142845",
          700: "#1E3E62",
          500: "#008DDA",
          400: "#41C9E2",
          300: "#ACE2E1",
          100: "#F7EEDD",
        },
        mangrove: {
          900: "#064E3B",
          700: "#047857",
          500: "#10B981",
          400: "#34D399",
          300: "#6EE7B7",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
