import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  Lock,
  Trash2,
  RefreshCw,
  Search,
  Loader2,
  UserPlus,
  TrendingUp,
  Users,
  AlertCircle,
  Inbox,
  Bell,
  Clock,
  Eye,
  X,
  Flame,
  Wrench,
  Building2,
} from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import client from '../../api/client';
import { useToast } from '../../shared/toast/ToastContext';
import EtatListe from '../../shared/components/EtatListe';

const SERVICES_AUTORITE = [
  {
    id: 'bnsp',
    label: 'BNSP Pompiers (Sauvetage & Évacuation)',
    short: 'BNSP Pompiers',
    icon: Flame,
    badgeClass:
      'bg-red-50 dark:bg-red-950/40 text-[#CC131A] dark:text-red-300 border-red-200 dark:border-red-800/60',
  },
  {
    id: 'onas',
    label: 'ONAS Hydraulique (Pompage & Réseau)',
    short: 'ONAS Hydraulique',
    icon: Wrench,
    badgeClass:
      'bg-blue-50 dark:bg-blue-950/40 text-[#0B2545] dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
  },
  {
    id: 'mairie',
    label: 'Cellule Municipale (Logistique & Relais)',
    short: 'Cellule Municipale',
    icon: Building2,
    badgeClass:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
  },
];

function getServiceInfo(auth) {
  const raw = (auth?.service || '').toLowerCase();
  const found = SERVICES_AUTORITE.find((s) => s.id === raw);
  if (found) return found;
  const hay = `${auth?.username || ''} ${auth?.email || ''}`.toLowerCase();
  if (hay.includes('onas') || hay.includes('hydro')) return SERVICES_AUTORITE[1];
  if (hay.includes('mairie') || hay.includes('muni')) return SERVICES_AUTORITE[2];
  return SERVICES_AUTORITE[0];
}

