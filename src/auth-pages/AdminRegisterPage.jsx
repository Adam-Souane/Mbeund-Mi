import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { BOUTON_PRINCIPAL, CARTE } from './styles';
import client from '../api/client';
import { useToast } from '../shared/toast/ToastContext';

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

      const createdUsername = response.data?.user?.username || '';
      showToast(
        createdUsername
          ? `Compte créé ! Votre identifiant de connexion est : ${createdUsername}`
          : 'Compte administrateur créé avec succès !',
        'success'
      );

      setTimeout(() => {
        navigate('/login-autorite');
      }, 2500);
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
    <AuthLayout variante="administration" className="px-4 py-8">
      <div className="flex flex-col items-center justify-center w-full my-auto px-4">
        <div className="w-full max-w-md sm:max-w-lg">
          <div className={CARTE}>
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-navy-50">Compte Administrateur</h1>
              <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-300 mt-1">
                Créer un compte administrateur avec un code d'invitation
              </p>
            </div>

            {!code && (
              <div className={`flex items-start gap-3 p-4 rounded-lg mb-6 bg-red-50 border border-red-200`}>
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className={`text-sm text-red-700`}>
                  Accès réservé. Vous devez posséder un code d’invitation valide.
                </div>
              </div>
            )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-code" className="block text-xs font-bold uppercase tracking-wider text-navy-600 mb-1.5">
                Code d’invitation
              </label>
              <input
                id="admin-code"
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Entrez le code d'invitation"
                readOnly={!!code}
                className={`w-full px-3.5 py-2.5 rounded-lg border border-navy-200 bg-white text-sm focus:outline-none focus:border-red transition-colors ${code ? 'opacity-70' : ''}`}
              />
              {errors.code && <p className="text-xs text-red mt-1">{errors.code}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Prénom"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 bg-white text-sm focus:outline-none focus:border-red transition-colors"
                />
                {errors.first_name && <p className="text-xs text-red mt-1">{errors.first_name}</p>}
              </div>
              <div>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Nom"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 bg-white text-sm focus:outline-none focus:border-red transition-colors"
                />
                {errors.last_name && <p className="text-xs text-red mt-1">{errors.last_name}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold uppercase tracking-wider text-navy-600 mb-1.5">
                Email <span className="text-xs text-navy-400 font-normal">(Requis)</span>
              </label>
              <input
                id="admin-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@exemple.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 bg-white text-sm focus:outline-none focus:border-red transition-colors"
              />
              {errors.email && <p className="text-xs text-red mt-1">{errors.email}</p>}
            </div>

            <div>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="+221 77 000 00 00"
                className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 bg-white text-sm focus:outline-none focus:border-red transition-colors"
              />
              {errors.telephone && <p className="text-xs text-red mt-1">{errors.telephone}</p>}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mot de passe (min. 8 caractères)"
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-navy-200 bg-white text-sm focus:outline-none focus:border-red transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-navy-500 hover:text-navy-800"
              >
                <Eye size={18} />
              </button>
              {errors.password && <p className="text-xs text-red mt-1">{errors.password}</p>}
            </div>

            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="Confirmer le mot de passe"
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-navy-200 bg-white text-sm focus:outline-none focus:border-red transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-navy-500 hover:text-navy-800"
              >
                <EyeOff size={18} />
              </button>
              {errors.password_confirm && <p className="text-xs text-red mt-1">{errors.password_confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={BOUTON_PRINCIPAL}
            >
              {loading ? 'Création...' : 'Créer un compte admin'}
            </button>

            <div className="pt-4 mt-3 border-t border-navy-100 text-center">
              <Link
                to="/login-autorite"
                className="text-xs font-bold text-red hover:underline transition inline-flex items-center gap-1"
              >
                ← Déjà un compte ? Se connecter en tant qu'autorité
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AuthLayout>
  );
}
