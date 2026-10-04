import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, MessageCircle, Mail, Eye, EyeOff } from 'lucide-react';
import Logo from '../shared/components/Logo';
import AuthLayout from './AuthLayout';
import { useTheme } from '../theme/ThemeContext';
import client from '../api/client';
import { useToast } from '../shared/toast/ToastContext';
import { BOUTON_PRINCIPAL, classeChamp, classeEtiquette, classeLienRenvoi, classeOption, ton } from './styles';

const DELAI_RENVOI = 60;

const TITRES = {
  1: 'Mot de passe oublié ?',
  2: 'Choisissez un nouveau mot de passe',
  3: 'Mot de passe modifié',
};

const CANAUX = [
  { value: 'telephone', label: 'SMS', Icon: MessageCircle },
  { value: 'email', label: 'Email', Icon: Mail },
];

// Parcours en 3 écrans : 1. demande du code, 2. code + nouveau mot de passe, 3. succès.
// Fonctionne pour tous les comptes (citoyen, autorité, admin) à partir de
// l'identifiant, du téléphone ou de l'email.
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [identifiant, setIdentifiant] = useState('');
  const [canal, setCanal] = useState('telephone');
  const [code, setCode] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [voirMotDePasse, setVoirMotDePasse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const champ = classeChamp(darkMode);
  const etiquette = classeEtiquette(darkMode);
  const boutonPrincipal = BOUTON_PRINCIPAL;
  const enAttente = resendTimer > 0;

  const demanderCode = async (e) => {
    e?.preventDefault();
    setError('');
    if (!identifiant.trim()) {
      setError('Identifiant, téléphone ou email requis');
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('/users/password-reset/', { identifiant: identifiant.trim(), canal });
      setMessage(data.detail);
      setStep(2);
      setResendTimer(DELAI_RENVOI);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l’envoi du code');
    } finally {
      setLoading(false);
    }
  };

  const confirmer = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Le code contient 6 chiffres');
      return;
    }
    if (motDePasse.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (motDePasse !== confirmation) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await client.post('/users/confirm-password-reset/', {
        identifiant: identifiant.trim(), code, new_password: motDePasse,
      });
      setStep(3);
      showToast('Mot de passe modifié', 'success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variante="motdepasse" className="px-6 py-10">
      <div className="w-full max-w-[420px] lg:max-w-[460px]">
        <button
          onClick={() => (step === 2 ? setStep(1) : navigate('/login'))}
          className={`flex items-center gap-2 mb-5 text-sm font-semibold transition ${ton(darkMode, 'text-navy-600 hover:text-navy-900', 'text-navy-400 hover:text-navy-200')}`}
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className="bg-white dark:bg-navy rounded-xl border border-navy-50 dark:border-navy-800 shadow-lg p-6 lg:p-8">
        {/* Sur écran large, le logo figure déjà dans la bannière de gauche */}
        <div className="text-center mb-5">
          <Logo size="md" className="mb-3 lg:hidden" />
          <h1 className={`text-xl lg:text-2xl font-bold ${ton(darkMode, 'text-navy-900', 'text-white')}`}>{TITRES[step]}</h1>
        </div>

        {step === 1 && (
          <form onSubmit={demanderCode} className="space-y-4">
            <p className={`text-sm ${ton(darkMode, 'text-navy-700', 'text-navy-300')}`}>
              Indiquez votre identifiant, votre numéro de téléphone ou votre email : nous vous enverrons un code à 6 chiffres.
            </p>
            <div>
              <label htmlFor="reset-identifiant" className={etiquette}>Identifiant, téléphone ou email</label>
              <input
                id="reset-identifiant"
                type="text"
                autoComplete="username"
                value={identifiant}
                onChange={(e) => {
                  setIdentifiant(e.target.value);
                  if (e.target.value.includes('@')) setCanal('email');
                  setError('');
                }}
                placeholder="77 123 45 67 ou email@exemple.com"
                className={champ}
              />
            </div>
            <fieldset>
              <legend className={etiquette}>Recevoir le code par</legend>
              <div className="grid grid-cols-2 gap-2">
                {CANAUX.map(({ value, label, Icon }) => (
                  <label
                    key={value}
                    className={classeOption(darkMode, canal === value)}
                  >
                    <input type="radio" name="canal" value={value} checked={canal === value} onChange={() => setCanal(value)} className="accent-red" />
                    <Icon size={16} aria-hidden="true" />
                    {label}
                  </label>
                ))}
              </div>
              {canal === 'email' && (
                <p className={`text-xs mt-2 ${ton(darkMode, 'text-navy-500', 'text-navy-400')}`}>
                  L’email doit avoir été renseigné sur votre compte. Sinon, choisissez SMS.
                </p>
              )}
            </fieldset>
            {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
            <button type="submit" disabled={loading} className={boutonPrincipal}>
              {loading ? 'Envoi...' : 'Recevoir le code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={confirmer} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className={`text-sm ${ton(darkMode, 'text-blue-900', 'text-blue-300')}`}>{message}</p>
            </div>
            <div>
              <label htmlFor="reset-code" className={etiquette}>Code à 6 chiffres</label>
              <input
                id="reset-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder="000000"
                className={`${champ} text-center text-2xl tracking-widest font-mono`}
              />
            </div>
            <div>
              <label htmlFor="reset-mdp" className={etiquette}>Nouveau mot de passe (8 caractères minimum)</label>
              <div className="relative">
                <input
                  id="reset-mdp"
                  type={voirMotDePasse ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={motDePasse}
                  onChange={(e) => { setMotDePasse(e.target.value); setError(''); }}
                  className={`${champ} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setVoirMotDePasse((v) => !v)}
                  className="absolute right-3 top-2.5"
                  aria-label={voirMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {voirMotDePasse ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="reset-confirmation" className={etiquette}>Confirmer le mot de passe</label>
              <input
                id="reset-confirmation"
                type={voirMotDePasse ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => { setConfirmation(e.target.value); setError(''); }}
                className={champ}
              />
            </div>
            {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
            <button type="submit" disabled={loading} className={boutonPrincipal}>
              {loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
            </button>
            <button
              type="button"
              onClick={() => demanderCode()}
              disabled={enAttente || loading}
              className={`block mx-auto text-sm font-semibold ${classeLienRenvoi(darkMode, enAttente)}`}
            >
              {enAttente ? `Renvoyer le code dans ${resendTimer} s` : 'Renvoyer le code'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <p className={`text-sm mb-8 ${ton(darkMode, 'text-navy-700', 'text-navy-300')}`}>
              Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.
            </p>
            <button onClick={() => navigate('/login')} className={boutonPrincipal}>
              Se connecter
            </button>
          </div>
        )}
        </div>
      </div>
    </AuthLayout>
  );
}
