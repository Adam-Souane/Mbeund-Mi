export const Brand = {
  // Charte exacte de Mbeund-Mi tirée de tailwind.config.js
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
  risk: {
    vert: '#3C9A5F',
    jaune: '#E3B341',
    orange: '#E0792E',
    rouge: '#C0182A',
  },
  background: '#F6F8FB',
  surface: '#FFFFFF',
} as const;

export const Radius = { sm: 4, md: 8, lg: 12, xl: 16, pill: 24 } as const;

export const Shadow = {
  card: {
    shadowColor: '#1B2A40',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
