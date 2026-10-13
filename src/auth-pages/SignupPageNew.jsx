import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, MessageCircle, Mail, AlertTriangle } from 'lucide-react';
import Logo from '../shared/components/Logo';
import AuthLayout from './AuthLayout';
import useCanauxOtp from './useCanauxOtp';
import { useTheme } from '../theme/ThemeContext';
import client from '../api/client';
import { useToast } from '../shared/toast/ToastContext';
import { BOUTON_PRINCIPAL, CARTE, classeChamp, classeEtiquette, classeOption, emailValide, ton } from './styles';

const CANAUX = [
  { value: 'telephone', label: 'SMS', Icon: MessageCircle },
  { value: 'email', label: 'Email', Icon: Mail },
];

// Suggestions d'identifiants par défaut (nom complet sans coupure)
function identifiantDeSecours(prenom, nom) {
  const p = (prenom || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const n = (nom || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const options = [];
  if (p && n) {
    options.push(`${p}${n}`);
    options.push(`${p[0]}${n}`);
    options.push(`${p}.${n}`);
  } else if (p || n) {
    options.push(`${p}${n}`);
  }
  return options;
}

function validerInscription(formData, emailObligatoire) {
  const erreurs = {};
  if (!formData.first_name.trim()) erreurs.first_name = 'Prénom requis';
  if (!formData.last_name.trim()) erreurs.last_name = 'Nom requis';
  if (!formData.username) erreurs.username = 'Identifiant requis';
  // Téléphone obligatoire (il reçoit les alertes) ; email facultatif, sauf
  // tant que le code de vérification ne peut pas partir par SMS.
  if (formData.email.trim() && !emailValide(formData.email)) erreurs.email = 'Email invalide';
  else if (emailObligatoire && !formData.email.trim()) erreurs.email = 'Email requis pour recevoir votre code de vérification';
  if (!formData.telephone.trim()) erreurs.telephone = 'Numéro de téléphone requis';
  else if (formData.telephone.replace(/\D/g, '').length < 8) erreurs.telephone = 'Numéro incomplet';
  if (formData.password.length < 8) erreurs.password = 'Min. 8 caractères';
  if (formData.password !== formData.password_confirm) {
    erreurs.password_confirm = 'Les mots de passe ne correspondent pas';
  }
  return erreurs;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const { smsDisponible } = useCanauxOtp();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [usernameOptions, setUsernameOptions] = useState([]);
  // Prénom|nom pour lesquels les identifiants proposés ont été chargés
  const [identifiantsChargesPour, setIdentifiantsChargesPour] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    telephone: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    username: '',
  });
  // Canal de réception du code de vérification : le téléphone est toujours
  // demandé (il reçoit les alertes), l'email n'est proposé que s'il est saisi.
  const [canalOtp, setCanalOtp] = useState('telephone');
  const emailSaisi = formData.email.trim() !== '';
  let canalEffectif = canalOtp === 'email' && !emailSaisi ? 'telephone' : canalOtp;
  if (!smsDisponible) canalEffectif = 'email';
  const champ = classeChamp(darkMode);

  // Proposer des identifiants dès que le prénom et le nom sont saisis
  const { first_name: prenom, last_name: nom } = formData;
  const cleNoms = `${prenom.trim()}|${nom.trim()}`;
  const loadingUsernames = Boolean(prenom.trim() && nom.trim()) && identifiantsChargesPour !== cleNoms;
  useEffect(() => {
    if (!prenom.trim() || !nom.trim()) return undefined;
    let annule = false;
    const choisirPremier = (options) => {
      setUsernameOptions(options);
      setIdentifiantsChargesPour(`${prenom.trim()}|${nom.trim()}`);
      // Ne remplace pas un identifiant déjà choisi par l'utilisateur
      setFormData((prev) => (prev.username || !options.length ? prev : { ...prev, username: options[0] }));
    };
    client
      .get('/users/check-username/', { params: { first_name: prenom, last_name: nom } })
      .then((response) => !annule && choisirPremier(response.data.options || []))
      .catch((error) => {
        if (import.meta.env.DEV) console.error('Erreur lors du chargement des identifiants:', error);
        if (!annule) choisirPremier(identifiantDeSecours(prenom, nom));
      });
    return () => {
      annule = true;
    };
  }, [prenom, nom]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nomOuPrenomEfface = (name === 'first_name' || name === 'last_name') && !value.trim();
    setFormData((prev) => ({ ...prev, [name]: value, ...(nomOuPrenomEfface ? { username: '' } : {}) }));
    if (nomOuPrenomEfface) setUsernameOptions([]);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (globalError) setGlobalError('');
  };

  const validateForm = () => {
    let dataToValidate = { ...formData };
    if (!dataToValidate.username.trim() && dataToValidate.first_name.trim() && dataToValidate.last_name.trim()) {
      const secours = identifiantDeSecours(dataToValidate.first_name, dataToValidate.last_name);
      if (secours.length > 0) {
        dataToValidate.username = secours[0];
        setFormData((prev) => ({ ...prev, username: secours[0] }));
      }
    }

    const newErrors = validerInscription(dataToValidate, !smsDisponible);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      setGlobalError(firstError);
      showToast(firstError, 'error');
      return false;
    }
    setGlobalError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payloadUsername = formData.username.trim() || identifiantDeSecours(formData.first_name, formData.last_name)[0];
      const response = await client.post('/users/register/', {
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        telephone: formData.telephone.trim(),
        username: payloadUsername,
        canal_otp: canalEffectif,
      });

      showToast('Compte créé avec succès !', 'success');

      const infosOtp = response.data.otp || {};
      if (infosOtp.envoye === false) {
        showToast("Le code n'a pas pu être envoyé : utilisez « Renvoyer le code ».", 'warning');
      }
      navigate('/otp-verify', {
        state: {
          username: payloadUsername,
          password: formData.password,
          canal: infosOtp.canal || canalEffectif,
          destination: infosOtp.destination || '',
          emailDisponible: infosOtp.email_disponible ?? emailSaisi,
        },
      });
    } catch (error) {
      const errorData = error.response?.data;
      let messageErreur = '';

      if (errorData && typeof errorData === 'object' && !Array.isArray(errorData)) {
        setErrors(errorData);
        const errorValues = Object.values(errorData).flat();
        messageErreur = errorValues[0] || errorData.detail || '';
      } else if (typeof errorData === 'string' && errorData.trim()) {
        messageErreur = errorData.length < 120 ? errorData : 'Erreur interne du serveur.';
      }

      if (!messageErreur) {
        if (error.code === 'ECONNABORTED') {
          messageErreur = 'Le serveur met du temps à répondre. Veuillez patienter et réessayer.';
        } else if (error.message === 'Network Error') {
          messageErreur = 'Erreur réseau ou de communication avec le serveur.';
        } else {
          messageErreur = error.userMessage || error.message || 'Impossible de créer le compte. Veuillez réessayer.';
        }
      }

      setGlobalError(messageErreur);
      showToast(messageErreur, 'error');
    } finally {
      setLoading(false);
    }
  };

  const texteDiscret = ton(darkMode, 'text-navy-500', 'text-navy-400');
  const encadre = `px-4 py-3 rounded-lg border ${ton(darkMode, 'bg-navy-50 border-navy-200', 'bg-navy-800 border-navy-700')}`;
  const classeIdentifiant = (option) => {
    if (formData.username !== option) return ton(darkMode, 'text-navy-600', 'text-navy-300');
    return ton(darkMode, 'text-navy-900', 'text-white');
  };

  return (
    <AuthLayout variante="inscription" className="px-6 py-10">
      <div className="w-full max-w-[480px] lg:max-w-[560px]">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className={`text-sm mt-2 ${ton(darkMode, 'text-navy-600', 'text-navy-400')}`}>Créer un compte citoyen</p>
        </div>

        <div className={CARTE}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input type="text" name="first_name" aria-label="Prénom" autoComplete="given-name" value={formData.first_name} onChange={handleChange} placeholder="Prénom" className={champ} />
                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
              </div>
              <div>
                <input type="text" name="last_name" aria-label="Nom" autoComplete="family-name" value={formData.last_name} onChange={handleChange} placeholder="Nom" className={champ} />
                {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="signup-username" className={classeEtiquette(darkMode)}>
                Identifiant <span className={`text-xs ${texteDiscret}`}>(proposé ou personnalisé)</span>
              </label>
              <input
                id="signup-username"
                type="text"
                name="username"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="ex: maimounasall"
                className={champ}
              />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}

              {usernameOptions.length > 0 && (
                <div className="mt-2">
                  <p className={`text-xs mb-1.5 flex items-center gap-1.5 ${ton(darkMode, 'text-navy-600', 'text-navy-400')}`}>
                    <span>Suggestions disponibles :</span>
                    {loadingUsernames && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {usernameOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, username: option }))}
                        className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-all ${
                          formData.username === option
                            ? 'bg-red-500 text-white border-red-500 font-semibold shadow-sm'
                            : ton(darkMode, 'bg-navy-50 text-navy-700 border-navy-200 hover:bg-navy-100', 'bg-navy-800 text-navy-200 border-navy-700 hover:bg-navy-700')
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="signup-telephone" className={classeEtiquette(darkMode)}>
                Téléphone <span className={`text-xs ${texteDiscret}`}>(obligatoire : vous y recevrez les alertes)</span>
              </label>
              <input id="signup-telephone" type="tel" name="telephone" autoComplete="tel" inputMode="tel" value={formData.telephone} onChange={handleChange} placeholder="77 123 45 67" className={champ} />
              {errors.telephone && <p className="text-xs text-red-500">{errors.telephone}</p>}
            </div>

            <div>
              <label htmlFor="signup-email" className={classeEtiquette(darkMode)}>
                Email <span className={`text-xs ${texteDiscret}`}>{smsDisponible ? '(facultatif)' : '(obligatoire : vous y recevrez votre code)'}</span>
              </label>
              <input id="signup-email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} placeholder="email@exemple.com" className={champ} />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {!smsDisponible && errors.canal_otp && <p className="text-xs text-red-500">{errors.canal_otp}</p>}
            {smsDisponible && (
              <fieldset className={encadre}>
                <legend className={`px-1 text-xs font-medium ${ton(darkMode, 'text-navy-600', 'text-navy-300')}`}>Recevoir mon code de vérification par</legend>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {CANAUX.map(({ value, label, Icon }) => {
                    const desactive = value === 'email' && !emailSaisi;
                    return (
                      <label key={value} className={classeOption(darkMode, canalEffectif === value, desactive)}>
                        <input type="radio" name="canal_otp" value={value} checked={canalEffectif === value} disabled={desactive} onChange={() => setCanalOtp(value)} className="accent-red" />
                        <Icon size={16} aria-hidden="true" />
                        {label}
                      </label>
                    );
                  })}
                </div>
                {!emailSaisi && <p className={`text-xs mt-2 ${texteDiscret}`}>Saisissez un email pour pouvoir recevoir le code par email.</p>}
                {errors.canal_otp && <p className="text-xs text-red-500 mt-1">{errors.canal_otp}</p>}
              </fieldset>
            )}

            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="password" aria-label="Mot de passe" autoComplete="new-password" value={formData.password} onChange={handleChange} placeholder="Mot de passe (min. 8 caractères)" className={`${champ} pr-10`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} name="password_confirm" aria-label="Confirmer le mot de passe" autoComplete="new-password" value={formData.password_confirm} onChange={handleChange} placeholder="Confirmer le mot de passe" className={`${champ} pr-10`} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5" aria-label={showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password_confirm && <p className="text-xs text-red-500">{errors.password_confirm}</p>}

            {globalError && (
              <div
                className="p-3.5 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-200 text-sm flex items-start gap-2.5 shadow-sm"
                role="alert"
              >
                <AlertTriangle size={18} className="flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-red-800 dark:text-red-100 mb-0.5">Vérification requise :</p>
                  <p className="font-medium text-xs leading-relaxed">{globalError}</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className={BOUTON_PRINCIPAL}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Création du compte en cours...</span>
                </span>
              ) : (
                'Créer un compte'
              )}
            </button>
          </form>

          <p className={`text-center text-sm mt-6 ${ton(darkMode, 'text-navy-600', 'text-navy-400')}`}>
            Vous avez déjà un compte ? <button onClick={() => navigate('/login')} className="font-semibold text-red hover:underline transition">Se connecter</button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
