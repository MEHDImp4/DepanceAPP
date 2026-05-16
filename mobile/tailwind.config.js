/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
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
