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

  const [userType, setUserType] = useState('citoyen'); // citoyen ou autorite
  const [step, setStep] = useState(1); // 1: input, 2: success
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCitoyen = userType === 'citoyen';
  const contactLabel = isCitoyen ? 'Numéro de téléphone' : 'Email';
  const placeholder = isCitoyen ? '+221 77 000 00 00' : 'email@exemple.com';
  const inputType = isCitoyen ? 'tel' : 'email';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!contact.trim()) {
      setError(`${contactLabel} requis`);
      return;
    }

    if (!isCitoyen && !contact.includes('@')) {
      setError('Email invalide');
      return;
    }

    setLoading(true);
    try {
      const payload = isCitoyen
        ? { telephone: contact }
        : { email: contact };

      await client.post('/users/password-reset/', payload);
      setStep(2);
      showToast('Instructions de réinitialisation envoyées', 'success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'envoi des instructions');
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
            {step === 1 ? 'Mot de passe oublié ?' : isCitoyen ? 'SMS envoyé' : 'Email envoyé'}
          </h1>
        </div>

        {step === 1 ? (
          <>
            {/* Onglets Citoyen/Autorité */}
            <div className="flex bg-navy-50 dark:bg-navy-800 rounded-md p-1 mb-6">
              {['citoyen', 'autorite'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setUserType(type);
                    setContact('');
                    setError('');
                  }}
                  className={`flex-1 text-center py-2 rounded-md text-sm transition-colors ${
                    userType === type
                      ? 'bg-white dark:bg-navy text-navy dark:text-navy-50 font-bold shadow'
                      : 'text-navy-600 dark:text-navy-200 font-semibold'
                  }`}
                >
                  {type === 'citoyen' ? 'Citoyen' : 'Autorité'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <p className={`text-sm ${darkMode ? 'text-navy-300' : 'text-navy-700'} mb-6`}>
                Entrez votre {contactLabel.toLowerCase()} pour recevoir les instructions de réinitialisation.
              </p>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-navy-200' : 'text-navy-700'} mb-1`}>
                  {contactLabel}
                </label>
                <input
                  type={inputType}
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value);
                    setError('');
                  }}
                  placeholder={placeholder}
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
                className="w-full bg-navy dark:bg-navy-800 text-white py-3 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-900 transition disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Envoyer les instructions'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <p className={`text-sm ${darkMode ? 'text-navy-300' : 'text-navy-700'} mb-6`}>
              {isCitoyen
                ? `Un SMS avec les instructions de réinitialisation a été envoyé à ${contact}`
                : `Un email avec les instructions de réinitialisation a été envoyé à ${contact}`}
            </p>
            <p className={`text-xs ${darkMode ? 'text-navy-400' : 'text-navy-600'} mb-8`}>
              {isCitoyen
                ? 'Vérifiez vos messages SMS dans quelques minutes.'
                : 'Vérifiez votre boîte mail (et les spams) dans quelques minutes.'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-navy dark:bg-navy-800 text-white py-3 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-900 transition"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
