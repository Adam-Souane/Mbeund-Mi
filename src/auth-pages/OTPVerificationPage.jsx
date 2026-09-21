import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import Logo from '../shared/components/Logo';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import client from '../api/client';
import { useToast } from '../shared/toast/ToastContext';

export default function OTPVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  const { login } = useAuth();
  const { showToast } = useToast();

  const email = location.state?.email || '';
  const phoneNumber = location.state?.phoneNumber || '';
  const username = location.state?.username || '';

  const [step, setStep] = useState(1); // 1: OTP input, 2: success
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  if (!username) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-navy-950' : 'bg-navy-50'} p-4`}>
        <div className="w-full max-w-md text-center">
          <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-navy-900'}`}>
            Erreur : données manquantes
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="mt-4 text-navy-600 dark:text-navy-400 hover:underline"
          >
            Retour à l'inscription
          </button>
        </div>
      </div>
    );
  }

  const handleSubmitOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Code OTP requis');
      return;
    }

    if (otp.length < 6) {
      setError('Le code OTP doit avoir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const response = await client.post('/users/verify-otp/', {
        username,
        otp,
      });

      showToast('Vérification réussie ! Connexion en cours...', 'success');
      setStep(2);

      // Auto-login après 1.5 secondes
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Connexion automatique
      try {
        await login({ username, password: location.state?.password || '' });
        navigate('/citoyen/accueil', { replace: true });
      } catch {
        // Si auto-login échoue, rediriger vers login
        navigate('/login', { state: { tab: 'citoyen' }, replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Code OTP invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await client.post('/users/resend-otp/', { username });
      showToast('Code OTP renvoyé', 'success');
      setResendTimer(60);

      // Countdown timer
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-navy-950' : 'bg-navy-50'} p-4`}>
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/signup')}
          className={`flex items-center gap-2 mb-8 ${darkMode ? 'text-navy-400 hover:text-navy-200' : 'text-navy-600 hover:text-navy-900'} transition`}
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className="text-center mb-8">
          <Logo size="lg" />
          <h1 className={`text-2xl font-bold mt-4 ${darkMode ? 'text-white' : 'text-navy-900'}`}>
            {step === 1 ? 'Vérifier votre identité' : 'Vérification réussie'}
          </h1>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmitOTP} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex gap-2">
                <Clock size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>
                    Code OTP envoyé
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'} mt-1`}>
                    {email ? `Email: ${email}` : `Téléphone: ${phoneNumber}`}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-navy-200' : 'text-navy-700'} mb-2`}>
                Code OTP (6 chiffres minimum)
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setError('');
                }}
                placeholder="000000"
                maxLength="8"
                className={`w-full px-4 py-3 rounded-lg border text-center text-2xl tracking-widest font-mono ${
                  error
                    ? 'border-red-500'
                    : darkMode
                      ? 'border-navy-700 bg-navy-900 text-white'
                      : 'border-navy-200 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-navy-500`}
              />
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy dark:bg-navy-800 text-white py-3 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-900 transition disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </button>

            <div className="text-center pt-4">
              <p className={`text-sm ${darkMode ? 'text-navy-400' : 'text-navy-600'}`}>
                Vous n'avez pas reçu le code ?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                className={`text-sm font-semibold mt-2 ${
                  resendTimer > 0
                    ? `${darkMode ? 'text-navy-600' : 'text-navy-400'} cursor-not-allowed`
                    : `text-navy-600 dark:text-navy-400 hover:underline`
                }`}
              >
                {resendTimer > 0 ? `Renvoyer dans ${resendTimer}s` : 'Renvoyer le code'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-navy-900'} mb-2`}>
              Vérification réussie !
            </p>
            <p className={`text-sm ${darkMode ? 'text-navy-300' : 'text-navy-700'} mb-6`}>
              Vous pouvez maintenant accéder à votre compte citoyen.
            </p>
            <p className={`text-xs ${darkMode ? 'text-navy-400' : 'text-navy-600'}`}>
              Redirection en cours vers le tableau de bord...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
