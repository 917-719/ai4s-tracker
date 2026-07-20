import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ai4s: {
          blue: "#2563EB",
          teal: "#0D9488",
          purple: "#7C3AED",
          amber: "#D97706",
        },
        score: {
          high: "#16A34A",
          mid: "#CA8A04",
          low: "#6B7280",
        },
      },
    },
  },
  plugins: [],
};

export default config;
