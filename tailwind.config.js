/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#003049",
          50: "#e6edf2",
          100: "#b3c7d6",
          200: "#80a1ba",
          300: "#4d7b9e",
          400: "#1a5582",
          500: "#003049",
          600: "#00273b",
          700: "#001d2d",
          800: "#00141f",
          900: "#000a11",
        },
        accent: {
          red: "#d62828",
          orange: "#f77f00",
          gold: "#fcbf49",
          cream: "#eae2b7",
        },
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#f8f9fa",
          muted: "#f1f3f5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        sm: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 48, 73, 0.1), 0 4px 6px -4px rgba(0, 48, 73, 0.05)",
        glow: "0 0 20px rgba(0, 48, 73, 0.15)",
        "accent-red": "0 4px 14px rgba(214, 40, 40, 0.25)",
        "accent-orange": "0 4px 14px rgba(247, 127, 0, 0.25)",
        card: "0 1px 3px rgba(0, 48, 73, 0.08), 0 1px 2px rgba(0, 48, 73, 0.06)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out",
        "slide-in": "slideIn 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
};