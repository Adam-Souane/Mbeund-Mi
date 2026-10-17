import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-navy-200 dark:border-navy-800 flex items-center justify-center text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors flex-shrink-0 cursor-pointer ${className}`}
    >
      {darkMode ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
