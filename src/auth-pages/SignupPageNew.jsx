import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '../shared/components/Logo';
import { useTheme } from '../theme/ThemeContext';
import client from '../api/client';
import { useToast } from '../shared/toast/ToastContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { darkMode } = useTheme();
  const { showToast } = useToast();

  const role = searchParams.get('role') || 'citoyen';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    email: '',
    telephone: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email est facultatif
    if (formData.email.trim() && !formData.email.includes('@')) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.telephone.trim()) newErrors.telephone = 'Numéro de téléphone requis';
    if (!formData.password) newErrors.password = 'Mot de passe requis';
    if (formData.password.length < 8) newErrors.password = 'Min. 8 caractères';
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Générer le username depuis le prénom et nom
      const generatedUsername = `${formData.first_name.toLowerCase()}${formData.last_name.toLowerCase()}`.replace(/\s+/g, '');

      const response = await client.post('/users/register/', {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        telephone: formData.telephone,
        role: role,
      });

      console.log('Signup response:', response.data);
      console.log('requires_otp:', response.data.requires_otp);

      showToast('Compte créé avec succès !', 'success');

      // Si c'est un compte citoyen, rediriger vers la vérification OTP
      if (response.data.requires_otp) {
        navigate('/otp-verify', {
          state: {
            username: generatedUsername,
            email: formData.email,
            phoneNumber: formData.telephone,
            password: formData.password,
          },
        });
      } else {
        // Sinon, rediriger vers login (pour les comptes autorité)
        navigate('/login');
      }
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

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-navy-950' : 'bg-navy-50'} p-4`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className={`text-sm ${darkMode ? 'text-navy-400' : 'text-navy-600'} mt-2`}>
            Créer un compte {role === 'autorite' ? 'd\'autorité' : 'citoyen'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Prénom" className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`} />
            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Nom" className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`} />
          </div>

          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@exemple.com" className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`} />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}

          <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} placeholder="+221 77 000 00 00" className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`} />
          {errors.telephone && <p className="text-xs text-red-500">{errors.telephone}</p>}

          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Mot de passe (min. 8 caractères)" className={`w-full px-4 py-2 pr-10 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5"><Eye size={18} /></button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

          <div className="relative">
            <input type={showConfirm ? 'text' : 'password'} name="password_confirm" value={formData.password_confirm} onChange={handleChange} placeholder="Confirmer le mot de passe" className={`w-full px-4 py-2 pr-10 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5"><EyeOff size={18} /></button>
          </div>
          {errors.password_confirm && <p className="text-xs text-red-500">{errors.password_confirm}</p>}

          <button type="submit" disabled={loading} className="w-full bg-navy dark:bg-navy-800 text-white py-3 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-900 transition disabled:opacity-50">
            {loading ? 'Création...' : 'Créer un compte'}
          </button>
        </form>

        <p className={`text-center text-sm mt-6 ${darkMode ? 'text-navy-400' : 'text-navy-600'}`}>
          Vous avez déjà un compte ? <button onClick={() => navigate('/login')} className="font-semibold text-red hover:underline transition">Se connecter</button>
        </p>
      </div>
    </div>
  );
}
