/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Charte graphique MBEUND MI
        navy: {
          DEFAULT: '#1B2A40',
          950: '#0D1520',
          800: '#2E4460',
          600: '#4A6480',
          400: '#8AA0B8',
          200: '#C5D2DE',
          50: '#EBF0F5',
        },
        red: {
          DEFAULT: '#C0182A',
          900: '#7A0A16',
          700: '#A01020',
          400: '#D94050',
          300: '#E8808A',
          200: '#F5BEC3',
          50: '#FCEDEF',
        },
        // Niveaux de risque (ZoneRisque.niveau_risque) — non liés à la charte
        // de marque, ce sont des couleurs sémantiques dédiées.
        risk: {
          vert: '#3C9A5F',
          jaune: '#E3B341',
          orange: '#E0792E',
          rouge: '#C0182A',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        pill: '24px',
      },
    },
  },
  plugins: [],
}
