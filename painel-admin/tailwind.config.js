/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#f9f506",
        "background-light": "#f8f8f5",
        "background-dark": "#23220f",
        "neutral-dark": "#181811",
        "neutral-light": "#f5f5f0",
        "accent-green": "#078816",
        "accent-red": "#e71708",
        "accent-gray": "#8c8b5f",
      },
      fontFamily: {
        "display": ["Spline Sans", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px",
      },
    },
  },
  plugins: [],
}

