/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F294A',
          'navy-dark': '#0A192F',
          'navy-light': '#1A3A63',
          red: '#E61C24',
          'red-dark': '#B91C1C',
          'red-light': '#FEE2E2',
          cyan: '#0284C7',
          sky: '#0EA5E9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
