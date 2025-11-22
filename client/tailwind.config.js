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
        'paper': '#fdfbf7',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        calligraphy: ['"Ma Shan Zheng"', 'cursive'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      backgroundImage: {
        'pattern': "url('https://www.transparenttextures.com/patterns/cubes.png')",
      }
    },
  },
  plugins: [],
}
