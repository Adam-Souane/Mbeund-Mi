import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={`w-9 h-9 rounded-full border border-navy-200 dark:border-navy-800 flex items-center justify-center text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors ${className}`}
    >
      {darkMode ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
