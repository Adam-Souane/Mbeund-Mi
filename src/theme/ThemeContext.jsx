import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext(null);

// Pages d'accueil et d'authentification : toujours en clair (bannière bleue,
// formulaire sur fond blanc), sans bouton de thème. Le choix du mode sombre
// reste enregistré et s'applique dès l'entrée dans l'application.
const PAGES_TOUJOURS_CLAIRES = ['/', '/login', '/signup', '/forgot-password', '/admin-register', '/otp-verify'];

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('mbeund_theme');
    // Clair par défaut, comme dans les maquettes validées.
    return saved ? saved === 'dark' : false;
  });

  const { pathname } = useLocation();
  const sombre = darkMode && !PAGES_TOUJOURS_CLAIRES.includes(pathname);

  useEffect(() => {
    localStorage.setItem('mbeund_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', sombre);
  }, [sombre]);

  const toggleTheme = () => setDarkMode((d) => !d);

  return (
    <ThemeContext.Provider value={{ darkMode: sombre, setDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé à l’intérieur de <ThemeProvider>.');
  return ctx;
}
