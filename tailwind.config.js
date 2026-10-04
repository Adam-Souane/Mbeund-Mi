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
        // Les nuances impaires (900, 700, 500, 300, 100) sont interpolées entre
        // les teintes de la charte : le code les utilise déjà (178 classes) et,
        // sans elles, Tailwind ne générait aucune couleur (texte illisible en
        // mode sombre).
        navy: {
          DEFAULT: '#1B2A40',
          950: '#0D1520',
          900: '#152236',
          800: '#2E4460',
          700: '#3C5470',
          600: '#4A6480',
          500: '#6A829C',
          400: '#8AA0B8',
          300: '#A8B9CB',
          200: '#C5D2DE',
          100: '#D8E1EA',
          50: '#EBF0F5',
        },
        red: {
          DEFAULT: '#C0182A',
          900: '#7A0A16',
          800: '#8D0D1B',
          700: '#A01020',
          600: '#B01425',
          500: '#C0182A',
          400: '#D94050',
          300: '#E8808A',
          200: '#F5BEC3',
          100: '#F9D6D9',
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
