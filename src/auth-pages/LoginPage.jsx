import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../auth/AuthContext';
import { homeRouteForRole } from '../auth/RequireAuth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const actualRole = await login({ username: username.trim(), password });
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
            codeSimule: refus.otp?.code_simule || '',
          },
        });
        return;
      }
      if (!err.response && (err.message === 'Network Error' || err.code === 'ECONNABORTED')) {
        setError('Erreur réseau ou de communication avec le serveur. Veuillez réessayer.');
        return;
      }
      setError('Identifiant ou mot de passe incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout variante="connexion">
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-7 sm:p-9 transition-all">
        {/* En-tête de la carte */}
        <div className="mb-5 text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight">
            Connexion Citoyenne
          </h1>
          <p className="text-sm text-[#64748B] mt-1 leading-relaxed">
            Suivez en temps réel les risques d’inondation à Thiaroye-sur-Mer.
          </p>
        </div>

        {/* Bloc d'urgence prioritaire sans compte - Visible immédiatement sur desktop et mobile */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50/60 border-2 border-red-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#CC131A] text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert size={20} />
            </div>
            <div>
              <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-[#CC131A] bg-red-100/90 px-2 py-0.5 rounded-full mb-0.5">
                Urgence Immédiate
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-[#0B2545] leading-tight">
                Consulter les alertes et la carte sans créer de compte
              </h2>
            </div>
          </div>
          <Link
            to="/citoyen/accueil"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#CC131A] hover:bg-red-700 active:scale-95 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>Accès sans compte</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Séparateur clair avec texte */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            ou connectez-vous avec vos identifiants
          </span>
        </div>

        {/* Message d'erreur visible si problème */}
        {error && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5 bg-red-50 border border-[#BE123C]/30 text-xs text-[#BE123C]">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-[#BE123C]" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Formulaire de connexion */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Identifiant ou numéro de téléphone */}
          <div>
            <label htmlFor="login-username" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Identifiant ou Numéro de téléphone <span className="text-[#BE123C]">*</span>
            </label>
            <input
              id="login-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex : 77 123 45 67 ou identifiant"
              className="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] transition-colors"
            />
          </div>

          {/* Mot de passe avec toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Mot de passe <span className="text-[#BE123C]">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#CC131A] hover:text-[#A01016] hover:underline transition"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full h-12 px-3.5 pr-11 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Bouton principal de connexion */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-[#0B2545] hover:bg-[#154275] active:bg-[#07182D] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>

          {/* Lien secondaire vers inscription citoyenne */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs">
            <span className="text-[#0B2545] font-medium">
              Pas encore de compte ?{' '}
            </span>
            <Link
              to="/signup"
              className="font-bold text-[#CC131A] hover:text-[#A01016] hover:underline transition"
            >
              Créer un compte
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
