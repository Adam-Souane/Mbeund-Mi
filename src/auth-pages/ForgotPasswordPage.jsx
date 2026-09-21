import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Logo from '../shared/components/Logo';
import { useTheme } from '../theme/ThemeContext';
import client from '../api/client';
import { useToast } from '../shared/toast/ToastContext';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1: email input, 2: success
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email requis');
      return;
    }

    if (!email.includes('@')) {
      setError('Email invalide');
      return;
    }

    setLoading(true);
    try {
      await client.post('/users/password-reset/', { email });
      setStep(2);
      showToast('Email de réinitialisation envoyé', 'success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-navy-950' : 'bg-navy-50'} p-4`}>
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/login')}
          className={`flex items-center gap-2 mb-8 ${darkMode ? 'text-navy-400 hover:text-navy-200' : 'text-navy-600 hover:text-navy-900'} transition`}
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className="text-center mb-8">
          <Logo size="lg" />
          <h1 className={`text-2xl font-bold mt-4 ${darkMode ? 'text-white' : 'text-navy-900'}`}>
            {step === 1 ? 'Mot de passe oublié ?' : 'Email envoyé'}
          </h1>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className={`text-sm ${darkMode ? 'text-navy-300' : 'text-navy-700'} mb-6`}>
              Entrez votre email pour recevoir les instructions de réinitialisation.
            </p>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-navy-200' : 'text-navy-700'} mb-1`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="email@exemple.com"
                className={`w-full px-4 py-2 rounded-lg border ${
                  error
                    ? 'border-red-500'
                    : darkMode
                      ? 'border-navy-700 bg-navy-900 text-white'
                      : 'border-navy-200 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-navy-500`}
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-900 dark:bg-navy-600 text-white py-3 rounded-lg font-semibold hover:bg-navy-800 dark:hover:bg-navy-500 transition disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer les instructions'}
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <p className={`text-sm ${darkMode ? 'text-navy-300' : 'text-navy-700'} mb-6`}>
              Un email avec les instructions de réinitialisation a été envoyé à <strong>{email}</strong>
            </p>
            <p className={`text-xs ${darkMode ? 'text-navy-400' : 'text-navy-600'} mb-8`}>
              Vérifiez votre boîte mail (et les spams) dans quelques minutes.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-navy-900 dark:bg-navy-600 text-white py-3 rounded-lg font-semibold hover:bg-navy-800 dark:hover:bg-navy-500 transition"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
