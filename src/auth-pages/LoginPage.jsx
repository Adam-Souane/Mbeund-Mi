import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Logo from '../shared/components/Logo';
import ThemeToggle from '../theme/ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import { homeRouteForRole } from '../auth/RequireAuth';

const ROLES = [
  { id: 'citoyen', label: 'Citoyen', fieldLabel: 'Identifiant', placeholder: 'jeandupont' },
  { id: 'autorite', label: 'Autorite', fieldLabel: 'Identifiant', placeholder: 'jeandupont' },
];

export default function LoginPage() {
  const [tab, setTab] = useState('citoyen');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [mismatchNotice, setMismatchNotice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeRole = ROLES.find((r) => r.id === tab);
  const from = location.state?.from?.pathname;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMismatchNotice(null);
    setIsSubmitting(true);
    try {
      const actualRole = await login({ username, password });
      const isAutoriteRole = ['autorite', 'admin', 'agent'].includes(actualRole);
      const selectedAutorite = tab === 'autorite';

      if (selectedAutorite !== isAutoriteRole) {
        setError(
          isAutoriteRole
            ? "Error: This is an Authority account. Select Authority tab."
            : "Error: This is a Citizen account. Select Citizen tab."
        );
        setIsSubmitting(false);
        return;
      }

      navigate(from || homeRouteForRole(actualRole), { replace: true });
    } catch {
      setError('Identifiant ou mot de passe incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-navy-50 dark:bg-navy-950 relative">
      <ThemeToggle className="absolute top-7 right-8" />

      <div className="w-full max-w-[420px] lg:max-w-[480px]">
        <div className="flex flex-col items-center mb-7 lg:mb-9">
          <Logo size="lg" className="lg:scale-125 lg:mb-2" withSlogan />
        </div>

        <div className="bg-white dark:bg-navy rounded-xl border border-navy-50 dark:border-navy-800 shadow-lg p-7 lg:p-9">
          <div className="flex bg-navy-50 dark:bg-navy-800 rounded-md p-1 mb-5 lg:mb-6">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setTab(r.id);
                  setUsername('');
                  setPassword('');
                  setError(null);
                  setMismatchNotice(null);
                }}
                className={`flex-1 text-center py-2 rounded-md text-sm transition-colors ${
                  tab === r.id
                    ? 'bg-white dark:bg-navy text-navy dark:text-navy-50 font-bold shadow'
                    : 'text-navy-600 dark:text-navy-200 font-semibold'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4 lg:gap-5">
            <label className="block">
              <span className="block text-xs lg:text-sm font-semibold text-navy dark:text-navy-50 mb-1.5">
                {activeRole.fieldLabel}
              </span>
              <input
                type="text"
                required
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={activeRole.placeholder}
                className="w-full px-3.5 py-2.5 lg:py-3 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-navy dark:text-navy-50 placeholder:text-navy-400 text-sm lg:text-base focus:outline-none focus:border-navy dark:focus:border-navy-50"
              />
            </label>

            <label className="block">
              <span className="block text-xs lg:text-sm font-semibold text-navy dark:text-navy-50 mb-1.5">Mot de passe</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="........"
                className="w-full px-3.5 py-2.5 lg:py-3 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-navy dark:text-navy-50 text-sm lg:text-base focus:outline-none focus:border-navy dark:focus:border-navy-50"
              />
            </label>

            {tab === 'citoyen' && (
              <div className="text-right -mt-2">
                <Link to="/forgot-password" className="text-xs font-semibold text-red cursor-pointer hover:underline">
                  Mot de passe oublie ?
                </Link>
              </div>
            )}

            {error && (
              <div className="px-3 py-2.5 rounded-md bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs">
                {error}
              </div>
            )}
            {mismatchNotice && (
              <div className="px-3 py-2.5 rounded-md bg-navy-50 dark:bg-navy-800 text-navy dark:text-navy-50 text-xs">
                {mismatchNotice}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 lg:py-3.5 rounded-md bg-navy dark:bg-navy-800 text-white text-sm lg:text-base font-bold disabled:opacity-60"
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>

            {tab === 'citoyen' && (
              <p className="text-center text-xs text-navy-600 dark:text-navy-200">
                Pas encore de compte ?{' '}
                <Link to="/signup?role=citoyen" className="font-bold text-red hover:underline">
                  Creer un compte citoyen
                </Link>
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-[11px] text-navy-400 mt-5">
          MBEUND MI - Thiaroye-sur-Mer
        </p>
      </div>
    </div>
  );
}
