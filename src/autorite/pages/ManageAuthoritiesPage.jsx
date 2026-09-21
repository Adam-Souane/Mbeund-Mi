import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Copy, Check, Lock, Trash2, RefreshCw, Search, Loader2 } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import client from '../../api/client';
import { useToast } from '../../shared/toast/ToastContext';

function ManageAuthoritiesPageContent() {
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const { role } = useAuth();
  const navigate = useNavigate();

  // Vérifier que l'utilisateur est admin
  if (role !== 'admin') {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-12 text-center">
          <Lock size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-navy dark:text-white mb-2">Accès réservé</h2>
          <p className="text-navy-600 dark:text-navy-300 mb-6">
            Cette page est réservée aux administrateurs.
          </p>
          <button
            onClick={() => navigate('/autorite/dashboard')}
            className="bg-navy dark:bg-navy-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-700 transition"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [authorities, setAuthorities] = useState([]);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedField, setCopiedField] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [regenerateConfirmModal, setRegenerateConfirmModal] = useState(null);
  const [regenerateResultModal, setRegenerateResultModal] = useState(null);
  const [newPassword, setNewPassword] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [usernameOptions, setUsernameOptions] = useState([]);
  const [loadingUsernames, setLoadingUsernames] = useState(false);

  // Filtrer les autorités selon la recherche
  const filteredAuthorities = authorities.filter((auth) => {
    const query = searchQuery.toLowerCase();
    return (
      auth.first_name.toLowerCase().includes(query) ||
      auth.last_name.toLowerCase().includes(query) ||
      auth.username.toLowerCase().includes(query) ||
      (auth.email && auth.email.toLowerCase().includes(query))
    );
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    username: '',
  });

  // Charger les options d'identifiant quand prénom/nom changent
  useEffect(() => {
    if (formData.first_name.trim() && formData.last_name.trim()) {
      const fetchUsernameOptions = async () => {
        setLoadingUsernames(true);
        try {
          const response = await client.get('/users/check-username/', {
            params: {
              first_name: formData.first_name,
              last_name: formData.last_name,
            },
          });
          setUsernameOptions(response.data.options || []);
          // Sélectionner la première option par défaut
          if (!formData.username && response.data.options?.length > 0) {
            setFormData((prev) => ({ ...prev, username: response.data.options[0] }));
          }
        } catch (error) {
          console.error('Erreur lors du chargement des identifiants:', error);
        } finally {
          setLoadingUsernames(false);
        }
      };
      fetchUsernameOptions();
    } else {
      setUsernameOptions([]);
      setFormData((prev) => ({ ...prev, username: '' }));
    }
  }, [formData.first_name, formData.last_name]);

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
    if (!formData.username) newErrors.username = 'Identifiant requis';
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
        username: formData.username,
      });

      setAuthorities([...authorities, response.data]);
      setFormData({ first_name: '', last_name: '', email: '', telephone: '', username: '' });
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

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmRegenerate = async () => {
    try {
      const response = await client.post('/users/regenerate-authority-password/', { username: regenerateConfirmModal });
      setNewPassword(response.data);
      setRegenerateConfirmModal(null);
      setRegenerateResultModal(response.data.username);
      showToast('Mot de passe régénéré avec succès !', 'success');
    } catch (error) {
      showToast('Erreur lors de la régénération du mot de passe', 'error');
      setRegenerateConfirmModal(null);
    }
  };

  const handleDeleteAuthority = async (username) => {
    try {
      await client.post('/users/delete-authority/', { username });
      setAuthorities(authorities.filter((a) => a.username !== username));
      setDeleteModal(null);
      showToast('Autorité supprimée avec succès !', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  // Charger les autorités créées aujourd'hui au montage
  useEffect(() => {
    const loadAuthorities = async () => {
      try {
        const response = await client.get('/users/list-authorities/');
        setAuthorities(response.data.authorities || []);
      } catch (error) {
        console.error('Erreur lors du chargement des autorités:', error);
      }
    };
    loadAuthorities();
  }, []);

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

          {usernameOptions.length > 0 && (
            <div className={`px-4 py-3 rounded-lg ${darkMode ? 'bg-navy-800 border border-navy-700' : 'bg-navy-50 border border-navy-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <p className={`text-xs font-medium ${darkMode ? 'text-navy-400' : 'text-navy-600'}`}>Choisissez l'identifiant</p>
                {loadingUsernames && <Loader2 size={12} className="animate-spin" />}
              </div>
              <div className="space-y-2">
                {usernameOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="username"
                      value={option}
                      checked={formData.username === option}
                      onChange={handleChange}
                      className="accent-red"
                    />
                    <code className={`font-mono text-sm font-semibold ${formData.username === option ? (darkMode ? 'text-white' : 'text-navy-900') : (darkMode ? 'text-navy-300' : 'text-navy-600')}`}>
                      {option}
                    </code>
                  </label>
                ))}
              </div>
            </div>
          )}
          {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}

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

      {authorities.length > 0 && (
        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-navy-50 dark:border-navy-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy dark:text-white">
                Autorités créées ({filteredAuthorities.length} / {authorities.length})
              </h3>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 text-navy-400 dark:text-navy-500" size={18} />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, email ou identifiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy dark:text-white text-sm"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-50 dark:border-navy-800 bg-navy-50 dark:bg-navy-800">
                  <th className="px-6 py-3 text-left font-semibold text-navy-700 dark:text-navy-200">Nom</th>
                  <th className="px-6 py-3 text-left font-semibold text-navy-700 dark:text-navy-200">Identifiant</th>
                  <th className="px-6 py-3 text-left font-semibold text-navy-700 dark:text-navy-200">Mot de passe</th>
                  <th className="px-6 py-3 text-center font-semibold text-navy-700 dark:text-navy-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuthorities.length > 0 ? (
                  filteredAuthorities.map((auth) => (
                  <tr key={auth.username} className="border-b border-navy-50 dark:border-navy-800 hover:bg-navy-50 dark:hover:bg-navy-800/50 transition">
                    <td className="px-6 py-4 text-navy dark:text-white font-medium">
                      {auth.first_name} {auth.last_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-navy-600 dark:text-navy-300 bg-navy-50 dark:bg-navy-800 px-2 py-1 rounded">
                          {auth.username}
                        </code>
                        <button
                          onClick={() => copyToClipboard(auth.username, `username-${auth.username}`)}
                          className="text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white transition"
                        >
                          {copiedField === `username-${auth.username}` ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-navy-600 dark:text-navy-300 bg-navy-50 dark:bg-navy-800 px-2 py-1 rounded">
                          {visiblePasswords[auth.username] ? auth.password : '••••••••'}
                        </code>
                        <button
                          onClick={() => togglePasswordVisibility(auth.username)}
                          className="text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white transition"
                          title={visiblePasswords[auth.username] ? 'Masquer' : 'Afficher'}
                        >
                          {visiblePasswords[auth.username] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(auth.password, `password-${auth.username}`)}
                          className="text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white transition"
                        >
                          {copiedField === `password-${auth.username}` ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setRegenerateConfirmModal(auth.username)}
                          className="text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white transition"
                          title="Régénérer le mot de passe"
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteModal(auth.username)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-navy-600 dark:text-navy-300">
                      Aucune autorité ne correspond à votre recherche
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Confirmation Régénérer */}
      {regenerateConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-navy dark:text-white mb-2">
              Confirmer la régénération
            </h3>
            <p className="text-navy-600 dark:text-navy-300 mb-6">
              Êtes-vous sûr de vouloir régénérer le mot de passe pour <strong>{regenerateConfirmModal}</strong> ?
              Un nouveau mot de passe sera généré et devra être partagé avec l'autorité.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setRegenerateConfirmModal(null)}
                className="flex-1 bg-navy-100 dark:bg-navy-800 text-navy dark:text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-navy-200 dark:hover:bg-navy-700 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRegenerate}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Régénérer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Résultat Régénération */}
      {regenerateResultModal && newPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4">
              Mot de passe régénéré ✓
            </h3>

            <div className="space-y-4">
              <div className="bg-navy-50 dark:bg-navy-800 p-3 rounded-lg">
                <p className="text-xs font-medium text-navy-600 dark:text-navy-300 mb-1">Utilisateur</p>
                <p className="font-mono text-navy dark:text-white">{newPassword.username}</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 p-3 rounded-lg">
                <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Nouveau mot de passe</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-green-900 dark:text-green-100 flex-1 break-all">{newPassword.password}</code>
                  <button
                    onClick={() => copyToClipboard(newPassword.password, 'newpass')}
                    className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                  >
                    {copiedField === 'newpass' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-navy-600 dark:text-navy-300">
                Partagez ce mot de passe avec l'autorité en personne.
              </p>
            </div>

            <button
              onClick={() => {
                setRegenerateResultModal(null);
                setNewPassword(null);
              }}
              className="w-full mt-4 bg-navy dark:bg-navy-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-700 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal Supprimer */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-navy-600 dark:text-navy-300 mb-6">
              Êtes-vous sûr de vouloir supprimer l'autorité <strong>{deleteModal}</strong> ?
              Cette action est irréversible.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 bg-navy-100 dark:bg-navy-800 text-navy dark:text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-navy-200 dark:hover:bg-navy-700 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleDeleteAuthority(deleteModal);
                }}
                className="flex-1 bg-red text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-red-600 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
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
