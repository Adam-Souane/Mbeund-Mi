import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import Logo from '../shared/components/Logo';
import { useTheme } from '../theme/ThemeContext';
import client from '../api/client';
import { useToast } from '../shared/toast/ToastContext';

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { darkMode } = useTheme();
  const { showToast } = useToast();

  const code = searchParams.get('code') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    code: code,
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

    if (!formData.code.trim()) newErrors.code = 'Code d\'invitation requis';
    if (!formData.first_name.trim()) newErrors.first_name = 'Prénom requis';
    if (!formData.last_name.trim()) newErrors.last_name = 'Nom requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!formData.email.includes('@')) newErrors.email = 'Email invalide';
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
      const response = await client.post('/users/admin-register/', {
        code: formData.code,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        telephone: formData.telephone,
      });

      showToast('Compte admin créé avec succès !', 'success');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
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

        {!code && (
          <div className={`flex items-start gap-3 p-4 rounded-lg mb-6 ${darkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
              Accès réservé. Vous devez posséder un code d'invitation valide.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-navy-200' : 'text-navy-700'} mb-1`}>
              Code d'invitation
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Entrez le code d'invitation"
              readOnly={!!code}
              className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'} ${code ? 'opacity-70' : ''}`}
            />
            {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Prénom"
                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`}
              />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
            </div>
            <div>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Nom"
                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`}
              />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-navy-200' : 'text-navy-700'} mb-1`}>
              Email <span className={`text-xs ${darkMode ? 'text-navy-400' : 'text-navy-500'}`}>(Requis)</span>
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

          <div>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="+221 77 000 00 00"
              className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`}
            />
            {errors.telephone && <p className="text-xs text-red-500">{errors.telephone}</p>}
          </div>

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
              <Eye size={18} />
            </button>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              placeholder="Confirmer le mot de passe"
              className={`w-full px-4 py-2 pr-10 rounded-lg border ${darkMode ? 'border-navy-700 bg-navy-900 text-white' : 'border-navy-200 bg-white'}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2.5"
            >
              <EyeOff size={18} />
            </button>
            {errors.password_confirm && <p className="text-xs text-red-500">{errors.password_confirm}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !code}
            className="w-full bg-navy dark:bg-navy-800 text-white py-3 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-900 transition disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer un compte admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
