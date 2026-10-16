import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { useAuth } from '../auth/AuthContext';
import { homeRouteForRole } from '../auth/RequireAuth';

export default function LoginPage() {
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
      navigate(from || homeRouteForRole(actualRole), { replace: true });
    } catch (err) {
      const refus = err.response?.data;
      if (refus?.code === 'compte_non_verifie') {
        navigate('/otp-verify', {
          state: {
            username: refus.username,
            password,
            canal: refus.otp?.canal,
            destination: refus.otp?.destination,
            emailDisponible: refus.otp?.email_disponible,
          },
        });
        return;
      }
      setError('Identifiant ou mot de passe incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout variante="connexion">
      <div className="flex flex-col items-center justify-center w-full my-auto">
        <div className="w-full bg-white/95 backdrop-blur-md dark:bg-navy/95 rounded-2xl border border-white/60 dark:border-navy-800 p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-navy-50">
              Connexion Citoyenne
            </h1>
            <p className="text-xs text-navy-500 dark:text-navy-300 mt-1">
              Plateforme de vigilance et prévention · Thiaroye-sur-Mer
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600 dark:text-navy-200">
                Identifiant ou Téléphone
              </span>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex : citoyen ou 771234567"
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
                placeholder="Votre mot de passe"
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
              className="w-full py-3 rounded-xl bg-red text-white text-sm font-bold disabled:opacity-60 hover:bg-red-700 transition shadow-sm"
            >
              {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
            </button>

            <p className="text-center text-xs text-navy-600 dark:text-navy-300 mt-2">
              Pas encore de compte ?{' '}
              <Link to="/signup" className="font-bold text-red hover:underline">
                Créer un compte citoyen
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-[11px] text-white/90 mt-4 drop-shadow">
          MBEUND MI · Thiaroye-sur-Mer
        </p>
      </div>
    </AuthLayout>
  );
}
