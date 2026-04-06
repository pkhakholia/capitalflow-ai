import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#e5e7eb",
        input: "#e5e7eb",
        ring: "#e5e7eb",
        background: "#ffffff",
        foreground: "#000000",
        primary: "#6366f1",
        secondary: "#f1f5f9",
      },
    },
  },
  plugins: []
} satisfies Config;

