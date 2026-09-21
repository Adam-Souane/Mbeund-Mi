import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '../shared/components/Logo';
import { useTheme } from '../theme/ThemeContext';
import client from '../api/client';
import { useToast } from '../shared/toast/ToastContext';

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    invite_code: '',
    email: '',
    first_name: '',
    last_name: '',
    telephone: '',
    password: '',
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

    if (!formData.invite_code.trim()) newErrors.invite_code = 'Code d\'invitation requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!formData.email.includes('@')) newErrors.email = 'Email invalide';
    if (!formData.first_name.trim()) newErrors.first_name = 'Prénom requis';
    if (!formData.last_name.trim()) newErrors.last_name = 'Nom requis';
    if (!formData.telephone.trim()) newErrors.telephone = 'Numéro de téléphone requis';
    if (!formData.password) newErrors.password = 'Mot de passe requis';
    if (formData.password.length < 8) newErrors.password = 'Min. 8 caractères';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await client.post('/users/admin-register/', {
        invite_code: formData.invite_code,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        telephone: formData.telephone,
        password: formData.password,
      });

      showToast('Compte admin créé avec succès !', 'success');
      navigate('/login');
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
            Créer un compte administrateur
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-navy-200' : 'text-navy-700'} mb-1`}>
              Code d'invitation
            </label>
            <input
              type="text"
              name="invite_code"
              value={formData.invite_code}
              onChange={handleChange}
              placeholder="Entrez le code d'invitation"
              className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`}
            />
            {errors.invite_code && <p className="text-xs text-red-500">{errors.invite_code}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Prénom"
              className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`}
            />
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Nom"
              className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`}
            />
          </div>
          {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
          {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-navy-200' : 'text-navy-700'} mb-1`}>
              Email (Requis)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@exemple.com"
              className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            placeholder="+221 77 000 00 00"
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`}
          />
          {errors.telephone && <p className="text-xs text-red-500">{errors.telephone}</p>}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mot de passe (min. 8 caractères)"
              className={`w-full px-4 py-2 pr-10 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy dark:bg-navy-800 text-white py-3 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-900 transition disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer un compte admin'}
          </button>
        </form>

        <p className={`text-center text-sm mt-6 ${darkMode ? 'text-navy-400' : 'text-navy-600'}`}>
          Vous avez déjà un compte ? <button onClick={() => navigate('/login')} className="font-semibold text-red hover:underline transition">Se connecter</button>
        </p>
      </div>
    </div>
  );
}
