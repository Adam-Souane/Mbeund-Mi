import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Zap } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../auth/AuthContext';
import { homeRouteForRole } from '../auth/RequireAuth';
import { setTokens } from '../auth/tokenStorage';

/** Génère un faux JWT pour la démo sans backend. */
function genFakeJwt(payload) {
  const enc = (obj) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  })}.demo`;
}

const DEMO_COMPTES = [
  { label: '👤 Citoyen', username: 'citoyen', role: 'citoyen', color: '#0B2545' },
  { label: '🏛️ Autorité', username: 'autorite', role: 'autorite', color: '#065F46' },
];

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
        navigate('/verify-otp', {
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

  /** Connexion démo sans backend : injecte un faux JWT dans localStorage et recharge. */
  function handleDemo(compte) {
    const fakeJwt = genFakeJwt({ user_id: compte.role === 'citoyen' ? 1 : 2, username: compte.username, role: compte.role });
    setTokens({ access: fakeJwt, refresh: fakeJwt, username: compte.username });
    window.location.replace(homeRouteForRole(compte.role));
  }

  return (
    <AuthLayout variante="connexion">
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-7 sm:p-9 transition-all">
        {/* En-tête de la carte */}
        <div className="mb-6 text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight">
            Connexion Citoyenne
          </h1>
          <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
            Suivez en temps réel les risques d’inondation à Thiaroye-sur-Mer.
          </p>
        </div>

        {/* Boutons de démo rapide */}
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
            <Zap size={11} /> Accès démo instantané (sans backend)
          </p>
          <div className="flex gap-2">
            {DEMO_COMPTES.map((c) => (
              <button
                key={c.role}
                type="button"
                onClick={() => handleDemo(c)}
                style={{ background: c.color }}
                className="flex-1 h-9 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-all shadow"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">ou connexion réelle</span>
          <div className="flex-1 h-px bg-slate-200" />
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
