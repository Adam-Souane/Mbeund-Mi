import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, RotateCw, Mail } from 'lucide-react';
import Logo from '../shared/components/Logo';
import AuthLayout from './AuthLayout';
import useCanauxOtp from './useCanauxOtp';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import client from '../api/client';
import { useToast } from '../shared/toast/ToastContext';
import { BOUTON_PRINCIPAL, CARTE, classeChamp, classeLienRenvoi, ton } from './styles';

// Le serveur impose 60 s entre deux envois : le compte à rebours démarre
// dès l'arrivée sur la page, puisque le premier code vient d'être envoyé.
const DELAI_RENVOI = 60;

const LIBELLE_CANAL = { telephone: 'par SMS', email: 'par email' };

function CodeEnvoye({ darkMode, canal, destination }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex gap-3">
        <Clock size={22} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className={`text-sm font-bold ${ton(darkMode, 'text-blue-900', 'text-blue-200')}`}>
            Code de validation envoyé {LIBELLE_CANAL[canal]}
          </p>
          {destination && (
            <p className={`text-xs mt-1 font-mono font-medium ${ton(darkMode, 'text-blue-800', 'text-blue-300')}`}>
              {canal === 'email' ? `Envoyé à : ${destination} (pensez aux courriers indésirables)` : `Envoyé au numéro : ${destination}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function VerificationReussie({ darkMode }) {
  return (
    <div className="text-center py-8">
      <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
      <p className={`text-lg font-semibold mb-2 ${ton(darkMode, 'text-navy-900', 'text-white')}`}>Vérification réussie !</p>
      <p className={`text-sm mb-6 ${ton(darkMode, 'text-navy-700', 'text-navy-300')}`}>
        Vous pouvez maintenant accéder à votre compte citoyen.
      </p>
      <p className={`text-xs ${ton(darkMode, 'text-navy-600', 'text-navy-400')}`}>Redirection en cours vers le tableau de bord…</p>
    </div>
  );
}

export default function OTPVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  const { login } = useAuth();
  const { showToast } = useToast();

  const etat = location.state || {};
  const username = etat.username || '';
  const { smsDisponible } = useCanauxOtp();

  const [canal, setCanal] = useState(etat.canal || 'telephone');
  const [destination, setDestination] = useState(etat.destination || '');
  const [reussi, setReussi] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(DELAI_RENVOI);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  if (!username) {
    return (
      <AuthLayout variante="verification" className="px-6 py-10">
        <div className="w-full max-w-[480px] lg:max-w-[560px] text-center">
          <p className={`text-lg font-semibold ${ton(darkMode, 'text-navy-900', 'text-white')}`}>Erreur : données manquantes</p>
          <button onClick={() => navigate('/signup')} className="mt-4 text-navy-600 dark:text-navy-400 hover:underline">
            Retour à l’inscription
          </button>
        </div>
      </AuthLayout>
    );
  }

  const connecter = async () => {
    try {
      await login({ username, password: etat.password || '' });
      navigate('/citoyen/accueil', { replace: true });
    } catch {
      navigate('/login', { state: { tab: 'citoyen' }, replace: true });
    }
  };

  const handleSubmitOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Le code contient 6 chiffres');
      return;
    }
    setLoading(true);
    try {
      await client.post('/users/verify-otp/', { username, otp });
      showToast('Vérification réussie ! Connexion en cours...', 'success');
      setReussi(true);
      setTimeout(connecter, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Code OTP invalide');
    } finally {
      setLoading(false);
    }
  };

  const renvoyer = async (canalDemande) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/users/resend-otp/', { username, canal: canalDemande });
      setCanal(data.canal);
      setDestination(data.destination);
      setOtp('');
      showToast(data.detail || 'Nouveau code envoyé', 'success');
      setResendTimer(DELAI_RENVOI);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l’envoi du code');
      if (err.response?.status === 429) setResendTimer(DELAI_RENVOI);
    } finally {
      setLoading(false);
    }
  };

  const enAttente = resendTimer > 0;
  const autreCanal = canal === 'email' ? 'telephone' : 'email';
  const peutChangerDeCanal = Boolean(etat.emailDisponible) && (autreCanal === 'email' || smsDisponible);

  return (
    <AuthLayout variante="verification" className="px-6 py-10">
      <div className="w-full max-w-[480px] lg:max-w-[560px]">
        <button
          onClick={() => navigate('/signup')}
          className={`flex items-center gap-2 mb-8 transition ${ton(darkMode, 'text-navy-600 hover:text-navy-900', 'text-navy-400 hover:text-navy-200')}`}
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className="text-center mb-6 lg:mb-5">
          <div className="lg:hidden mb-3">
            <Logo size="lg" />
          </div>
          <h1 className={`text-2xl font-bold ${ton(darkMode, 'text-navy-900', 'text-white')}`}>
            {reussi ? 'Vérification réussie' : 'Vérifier votre identité'}
          </h1>
        </div>

        <div className={CARTE}>
          {reussi ? (
            <VerificationReussie darkMode={darkMode} />
          ) : (
            <form onSubmit={handleSubmitOTP} className="space-y-4">
              <CodeEnvoye darkMode={darkMode} canal={canal} destination={destination} />

              <div>
                <label htmlFor="otp-code" className={`block text-sm font-medium mb-2 ${ton(darkMode, 'text-navy-700', 'text-navy-200')}`}>
                  Code à 6 chiffres
                </label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className={`${classeChamp(darkMode, Boolean(error))} py-3 text-center text-2xl tracking-widest font-mono`}
                />
                {error && <p className="text-xs text-red-500 mt-2" role="alert">{error}</p>}
              </div>

              <button type="submit" disabled={loading} className={BOUTON_PRINCIPAL}>
                {loading ? 'Vérification...' : 'Vérifier le code'}
              </button>

              <div className="pt-5 border-t border-navy-100 dark:border-navy-800 mt-6 space-y-3">
                <p className={`text-xs font-semibold uppercase tracking-wider text-center ${ton(darkMode, 'text-navy-500', 'text-navy-400')}`}>
                  Vous n’avez pas reçu le code ?
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => renvoyer(canal)}
                    disabled={enAttente || loading}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition shadow-sm ${
                      enAttente
                        ? 'bg-navy-50 dark:bg-navy-800/50 text-navy-400 border-navy-200 dark:border-navy-700 cursor-not-allowed'
                        : 'bg-navy text-white hover:bg-navy-700 border-navy cursor-pointer'
                    }`}
                  >
                    <RotateCw size={15} className={enAttente ? 'animate-spin' : ''} />
                    <span>{enAttente ? `Renvoyer (${resendTimer} s)` : 'Renvoyer le code'}</span>
                  </button>

                  {peutChangerDeCanal && (
                    <button
                      type="button"
                      onClick={() => renvoyer(autreCanal)}
                      disabled={enAttente || loading}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition shadow-sm ${
                        enAttente
                          ? 'bg-navy-50 dark:bg-navy-800/50 text-navy-400 border-navy-200 dark:border-navy-700 cursor-not-allowed'
                          : 'bg-red-500 text-white hover:bg-red-600 border-red-500 cursor-pointer'
                      }`}
                    >
                      <Mail size={15} />
                      <span>Recevoir par Email</span>
                    </button>
                  )}
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="text-xs text-navy-500 hover:text-navy-900 dark:hover:text-navy-200 underline inline-flex items-center gap-1 font-medium transition"
                  >
                    <span>Numéro incorrect ou faute de frappe ? Modifier mes informations</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
