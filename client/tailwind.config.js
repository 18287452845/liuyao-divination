/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#c8102e',
        secondary: '#2d5016',
        accent: '#d4af37',
        dark: '#1a1a1a',
      },
    },
  },
  plugins: [],
}
