import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, MessageCircle, Mail } from 'lucide-react';
import Logo from '../shared/components/Logo';
import AuthLayout from './AuthLayout';
import useCanauxOtp from './useCanauxOtp';
import { useTheme } from '../theme/ThemeContext';
import client from '../api/client';
import { useToast } from '../shared/toast/ToastContext';
import { BOUTON_PRINCIPAL, classeChamp, classeEtiquette, classeOption, emailValide, ton } from './styles';

const CANAUX = [
  { value: 'telephone', label: 'SMS', Icon: MessageCircle },
  { value: 'email', label: 'Email', Icon: Mail },
];

// Identifiant proposé si le serveur ne répond pas : 3 lettres du prénom + 3 du nom.
function identifiantDeSecours(prenom, nom) {
  return `${prenom.toLowerCase().slice(0, 3)}${nom.toLowerCase().slice(0, 3)}`;
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
        if (!annule) choisirPremier([identifiantDeSecours(prenom, nom)]);
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
  };

  const validateForm = () => {
    const newErrors = validerInscription(formData, !smsDisponible);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await client.post('/users/register/', {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        telephone: formData.telephone,
        username: formData.username,
        canal_otp: canalEffectif,
      });

      showToast('Compte créé avec succès !', 'success');

      const infosOtp = response.data.otp || {};
      if (infosOtp.envoye === false) {
        showToast("Le code n'a pas pu être envoyé : utilisez « Renvoyer le code ».", 'warning');
      }
      navigate('/otp-verify', {
        state: {
          username: formData.username,
          password: formData.password,
          canal: infosOtp.canal || canalEffectif,
          destination: infosOtp.destination || '',
          emailDisponible: infosOtp.email_disponible ?? emailSaisi,
        },
      });
    } catch (error) {
      const errorData = error.response?.data || {};
      if (typeof errorData === 'object') {
        setErrors(errorData);
      } else {
        showToast(errorData.detail || 'Erreur lors de la création du compte', 'error');
      }
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
    <AuthLayout variante="inscription" className="p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className={`text-sm mt-2 ${ton(darkMode, 'text-navy-600', 'text-navy-400')}`}>Créer un compte citoyen</p>
        </div>

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

          {usernameOptions.length > 0 && (
            <fieldset className={encadre}>
              <legend className={`flex items-center gap-2 px-1 text-xs font-medium ${ton(darkMode, 'text-navy-600', 'text-navy-400')}`}>
                Choisissez votre identifiant
                {loadingUsernames && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
              </legend>
              <div className="space-y-2">
                {usernameOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="username" value={option} checked={formData.username === option} onChange={handleChange} className="accent-red" />
                    <code className={`font-mono text-sm font-semibold ${classeIdentifiant(option)}`}>{option}</code>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}

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

          <button type="submit" disabled={loading} className={BOUTON_PRINCIPAL}>
            {loading ? 'Création...' : 'Créer un compte'}
          </button>
        </form>

        <p className={`text-center text-sm mt-6 ${ton(darkMode, 'text-navy-600', 'text-navy-400')}`}>
          Vous avez déjà un compte ? <button onClick={() => navigate('/login')} className="font-semibold text-red hover:underline transition">Se connecter</button>
        </p>
      </div>
    </AuthLayout>
  );
}
