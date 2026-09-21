import { useState } from 'react';
import { Plus, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../shared/toast/ToastContext';
import client from '../../api/client';

export default function ManageAuthoritiesPage() {
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [authorities, setAuthorities] = useState([]);
  const [errors, setErrors] = useState({});

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
    if (!formData.telephone.trim()) newErrors.telephone = 'Téléphone requis';

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

      setAuthorities([...authorities, response.data]);
      setFormData({ first_name: '', last_name: '', email: '', telephone: '' });
      setShowForm(false);
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

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copié !', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-navy-950' : 'bg-navy-50'} p-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-navy-900'}`}>
              Gérer les autorités
            </h1>
            <p className={`text-sm ${darkMode ? 'text-navy-400' : 'text-navy-600'} mt-1`}>
              Créez et gérez les comptes des autorités
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
              darkMode
                ? 'bg-navy-800 text-white hover:bg-navy-700'
                : 'bg-navy text-white hover:bg-navy-700'
            }`}
          >
            <Plus size={20} />
            Ajouter une autorité
          </button>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className={`rounded-lg p-6 mb-8 ${darkMode ? 'bg-navy-900 border border-navy-700' : 'bg-white border border-navy-200'}`}>
            <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-navy-900'}`}>
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
                    placeholder="Prénom"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode
                        ? 'border-navy-700 bg-navy-800 text-white'
                        : 'border-navy-200 bg-white'
                    }`}
                  />
                  {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
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
                    placeholder="Nom"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode
                        ? 'border-navy-700 bg-navy-800 text-white'
                        : 'border-navy-200 bg-white'
                    }`}
                  />
                  {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}
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
                  placeholder="email@exemple.com"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'border-navy-700 bg-navy-800 text-white'
                      : 'border-navy-200 bg-white'
                  }`}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-navy-200' : 'text-navy-700'}`}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+221 77 000 00 00"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'border-navy-700 bg-navy-800 text-white'
                      : 'border-navy-200 bg-white'
                  }`}
                />
                {errors.telephone && <p className="text-xs text-red-500">{errors.telephone}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-navy dark:bg-navy-800 text-white py-2 rounded-lg font-semibold hover:bg-navy-700 transition disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold border transition ${
                    darkMode
                      ? 'border-navy-700 text-navy-300 hover:bg-navy-800'
                      : 'border-navy-200 text-navy-700 hover:bg-navy-50'
                  }`}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des autorités */}
        <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-navy-900 border border-navy-700' : 'bg-white border border-navy-200'}`}>
          {authorities.length === 0 ? (
            <div className={`p-8 text-center ${darkMode ? 'text-navy-400' : 'text-navy-600'}`}>
              <p>Aucune autorité créée pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-navy-700 bg-navy-800' : 'border-navy-200 bg-navy-50'}`}>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-navy-200' : 'text-navy-700'}`}>
                      Nom
                    </th>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-navy-200' : 'text-navy-700'}`}>
                      Email
                    </th>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-navy-200' : 'text-navy-700'}`}>
                      Username
                    </th>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-navy-200' : 'text-navy-700'}`}>
                      Mot de passe
                    </th>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-navy-200' : 'text-navy-700'}`}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {authorities.map((auth) => (
                    <tr key={auth.id} className={`border-b ${darkMode ? 'border-navy-700 hover:bg-navy-800' : 'border-navy-200 hover:bg-navy-50'}`}>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-white' : 'text-navy-900'}`}>
                        {auth.first_name} {auth.last_name}
                      </td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-white' : 'text-navy-900'}`}>
                        {auth.email}
                      </td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-white' : 'text-navy-900'}`}>
                        {auth.username}
                      </td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-white' : 'text-navy-900'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono ${showPassword ? '' : 'blur'}`}>
                            {auth.temporary_password}
                          </span>
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className={`p-1 rounded ${darkMode ? 'hover:bg-navy-700' : 'hover:bg-navy-100'}`}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm`}>
                        <button
                          onClick={() => copyToClipboard(`${auth.username}:${auth.temporary_password}`, auth.id)}
                          className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                            copiedId === auth.id
                              ? 'bg-green-500 text-white'
                              : darkMode
                              ? 'bg-navy-700 text-navy-200 hover:bg-navy-600'
                              : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                          }`}
                        >
                          {copiedId === auth.id ? (
                            <>
                              <Check size={14} /> Copié
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copier
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
