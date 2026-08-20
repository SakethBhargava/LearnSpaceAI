import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-main)",
        card: "var(--card-bg)",
        foreground: "var(--text-primary)",
        muted: "var(--text-muted)",
        border: "var(--border-color)",
        primary: {
          DEFAULT: "var(--accent-primary)",
          hover: "var(--accent-hover)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
