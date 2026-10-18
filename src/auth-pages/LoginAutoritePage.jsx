import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../auth/AuthContext';
import { homeRouteForRole } from '../auth/RequireAuth';

export default function LoginAutoritePage() {
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
      const isAutorite = ['autorite', 'admin', 'agent'].includes(actualRole);
      if (!isAutorite) {
        setError('Ce compte est un compte citoyen. Veuillez utiliser le portail citoyen.');
        setIsSubmitting(false);
        return;
      }
      navigate(from || homeRouteForRole(actualRole), { replace: true });
    } catch (err) {
      setError('Identifiant ou mot de passe administrateur incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout variante="autorite">
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-7 sm:p-9 transition-all">
        {/* En-tête de la carte */}
        <div className="mb-6 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[#0B3B60] text-xs font-bold mb-3">
            <ShieldCheck size={14} className="text-[#087E8B]" />
            <span>Portail Officiel Sécurisé</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B3B60] tracking-tight">
            Connexion Administrateur & Autorités
          </h1>
          <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
            Supervision hydrologique, gestion de crise et coordination communale à Thiaroye-sur-Mer.
          </p>
        </div>

        {/* Message d'erreur visible si problème d'authentification */}
        {error && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5 bg-red-50 border border-[#BE123C]/30 text-xs text-[#BE123C]">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-[#BE123C]" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Raccourcis Démo PFE (1-Clic) */}
        <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#0B3B60] flex items-center gap-1.5">
              <span>🎯</span>
              <span>Boutons Démo Soutenance (1-Clic) :</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Pré-remplissage</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setUsername('autorite');
                setPassword('Password123!');
                setError(null);
              }}
              className="py-2 px-2 rounded-lg bg-white border border-slate-200 hover:border-[#0B3B60] hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer text-center shadow-xs"
            >
              🏛️ Autorité (Moussa)
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('Password123!');
                setError(null);
              }}
              className="py-2 px-2 rounded-lg bg-white border border-slate-200 hover:border-[#0B3B60] hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer text-center shadow-xs"
            >
              🛡️ Admin (Ousmane)
            </button>
          </div>
        </div>

        {/* Formulaire de connexion */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Identifiant ou e-mail */}
          <div>
            <label htmlFor="auth-username" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Identifiant ou e-mail professionnel <span className="text-[#BE123C]">*</span>
            </label>
            <input
              id="auth-username"
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex : admin.thiaroye ou nom@thiaroye.sn"
              className="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] transition-colors"
            />
          </div>

          {/* Mot de passe avec toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="auth-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full h-12 px-3.5 pr-11 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] transition-colors"
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

          {/* Bouton principal de connexion : bleu exact du logo (#0B2545) au repos et bleu clair au hover (#154275) */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-[#0B2545] hover:bg-[#154275] active:bg-[#07182D] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authentification en cours...</span>
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>

          {/* Lien secondaire vers création de compte */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs">
            <span className="text-[#0B2545] font-medium">
              Vous disposez d'un code d'invitation ?{' '}
            </span>
            <Link
              to="/admin-register"
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
