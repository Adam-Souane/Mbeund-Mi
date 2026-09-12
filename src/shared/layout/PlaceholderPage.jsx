import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';

// Évite les liens morts pendant que les pages des phases suivantes ne sont
// pas encore construites — jamais un 404, un état honnête "à venir".
export default function PlaceholderPage({ title, backTo }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {backTo && (
            <button onClick={() => navigate(backTo)} className="p-1">
              <ArrowLeft size={18} />
            </button>
          )}
          <Logo size="sm" />
        </div>
        <ThemeToggle />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <p className="text-sm font-semibold text-navy dark:text-navy-50">{title}</p>
        <p className="text-xs text-navy-400">Cet écran arrive dans une prochaine phase de la reconstruction.</p>
      </div>
    </div>
  );
}
