import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../auth/AuthContext';
import { homeRouteForRole } from '../auth/RequireAuth';

export default function LoginAutoritePage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const actualRole = await login({ username, password });
      const isAutorite = ['autorite', 'admin', 'agent'].includes(actualRole);
      if (!isAutorite) {
        setError('Ce compte est un compte citoyen. Veuillez utiliser l\'espace de connexion citoyen.');
        setIsSubmitting(false);
        return;
      }
      navigate(from || homeRouteForRole(actualRole), { replace: true });
    } catch (err) {
      setError('Identifiant ou mot de passe autorité incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout variante="autorite">
      <div className="flex flex-col items-center justify-center w-full my-auto">
        <div className="w-full bg-white/95 backdrop-blur-md dark:bg-navy/95 rounded-2xl border border-white/60 dark:border-navy-800 p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-800 dark:text-navy-100 text-xs font-bold mb-2">
              <ShieldCheck size={14} /> Espace Officiel Sécurisé
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-navy-50">
              Portail Autorités & Secours
            </h1>
            <p className="text-xs text-navy-500 dark:text-navy-300 mt-1">
              Mairie de Thiaroye-sur-Mer, Sapeurs-Pompiers, ONAS, Délégués
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600 dark:text-navy-200">
                Identifiant Autorité
              </span>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex : autorite"
                className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-navy-900 dark:text-navy-50 text-sm focus:outline-none focus:border-red"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600 dark:text-navy-200">
                Mot de passe
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe confidentiel"
                className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-navy-900 dark:text-navy-50 text-sm focus:outline-none focus:border-red"
              />
            </label>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-semibold text-red hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red/15 text-red text-xs font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-red text-white text-sm font-bold disabled:opacity-60 hover:bg-red-700 transition shadow-sm cursor-pointer"
            >
              {isSubmitting ? 'Authentification...' : 'Accéder au Tableau de Bord'}
            </button>

            <p className="text-center text-xs text-navy-600 dark:text-navy-300 mt-2">
              Nouvel agent technique ?{' '}
              <Link to="/admin-register" className="font-bold text-red hover:underline">
                Demander une habilitation
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-[11px] text-white/90 mt-4 drop-shadow">
          MBEUND MI · Gestion de crise & Supervision Thiaroye-sur-Mer
        </p>
      </div>
    </AuthLayout>
  );
}
