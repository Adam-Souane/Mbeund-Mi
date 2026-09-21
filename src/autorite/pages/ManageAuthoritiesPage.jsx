import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import client from '../../api/client';
import { useToast } from '../../shared/toast/ToastContext';

export default function ManageAuthoritiesPage() {
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
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-navy-900'}`}>
          Gérer les autorités
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-navy-400' : 'text-navy-600'}`}>
          Créez des comptes autorité en fournissant les informations. Les identifiants seront générés automatiquement.
        </p>
      </div>

      <div className={`rounded-lg border p-6 ${darkMode ? 'border-navy-700 bg-navy-800' : 'border-navy-200 bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-navy-900'}`}>
          Créer une nouvelle autorité
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-navy-200' : 'text-navy-700'}`}>
                Prénom
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Jean"
                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-600 bg-navy-700 text-white' : 'border-navy-200 bg-white'}`}
              />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-navy-200' : 'text-navy-700'}`}>
                Nom
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Dupont"
                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-600 bg-navy-700 text-white' : 'border-navy-200 bg-white'}`}
              />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-navy-200' : 'text-navy-700'}`}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jean.dupont@thiaroye.sn"
              className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-600 bg-navy-700 text-white' : 'border-navy-200 bg-white'}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-navy-200' : 'text-navy-700'}`}>
              Numéro de téléphone
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="+221 77 000 00 00"
              className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'border-navy-600 bg-navy-700 text-white' : 'border-navy-200 bg-white'}`}
            />
            {errors.telephone && <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy dark:bg-navy-700 text-white py-3 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-600 transition disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer l\'autorité'}
          </button>
        </form>
      </div>

      {createdAuthority && (
        <div className={`rounded-lg border p-6 ${darkMode ? 'border-green-700/30 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
            ✓ Autorité créée avec succès !
          </h3>

          <div className="space-y-3">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-navy-700' : 'bg-white border border-navy-200'}`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-navy-300' : 'text-navy-600'}`}>
                Nom complet
              </p>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-mono ${darkMode ? 'text-white' : 'text-navy-900'}`}>
                  {createdAuthority.first_name} {createdAuthority.last_name}
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${darkMode ? 'bg-navy-700' : 'bg-white border border-navy-200'}`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-navy-300' : 'text-navy-600'}`}>
                Identifiant (username)
              </p>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-mono ${darkMode ? 'text-white' : 'text-navy-900'}`}>
                  {createdAuthority.username}
                </p>
                <button
                  onClick={() => copyToClipboard(createdAuthority.username, 'username')}
                  className="text-navy dark:text-navy-200 hover:text-navy-700"
                >
                  {copiedField === 'username' ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${darkMode ? 'bg-navy-700' : 'bg-white border border-navy-200'}`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-navy-300' : 'text-navy-600'}`}>
                Mot de passe temporaire
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-mono ${darkMode ? 'text-white' : 'text-navy-900'} flex-1 break-all`}>
                  {showPassword ? createdAuthority.password : '••••••••'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-navy dark:text-navy-200 hover:text-navy-700 flex-shrink-0"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                  onClick={() => copyToClipboard(createdAuthority.password, 'password')}
                  className="text-navy dark:text-navy-200 hover:text-navy-700 flex-shrink-0"
                >
                  {copiedField === 'password' ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                📋 À partager avec l'autorité
              </p>
              <p className={`text-xs ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                Copiez l'identifiant et le mot de passe, puis partagez-les avec la personne en personne.
                Elle pourra se connecter et modifier son mot de passe dans les paramètres.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCreatedAuthority(null)}
            className={`w-full mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
              darkMode
                ? 'bg-navy-700 text-white hover:bg-navy-600'
                : 'bg-navy-100 text-navy-900 hover:bg-navy-200'
            }`}
          >
            Créer une autre autorité
          </button>
        </div>
      )}
    </div>
  );
}
