/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        foreground: "#FAFAFA",
        card: "#18181B",
        primary: "#2563EB",
        primaryForeground: "#FAFAFA",
        secondary: "#3F3F46",
        muted: "#27272A",
        mutedForeground: "#A1A1AA",
        border: "#27272A",
        accent: "#27272A",
        destructive: "#ef4444",
      },
    },
  },
  plugins: [],
}
