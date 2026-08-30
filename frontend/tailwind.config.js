/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf3",
          100: "#d6f9e2",
          500: "#0f9d58",
          600: "#0c8248",
          700: "#0a6a3b",
        },
      },
    },
  },
  plugins: [],
};
