import { Moon, LogOut, ShieldCheck } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';

const ROLE_LABELS = {
  citoyen: 'Citoyen',
  autorite: 'Autorité',
  admin: 'Administrateur',
};

export default function ProfilPageBody() {
  const { username, role, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const initial = username?.[0]?.toUpperCase() ?? '?';

  return (
    <CitizenShell>
      <div className="max-w-lg lg:max-w-2xl w-full mx-auto flex flex-col gap-5 lg:justify-center lg:min-h-[65vh]">
        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-navy dark:bg-navy-800 text-white flex items-center justify-center text-xl font-extrabold flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold truncate">{username ?? 'Utilisateur'}</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-600 dark:text-navy-200 mt-1">
              <ShieldCheck size={13} />
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase text-navy-400 mb-3">Préférences</h3>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 text-sm font-semibold">
              <Moon size={16} />
              Mode sombre
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              role="switch"
              aria-checked={darkMode}
              aria-label="Activer le mode sombre"
              className={`w-11 h-6 rounded-pill transition-colors flex-shrink-0 ${darkMode ? 'bg-navy dark:bg-navy-50' : 'bg-navy-200'}`}
            >
              <span
                className={`block w-5 h-5 rounded-full shadow transform transition-transform ${
                  darkMode ? 'translate-x-5 bg-white dark:bg-navy' : 'translate-x-0.5 bg-white'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 text-sm font-bold text-red border-[1.5px] border-red rounded-md px-4 py-3"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </CitizenShell>
  );
}
