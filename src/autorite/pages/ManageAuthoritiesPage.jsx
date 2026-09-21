import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import { useTheme } from '../../theme/ThemeContext';
import client from '../../api/client';
import { useToast } from '../../shared/toast/ToastContext';

function ManageAuthoritiesPageContent() {
  const { darkMode } = useTheme();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [createdAuthority, setCreatedAuthority] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
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

    if (!formData.first_name.trim()) newErrors.first_name = 'Prénom requis';
    if (!formData.last_name.trim()) newErrors.last_name = 'Nom requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!formData.email.includes('@')) newErrors.email = 'Email invalide';
    if (!formData.telephone.trim()) newErrors.telephone = 'Numéro de téléphone requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await client.post('/users/create-authority/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        telephone: formData.telephone,
      });

      setCreatedAuthority(response.data);
      setFormData({ first_name: '', last_name: '', email: '', telephone: '' });
      showToast('Autorité créée avec succès !', 'success');
    } catch (error) {
      const errorData = error.response?.data || {};
      if (typeof errorData === 'object') {
        setErrors(errorData);
      } else {
        showToast(errorData.detail || 'Erreur lors de la création', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Gérer les autorités</h1>
        <p className="text-sm text-navy-600 dark:text-navy-200 mt-0.5">Créez des comptes autorité. Les identifiants seront générés automatiquement.</p>
      </div>

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-navy dark:text-white mb-4">Créer une nouvelle autorité</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1">Prénom</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Jean"
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy dark:text-white"
              />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1">Nom</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Dupont"
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy dark:text-white"
              />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jean.dupont@thiaroye.sn"
              className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy dark:text-white"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1">Numéro de téléphone</label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="+221 77 000 00 00"
              className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy dark:text-white"
            />
            {errors.telephone && <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy dark:bg-navy-800 text-white py-2.5 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-700 transition disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer l\'autorité'}
          </button>
        </form>
      </div>

      {createdAuthority && (
        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-navy dark:text-white mb-4">✓ Autorité créée avec succès !</h3>

          <div className="space-y-3">
            <div className="bg-navy-50 dark:bg-navy-800 p-3 rounded-lg">
              <p className="text-xs font-medium text-navy-600 dark:text-navy-300 mb-1">Nom complet</p>
              <p className="text-sm font-mono text-navy dark:text-white">
                {createdAuthority.first_name} {createdAuthority.last_name}
              </p>
            </div>

            <div className="bg-navy-50 dark:bg-navy-800 p-3 rounded-lg">
              <p className="text-xs font-medium text-navy-600 dark:text-navy-300 mb-1">Identifiant (username)</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-navy dark:text-white">{createdAuthority.username}</p>
                <button
                  onClick={() => copyToClipboard(createdAuthority.username, 'username')}
                  className="text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white"
                >
                  {copiedField === 'username' ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="bg-navy-50 dark:bg-navy-800 p-3 rounded-lg">
              <p className="text-xs font-medium text-navy-600 dark:text-navy-300 mb-1">Mot de passe temporaire</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-mono text-navy dark:text-white flex-1 break-all">
                  {showPassword ? createdAuthority.password : '••••••••'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white flex-shrink-0"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                  onClick={() => copyToClipboard(createdAuthority.password, 'password')}
                  className="text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white flex-shrink-0"
                >
                  {copiedField === 'password' ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 p-3 rounded-lg">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">À partager avec l'autorité</p>
              <p className="text-xs text-blue-600 dark:text-blue-200">
                Copiez l'identifiant et le mot de passe, puis partagez-les avec la personne en personne.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCreatedAuthority(null)}
            className="w-full mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-navy-50 dark:bg-navy-800 text-navy dark:text-white hover:bg-navy-100 dark:hover:bg-navy-700 transition"
          >
            Créer une autre autorité
          </button>
        </div>
      )}
    </div>
  );
}

export default function ManageAuthoritiesPage() {
  return (
    <AutoriteShell>
      <ManageAuthoritiesPageContent />
    </AutoriteShell>
  );
}
