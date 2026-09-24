import { useState, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../shared/toast/ToastContext';
import AutoriteShell from '../desktop/AutoriteShell';
import client from '../../api/client';
import { Users, Search, ChevronRight, X, AlertCircle, Inbox, Bell, Clock, TrendingUp, Eye } from 'lucide-react';

function AuthorityTrackingContent() {
  const { darkMode } = useTheme();
  const { role } = useAuth();
  const { showToast } = useToast();
  const [authorities, setAuthorities] = useState([]);
  const [totalStats, setTotalStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState(null);

  useEffect(() => {
    if (role !== 'admin') return;

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
  }, [role, showToast]);

  const filteredAuthorities = authorities.filter((auth) => {
    const query = searchQuery.toLowerCase();
    return (
      auth.first_name.toLowerCase().includes(query) ||
      auth.last_name.toLowerCase().includes(query) ||
      auth.username.toLowerCase().includes(query) ||
      auth.email.toLowerCase().includes(query)
    );
  });

  if (role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy dark:text-white">Accès réservé</h2>
          <p className="text-navy-600 dark:text-navy-300">Seuls les administrateurs peuvent voir cette page.</p>
        </div>
      </div>
    );
  }

  const bgCard = darkMode ? 'bg-navy' : 'bg-white';
  const borderCard = darkMode ? 'border-navy-800' : 'border-navy-50';
  const bgTable = darkMode ? 'bg-navy-900' : 'bg-white';
  const hoverRow = darkMode ? 'hover:bg-navy-800/50' : 'hover:bg-navy-50/50';

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-navy dark:text-white flex items-center gap-3">
          <Users size={32} className="text-red" />
          Suivi des Autorités
        </h1>
        <p className="text-sm text-navy-600 dark:text-navy-200 mt-1">
          Aperçu du travail et des performances de vos équipes
        </p>
      </div>

      {/* Statistiques Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertCircle}
          title="Crises Gérées"
          value={totalStats.crises_gerees || 0}
          color="from-red-500 to-red-600"
        />
        <StatCard
          icon={Inbox}
          title="Requêtes Traitées"
          value={totalStats.requetes_traitees || 0}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Bell}
          title="Alertes Envoyées"
          value={totalStats.alertes_envoyees || 0}
          color="from-orange-500 to-orange-600"
        />
        <StatCard
          icon={Clock}
          title="Heures Travail"
          value={Math.round(totalStats.heures_travail_total || 0)}
          suffix="h"
          color="from-green-500 to-green-600"
        />
      </div>

      {/* Recherche + Tableau */}
      <div className={`${bgTable} border ${borderCard} rounded-xl overflow-hidden`}>
        {/* Barre de recherche */}
        <div className="p-6 border-b border-navy-200 dark:border-navy-800">
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

        {/* Tableau */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red mx-auto mb-2"></div>
              <p className="text-navy-600 dark:text-navy-300">Chargement...</p>
            </div>
          </div>
        ) : filteredAuthorities.length === 0 ? (
          <div className="p-12 text-center text-navy-600 dark:text-navy-300">
            Aucune autorité trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-200 dark:border-navy-800 bg-navy-50 dark:bg-navy-800">
                  <th className="px-6 py-4 text-left font-semibold text-navy-700 dark:text-navy-200">Nom</th>
                  <th className="px-6 py-4 text-left font-semibold text-navy-700 dark:text-navy-200">Email</th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">Crises</th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">Requêtes</th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">Alertes</th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">Heures</th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">Activité</th>
                  <th className="px-6 py-4 text-center font-semibold text-navy-700 dark:text-navy-200">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuthorities.map((auth) => (
                  <tr key={auth.id} className={`border-b border-navy-200 dark:border-navy-800 ${hoverRow} transition-colors cursor-pointer`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-navy dark:text-white">
                          {auth.first_name} {auth.last_name}
                        </p>
                        <p className="text-xs text-navy-600 dark:text-navy-400 mt-0.5">{auth.username}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-navy-600 dark:text-navy-300">{auth.email}</td>
                    <td className="px-6 py-4 text-center font-semibold text-navy dark:text-white">{auth.crises_gerees}</td>
                    <td className="px-6 py-4 text-center font-semibold text-navy dark:text-white">{auth.requetes_traitees}</td>
                    <td className="px-6 py-4 text-center font-semibold text-navy dark:text-white">{auth.alertes_envoyees}</td>
                    <td className="px-6 py-4 text-center font-semibold text-navy dark:text-white">{auth.heures_travail.toFixed(1)}h</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-2 w-24 bg-navy-100 dark:bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400"
                            style={{ width: `${calculateActivityScore(auth)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 w-8 text-right">
                          {calculateActivityScore(auth)}%
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
        )}
      </div>

      {/* Modal Détails */}
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

function StatCard({ icon: Icon, title, value, suffix = '', color }) {
  return (
    <div className={`rounded-xl overflow-hidden shadow-md transition-transform hover:scale-105`}>
      <div className={`bg-gradient-to-br ${color} p-6 text-white`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium opacity-90">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}{suffix}</p>
          </div>
          <Icon size={24} className="opacity-80" />
        </div>
        <div className="h-1 bg-white/20 rounded-full"></div>
      </div>
    </div>
  );
}

function AuthorityDetailModal({ authority, onClose, darkMode }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (activeTab === 'activities') {
      setActivitiesLoading(true);
      client.get(`/users/authority-activities/${authority.id}/`)
        .then(res => setActivities(res.data.activities || []))
        .catch(err => showToast('Erreur lors du chargement des activités', 'error'))
        .finally(() => setActivitiesLoading(false));
    }
  }, [activeTab, authority.id, showToast]);

  const bgModal = darkMode ? 'bg-navy-900' : 'bg-white';
  const borderModal = darkMode ? 'border-navy-800' : 'border-navy-50';
  const bgTabActive = darkMode ? 'bg-navy-800 text-white' : 'bg-navy-50 text-navy';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`${bgModal} border ${borderModal} rounded-xl max-w-2xl w-full my-8`}>
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-800">
          <div>
            <h2 className="text-2xl font-bold text-navy dark:text-white">
              {authority.first_name} {authority.last_name}
            </h2>
            <p className="text-sm text-navy-600 dark:text-navy-400 mt-1">{authority.username}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
          >
            <X size={24} className="text-navy-600 dark:text-navy-300" />
          </button>
        </div>

        {/* Onglets */}
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
              {tab === 'overview' ? 'Vue d\'ensemble' : 'Historique des activités'}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <DetailStat icon={AlertCircle} label="Crises gérées" value={authority.crises_gerees} />
                <DetailStat icon={Inbox} label="Requêtes traitées" value={authority.requetes_traitees} />
                <DetailStat icon={Bell} label="Alertes envoyées" value={authority.alertes_envoyees} />
                <DetailStat icon={Clock} label="Heures de travail" value={`${authority.heures_travail.toFixed(1)}h`} />
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-navy-800' : 'bg-navy-50'}`}>
                <p className="text-sm font-semibold text-navy-700 dark:text-navy-200 mb-3">Informations de contact</p>
                <div className="space-y-2 text-sm text-navy-600 dark:text-navy-300">
                  <p>📧 {authority.email}</p>
                  <p>📱 {authority.telephone}</p>
                  <p>📅 Créé le {new Date(authority.date_joined).toLocaleDateString('fr-FR')}</p>
                  {authority.derniere_connexion ? (
                    <p>🔑 Dernière connexion: {new Date(authority.derniere_connexion).toLocaleDateString('fr-FR')}</p>
                  ) : (
                    <p>🔑 Pas encore connecté</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div>
              {activitiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red mx-auto mb-2"></div>
                  <p className="text-navy-600 dark:text-navy-300 text-sm">Chargement...</p>
                </div>
              ) : activities.length === 0 ? (
                <p className="text-center text-navy-600 dark:text-navy-300 py-8">Aucune activité enregistrée</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-3 rounded-lg ${darkMode ? 'bg-navy-800/50' : 'bg-navy-50'} border ${darkMode ? 'border-navy-700' : 'border-navy-100'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-navy dark:text-white text-sm">{activity.action_label}</p>
                          {activity.description && (
                            <p className="text-xs text-navy-600 dark:text-navy-400 mt-1">{activity.description}</p>
                          )}
                          {activity.zone && (
                            <p className="text-xs text-navy-600 dark:text-navy-400">Zone: {activity.zone}</p>
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
              )}
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
  const total = authority.crises_gerees + authority.requetes_traitees + authority.alertes_envoyees;
  return Math.min(100, (total / 200) * 100);
}

export default function AuthorityTrackingPage() {
  return (
    <AutoriteShell>
      <AuthorityTrackingContent />
    </AutoriteShell>
  );
}