function ServiceBadge({ auth }) {
  const info = getServiceInfo(auth);
  const Icon = info.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${info.badgeClass}`}
    >
      <Icon size={12} />
      <span>{info.short}</span>
    </span>
  );
}

// Les hooks de la page vivent dans AuthoritiesWorkspace : le contrôle du rôle
// ne doit pas précéder des hooks, sinon React plante quand le rôle change.
export function ManageAuthoritiesPageContent({ defaultTab = 'manage' }) {
  const { role } = useAuth();
  if (role !== 'admin') return <AccesReserveAdmin />;
  return <AuthoritiesWorkspace defaultTab={defaultTab} />;
}

function AccesReserveAdmin() {
  const navigate = useNavigate();
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

function AuthoritiesWorkspace({ defaultTab = 'manage' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="space-y-6">
      {/* En-tête unifié avec sélecteur d'onglets (Comptes & Affectations / Suivi & Performances) */}
      <div className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#CC131A] block">
            Supervision C.O.D · Administrateur Général
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white mt-0.5">
            {activeTab === 'manage' ? 'Gérer les autorités' : 'Suivi des Autorités'}
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 dark:text-navy-300 mt-0.5">
            {activeTab === 'manage'
              ? 'Créez des comptes autorité par corps d’intervention (BNSP, ONAS, Mairie). Les identifiants sont générés automatiquement.'
              : 'Aperçu en temps réel des interventions, alertes et performances par unité opérationnelle.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-navy-50 dark:bg-navy-900 border border-navy-100 dark:border-navy-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-[#0B2545] dark:bg-white text-white dark:text-[#0B2545] shadow-xs'
                : 'text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <UserPlus size={14} />
            <span>Comptes &amp; Affectations</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tracking')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'tracking'
                ? 'bg-[#0B2545] dark:bg-white text-white dark:text-[#0B2545] shadow-xs'
                : 'text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>Suivi &amp; Performances</span>
          </button>
        </div>
      </div>

      {activeTab === 'manage' ? <AuthoritiesManager /> : <AuthorityTrackingTab />}
    </div>
  );
}

function AuthoritiesManager() {
  const { darkMode } = useTheme();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [authorities, setAuthorities] = useState([]);
  const [copiedField, setCopiedField] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [regenerateConfirmModal, setRegenerateConfirmModal] = useState(null);
  const [regenerateResultModal, setRegenerateResultModal] = useState(null);
  const [newPassword, setNewPassword] = useState(null);
  const [creationResultModal, setCreationResultModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');

  // Filtrer les autorités selon la recherche et le corps d'intervention
  const filteredAuthorities = authorities.filter((auth) => {
    const info = getServiceInfo(auth);
    if (serviceFilter !== 'all' && info.id !== serviceFilter) return false;
    const query = searchQuery.toLowerCase();
    return (
      (auth.first_name || '').toLowerCase().includes(query) ||
      (auth.last_name || '').toLowerCase().includes(query) ||
      (auth.username || '').toLowerCase().includes(query) ||
      (auth.email && auth.email.toLowerCase().includes(query))
    );
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    username: '',
    service: 'bnsp',
  });

  const prenom = formData.first_name.trim();
  const nom = formData.last_name.trim();
  const { data: usernameOptions = [], isFetching: loadingUsernames } = useQuery({
    queryKey: ['check-username', prenom, nom],
    queryFn: () =>
      client
        .get('/users/check-username/', { params: { first_name: prenom, last_name: nom } })
        .then((r) => r.data.options || []),
    enabled: Boolean(prenom && nom),
  });
  const usernameChoisi = usernameOptions.includes(formData.username)
    ? formData.username
    : (usernameOptions[0] ?? '');

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
    if (!usernameChoisi) newErrors.username = 'Identifiant requis';
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
        username: usernameChoisi,
        service: formData.service,
      });

      const created = { ...response.data, service: response.data.service || formData.service };
      setAuthorities([created, ...authorities]);
      setCreationResultModal(created);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        telephone: '',
        username: '',
        service: formData.service,
      });
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

  const handleConfirmRegenerate = async () => {
    try {
      const response = await client.post('/users/regenerate-authority-password/', {
        username: regenerateConfirmModal,
      });
      setNewPassword(response.data);
      setRegenerateConfirmModal(null);
      setRegenerateResultModal(response.data.username);
      showToast('Mot de passe régénéré avec succès !', 'success');
    } catch {
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
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  useEffect(() => {
    const loadAuthorities = async () => {
      try {
        const response = await client.get('/users/list-authorities/');
        setAuthorities(response.data.authorities || []);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Erreur lors du chargement des autorités:', error);
      }
    };
    loadAuthorities();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl p-6 shadow-xs">
        <h2 className="text-lg font-bold text-navy dark:text-white mb-4">
          Créer une nouvelle autorité
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Choix du Corps d'intervention */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-navy-600 dark:text-navy-300 mb-2">
              Corps d&apos;intervention affecté
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SERVICES_AUTORITE.map((srv) => {
                const Icon = srv.icon;
                const isSelected = formData.service === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, service: srv.id }))}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-xs'
                        : 'bg-navy-50/50 dark:bg-navy-900 text-navy-800 dark:text-navy-100 border-navy-200 dark:border-navy-700 hover:bg-navy-100/70'
                    }`}
                  >
                    <Icon size={18} className={isSelected ? 'text-white' : 'text-[#CC131A]'} />
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold block truncate">{srv.short}</span>
                      <span
                        className={`text-[10px] block truncate ${
                          isSelected ? 'text-slate-200' : 'text-navy-500 dark:text-navy-400'
                        }`}
                      >
                        {srv.label.split('(')[1]?.replace(')', '') || srv.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="autorite-first-name"
                className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1"
              >
                Prénom
              </label>
              <input
                id="autorite-first-name"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Jean"
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy dark:text-white"
              />
              {errors.first_name && (
                <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="autorite-last-name"
                className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1"
              >
                Nom
              </label>
              <input
                id="autorite-last-name"
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
            <div
              className={`px-4 py-3 rounded-lg ${
                darkMode
                  ? 'bg-navy-800 border border-navy-700'
                  : 'bg-navy-50 border border-navy-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <p className={`text-xs font-medium ${darkMode ? 'text-navy-400' : 'text-navy-600'}`}>
                  Choisissez l’identifiant
                </p>
                {loadingUsernames && <Loader2 size={12} className="animate-spin" />}
              </div>
              <div className="space-y-2">
                {usernameOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="username"
                      value={option}
                      checked={usernameChoisi === option}
                      onChange={handleChange}
                      className="accent-red"
                    />
                    <code
                      className={`font-mono text-sm font-semibold ${
                        usernameChoisi === option
                          ? 'text-navy-900 dark:text-white'
                          : 'text-navy-600 dark:text-navy-300'
                      }`}
                    >
                      {option}
                    </code>
                  </label>
                ))}
              </div>
            </div>
          )}
          {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="autorite-email"
                className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1"
              >
                Email
              </label>
              <input
                id="autorite-email"
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
              <label
                htmlFor="autorite-telephone"
                className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1"
              >
                Numéro de téléphone
              </label>
              <input
                id="autorite-telephone"
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="+221 77 000 00 00"
                className="w-full px-4 py-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy dark:text-white"
              />
              {errors.telephone && <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B2545] dark:bg-navy-800 text-white py-2.5 rounded-xl font-bold hover:bg-navy-700 dark:hover:bg-navy-700 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Création...' : "Créer l'autorité"}
          </button>
        </form>
      </div>

      {authorities.length > 0 && (
        <div className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-navy-100 dark:border-navy-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-navy dark:text-white">
                Autorités créées ({filteredAuthorities.length} / {authorities.length})
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'Tous les corps' },
                  ...SERVICES_AUTORITE.map((s) => ({ id: s.id, label: s.short })),
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setServiceFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      serviceFilter === f.id
                        ? 'bg-[#0B2545] text-white'
                        : 'bg-navy-50 dark:bg-navy-900 text-navy-600 dark:text-navy-300 hover:bg-navy-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
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
                <tr className="border-b border-navy-100 dark:border-navy-800 bg-navy-50 dark:bg-navy-900">
                  <th className="px-6 py-3 text-left font-semibold text-navy-700 dark:text-navy-200">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-navy-700 dark:text-navy-200">
                    Corps affecté
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-navy-700 dark:text-navy-200">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-navy-700 dark:text-navy-200">
                    Identifiant
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-navy-700 dark:text-navy-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAuthorities.length > 0 ? (
                  filteredAuthorities.map((auth) => (
                    <tr
                      key={auth.username}
                      className="border-b border-navy-50 dark:border-navy-800 hover:bg-navy-50 dark:hover:bg-navy-800/50 transition"
                    >
                      <td className="px-6 py-4 text-navy dark:text-white font-medium">
                        {auth.first_name} {auth.last_name}
                      </td>
                      <td className="px-6 py-4">
                        <ServiceBadge auth={auth} />
                      </td>
                      <td className="px-6 py-4 text-sm text-navy-600 dark:text-navy-300">
                        {auth.email || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-navy-600 dark:text-navy-300 bg-navy-50 dark:bg-navy-800 px-2 py-1 rounded">
                            {auth.username}
                          </code>
                          <button
                            onClick={() =>
                              copyToClipboard(auth.username, `username-${auth.username}`)
                            }
                            className="text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white transition"
                          >
                            {copiedField === `username-${auth.username}` ? (
                              <Check size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
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
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-navy-600 dark:text-navy-300"
                    >
                      Aucune autorité ne correspond à votre recherche
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Résultat Création */}
      {creationResultModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">
              Autorité créée avec succès
            </h3>
            <p className="text-sm text-navy-600 dark:text-navy-300 mb-4">
              Voici les identifiants d’accès pour{' '}
              <strong>
                {creationResultModal.first_name} {creationResultModal.last_name}
              </strong>
              .
              <strong className="block mt-2">
                Copiez le mot de passe et partagez-le en personne.
              </strong>
            </p>

            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 p-3 rounded-lg">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Identifiant
                </p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-blue-900 dark:text-blue-100 flex-1">
                    {creationResultModal.username}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(creationResultModal.username, 'creation-username')
                    }
                    className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    {copiedField === 'creation-username' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 p-3 rounded-lg">
                <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                  Mot de passe temporaire
                </p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-green-900 dark:text-green-100 flex-1 break-all">
                    {creationResultModal.password}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(creationResultModal.password, 'creation-password')
                    }
                    className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                  >
                    {copiedField === 'creation-password' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCreationResultModal(null)}
              className="w-full mt-4 bg-navy dark:bg-navy-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-700 transition"
            >
              Fermer
            </button>
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
              Êtes-vous sûr de vouloir régénérer le mot de passe pour{' '}
              <strong>{regenerateConfirmModal}</strong> ? Un nouveau mot de passe sera généré et
              devra être partagé avec l’autorité.
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
                <p className="text-xs font-medium text-navy-600 dark:text-navy-300 mb-1">
                  Utilisateur
                </p>
                <p className="font-mono text-navy dark:text-white">{newPassword.username}</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 p-3 rounded-lg">
                <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                  Nouveau mot de passe
                </p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-green-900 dark:text-green-100 flex-1 break-all">
                    {newPassword.password}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newPassword.password, 'newpass')}
                    className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                  >
                    {copiedField === 'newpass' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-navy-600 dark:text-navy-300">
                Partagez ce mot de passe avec l’autorité en personne.
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
              Êtes-vous sûr de vouloir supprimer l’autorité <strong>{deleteModal}</strong> ? Cette
              action est irréversible.
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

function AuthorityTrackingTab() {
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [authorities, setAuthorities] = useState([]);
  const [totalStats, setTotalStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await client.get('/users/authority-stats/');
        setAuthorities(response.data.authorities || []);
        setTotalStats(response.data.total_stats || {});
      } catch (error) {
        if (import.meta.env.DEV) console.error('Erreur récupération stats:', error);
        showToast('Erreur lors du chargement des statistiques', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [showToast]);

  const filteredAuthorities = authorities.filter((auth) => {
    const query = searchQuery.toLowerCase();
    return (
      (auth.first_name || '').toLowerCase().includes(query) ||
      (auth.last_name || '').toLowerCase().includes(query) ||
      (auth.username || '').toLowerCase().includes(query) ||
      (auth.email || '').toLowerCase().includes(query)
    );
  });

  const borderCard = darkMode ? 'border-navy-800' : 'border-navy-100';
  const bgTable = darkMode ? 'bg-[#071322]' : 'bg-white';
  const hoverRow = darkMode ? 'hover:bg-navy-800/50' : 'hover:bg-navy-50/50';

  return (
    <div className="space-y-6">
      {/* Statistiques Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertCircle}
          title="Crises Gérées"
          value={totalStats.crises_gerees || 0}
        />
        <StatCard
          icon={Inbox}
          title="Requêtes Traitées"
          value={totalStats.requetes_traitees || 0}
        />
        <StatCard
          icon={Bell}
          title="Alertes Envoyées"
          value={totalStats.alertes_envoyees || 0}
        />
        <StatCard
          icon={Clock}
          title="Heures Travail"
          value={Math.round(totalStats.heures_travail_total || 0)}
          suffix="h"
        />
      </div>

      {/* Recherche + Tableau */}
      <div className={`${bgTable} border ${borderCard} rounded-2xl overflow-hidden shadow-xs`}>
        <div className="p-6 border-b border-navy-100 dark:border-navy-800">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-navy-400 dark:text-navy-500" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou identifiant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy dark:text-white text-sm"
            />
          </div>
          <p className="text-xs text-navy-600 dark:text-navy-400 mt-2">
            {filteredAuthorities.length} / {authorities.length} autorités trouvées
          </p>
        </div>

        <EtatListe
          chargement={loading}
          vide={filteredAuthorities.length === 0}
          renduChargement={
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red mx-auto mb-2"></div>
                <p className="text-navy-600 dark:text-navy-300">Chargement...</p>
              </div>
            </div>
          }
          renduVide={
            <div className="p-12 text-center text-navy-600 dark:text-navy-300">
              Aucune autorité trouvée
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 dark:border-navy-800 bg-navy-50 dark:bg-navy-900">
                  <th className="px-6 py-4 text-left font-semibold text-navy-700 dark:text-navy-200">
                    Nom
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-navy-700 dark:text-navy-200">
                    Unité
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">
                    Crises
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">
                    Requêtes
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">
                    Alertes
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">
                    Heures
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">
                    Activité
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAuthorities.map((auth) => (
                  <tr
                    key={auth.id}
                    className={`border-b border-navy-100 dark:border-navy-800 ${hoverRow} transition-colors cursor-pointer`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-navy dark:text-white">
                          {auth.first_name} {auth.last_name}
                        </p>
                        <p className="text-xs text-navy-600 dark:text-navy-400 mt-0.5">
                          {auth.username}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ServiceBadge auth={auth} />
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-navy dark:text-white">
                      {auth.crises_gerees}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-navy dark:text-white">
                      {auth.requetes_traitees}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-navy dark:text-white">
                      {auth.alertes_envoyees}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-navy dark:text-white">
                      {Number(auth.heures_travail || 0).toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-2 w-24 bg-navy-100 dark:bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${calculateActivityScore(auth)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 w-8 text-right">
                          {Math.round(calculateActivityScore(auth))}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedAuthority(auth)}
                        className="text-navy-600 dark:text-navy-300 hover:text-navy dark:hover:text-white transition-colors"
                        title="Voir détails"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EtatListe>
      </div>

      {selectedAuthority && (
        <AuthorityDetailModal
          authority={selectedAuthority}
          onClose={() => setSelectedAuthority(null)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, title, value, suffix = '' }) {
  return (
    <div className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-navy-500 dark:text-navy-400">
          {title}
        </p>
        <p className="text-3xl font-black text-[#0B2545] dark:text-white mt-1">
          {value}
          {suffix}
        </p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-navy-50 dark:bg-navy-900 border border-navy-100 dark:border-navy-800 flex items-center justify-center text-[#0B2545] dark:text-white">
        <Icon size={20} />
      </div>
    </div>
  );
}

function AuthorityDetailModal({ authority, onClose, darkMode }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { showToast } = useToast();

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['authority-activities', authority.id],
    queryFn: () =>
      client
        .get(`/users/authority-activities/${authority.id}/`)
        .then((res) => res.data.activities || [])
        .catch((err) => {
          showToast('Erreur lors du chargement des activités', 'error');
          throw err;
        }),
    enabled: activeTab === 'activities',
  });

  const bgModal = darkMode ? 'bg-navy-900' : 'bg-white';
  const borderModal = darkMode ? 'border-navy-800' : 'border-navy-50';
  const bgTabActive = darkMode ? 'bg-navy-800 text-white' : 'bg-navy-50 text-navy';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`${bgModal} border ${borderModal} rounded-xl max-w-2xl w-full my-8`}>
        <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-navy dark:text-white">
                {authority.first_name} {authority.last_name}
              </h2>
              <ServiceBadge auth={authority} />
            </div>
            <p className="text-sm text-navy-600 dark:text-navy-400 mt-1">{authority.username}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
          >
            <X size={24} className="text-navy-600 dark:text-navy-300" />
          </button>
        </div>

        <div className="flex border-b border-navy-200 dark:border-navy-800">
          {['overview', 'activities'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? `${bgTabActive} border-red`
                  : `text-navy-600 dark:text-navy-400 border-transparent hover:bg-navy-50 dark:hover:bg-navy-800/50`
              }`}
            >
              {tab === 'overview' ? "Vue d'ensemble" : 'Historique des activités'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <DetailStat icon={AlertCircle} label="Crises gérées" value={authority.crises_gerees} />
                <DetailStat icon={Inbox} label="Requêtes traitées" value={authority.requetes_traitees} />
                <DetailStat icon={Bell} label="Alertes envoyées" value={authority.alertes_envoyees} />
                <DetailStat
                  icon={Clock}
                  label="Heures de travail"
                  value={`${Number(authority.heures_travail || 0).toFixed(1)}h`}
                />
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-navy-800' : 'bg-navy-50'}`}>
                <p className="text-sm font-semibold text-navy-700 dark:text-navy-200 mb-3">
                  Informations de contact
                </p>
                <div className="space-y-2 text-sm text-navy-600 dark:text-navy-300">
                  <p>📧 {authority.email}</p>
                  <p>📱 {authority.telephone}</p>
                  <p>📅 Créé le {new Date(authority.date_joined).toLocaleDateString('fr-FR')}</p>
                  {authority.derniere_connexion ? (
                    <p>
                      🔑 Dernière connexion:{' '}
                      {new Date(authority.derniere_connexion).toLocaleDateString('fr-FR')}
                    </p>
                  ) : (
                    <p>🔑 Pas encore connecté</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div>
              <EtatListe
                chargement={activitiesLoading}
                vide={activities.length === 0}
                renduChargement={
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red mx-auto mb-2"></div>
                    <p className="text-navy-600 dark:text-navy-300 text-sm">Chargement...</p>
                  </div>
                }
                renduVide={
                  <p className="text-center text-navy-600 dark:text-navy-300 py-8">
                    Aucune activité enregistrée
                  </p>
                }
              >
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-3 rounded-lg ${
                        darkMode ? 'bg-navy-800/50' : 'bg-navy-50'
                      } border ${darkMode ? 'border-navy-700' : 'border-navy-100'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-navy dark:text-white text-sm">
                            {activity.action_label}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-navy-600 dark:text-navy-400 mt-1">
                              {activity.description}
                            </p>
                          )}
                          {activity.zone && (
                            <p className="text-xs text-navy-600 dark:text-navy-400">
                              Zone: {activity.zone}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-navy-600 dark:text-navy-500 ml-4 whitespace-nowrap">
                          {new Date(activity.timestamp).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </EtatListe>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-3 bg-red/10 rounded-lg">
        <Icon size={20} className="text-red" />
      </div>
      <div>
        <p className="text-xs text-navy-600 dark:text-navy-400">{label}</p>
        <p className="text-lg font-bold text-navy dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function calculateActivityScore(authority) {
  const total =
    (authority.crises_gerees || 0) +
    (authority.requetes_traitees || 0) +
    (authority.alertes_envoyees || 0);
  return Math.min(100, (total / 200) * 100);
}

export default function ManageAuthoritiesPage() {
  return (
    <AutoriteShell>
      <ManageAuthoritiesPageContent defaultTab="manage" />
    </AutoriteShell>
  );
}
