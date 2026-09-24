import { memo, useCallback, useState } from 'react';
import { Moon, ShieldCheck, Copy, Check } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeContext';

const ROLE_LABELS = {
  citoyen: 'Citoyen',
  autorite: 'Autorité',
  admin: 'Administrateur',
};

function ProfileHeaderComponent() {
  const { username, role } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [copiedUsername, setCopiedUsername] = useState(false);

  const initial = username?.[0]?.toUpperCase() ?? '?';

  const copyUsername = useCallback(() => {
    navigator.clipboard.writeText(username);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  }, [username]);

  return (
    <div className="w-full flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">
      {/* Identity Card */}
      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
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

        <div className="border-t border-navy-100 dark:border-navy-700 pt-4">
          <p className="text-xs font-semibold text-navy-600 dark:text-navy-400 mb-2">Identifiant de connexion</p>
          <div className="flex items-center gap-2 bg-navy-50 dark:bg-navy-800 px-3 py-2.5 rounded-lg">
            <code className="text-sm font-mono font-semibold text-navy dark:text-white flex-1">{username}</code>
            <button
              type="button"
              onClick={copyUsername}
              className="text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white transition flex-shrink-0"
              title="Copier l'identifiant"
            >
              {copiedUsername ? <Check size={16} className="text-risk-vert" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Card */}
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
    </div>
  );
}

export const ProfileHeader = memo(ProfileHeaderComponent);
