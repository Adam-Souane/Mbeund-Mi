import { useState, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../shared/toast/ToastContext';
import AutoriteShell from '../desktop/AutoriteShell';
import client from '../../api/client';
import { Users, Target, AlertCircle, Clock, TrendingUp, Award, Star } from 'lucide-react';

function AuthorityTrackingContent() {
  const { darkMode } = useTheme();
  const { role } = useAuth();
  const { showToast } = useToast();
  const [authorities, setAuthorities] = useState([]);
  const [totalStats, setTotalStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'admin') return;

    const fetchStats = async () => {
      try {
        const response = await client.get('/users/authority-stats/');
        setAuthorities(response.data.authorities || []);
        setTotalStats(response.data.total_stats || {});
      } catch (error) {
        console.error('Erreur récupération stats:', error);
        showToast('Erreur lors du chargement des statistiques', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [role, showToast]);

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
  const textMuted = darkMode ? 'text-navy-400' : 'text-navy-600';

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
          icon={Target}
          title="Crises Gérées"
          value={totalStats.crises_gerees || 0}
          color="from-red-500 to-red-600"
          darkMode={darkMode}
        />
        <StatCard
          icon={AlertCircle}
          title="Requêtes Traitées"
          value={totalStats.requetes_traitees || 0}
          color="from-blue-500 to-blue-600"
          darkMode={darkMode}
        />
        <StatCard
          icon={TrendingUp}
          title="Alertes Envoyées"
          value={totalStats.alertes_envoyees || 0}
          color="from-orange-500 to-orange-600"
          darkMode={darkMode}
        />
        <StatCard
          icon={Clock}
          title="Heures Travail"
          value={Math.round(totalStats.heures_travail_total || 0)}
          suffix="h"
          color="from-green-500 to-green-600"
          darkMode={darkMode}
        />
      </div>

      {/* Grille des Autorités */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red mx-auto mb-2"></div>
            <p className="text-navy-600 dark:text-navy-300">Chargement...</p>
          </div>
        </div>
      ) : authorities.length === 0 ? (
        <div className={`${bgCard} border ${borderCard} rounded-xl p-12 text-center`}>
          <Users size={48} className="mx-auto mb-4 text-navy-400 dark:text-navy-600" />
          <p className={textMuted}>Aucune autorité créée pour le moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {authorities.map((auth) => (
            <AuthorityCard key={auth.id} authority={auth} darkMode={darkMode} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, title, value, suffix = '', color, darkMode }) {
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

function AuthorityCard({ authority, darkMode }) {
  const bgCard = darkMode ? 'bg-navy-900' : 'bg-white';
  const borderCard = darkMode ? 'border-navy-800' : 'border-navy-50';
  const textSecondary = darkMode ? 'text-navy-400' : 'text-navy-600';

  const performanceLevel = getPerformanceLevel(
    authority.crises_gerees,
    authority.requetes_traitees,
    authority.alertes_envoyees
  );

  return (
    <div className={`${bgCard} border ${borderCard} rounded-xl p-6 hover:shadow-lg transition-shadow`}>
      {/* En-tête avec performance badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-navy dark:text-white">
            {authority.first_name} {authority.last_name}
          </h3>
          <p className={`text-sm ${textSecondary}`}>{authority.username}</p>
        </div>
        <PerformanceBadge level={performanceLevel} />
      </div>

      {/* Informations de contact */}
      <div className={`text-xs ${textSecondary} space-y-1 mb-4 pb-4 border-b ${borderCard}`}>
        <p>📧 {authority.email}</p>
        <p>📱 {authority.telephone}</p>
      </div>

      {/* Mini Statistiques */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MiniStat
          label="Crises"
          value={authority.crises_gerees}
          icon="🚨"
          darkMode={darkMode}
        />
        <MiniStat
          label="Requêtes"
          value={authority.requetes_traitees}
          icon="📋"
          darkMode={darkMode}
        />
        <MiniStat
          label="Alertes"
          value={authority.alertes_envoyees}
          icon="🔔"
          darkMode={darkMode}
        />
        <MiniStat
          label="Heures"
          value={`${authority.heures_travail.toFixed(1)}h`}
          icon="⏱️"
          darkMode={darkMode}
        />
      </div>

      {/* Barre de progression activité */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold ${textSecondary}`}>Activité</span>
          <span className={`text-xs font-bold text-green-600 dark:text-green-400`}>
            {calculateActivityScore(authority)}%
          </span>
        </div>
        <div className="h-2 bg-navy-100 dark:bg-navy-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
            style={{ width: `${calculateActivityScore(authority)}%` }}
          ></div>
        </div>
      </div>

      {/* Dernière connexion */}
      <div className={`text-xs ${textSecondary} text-center`}>
        {authority.derniere_connexion ? (
          <>Dernière connexion: {new Date(authority.derniere_connexion).toLocaleDateString('fr-FR')}</>
        ) : (
          <>Pas encore connecté</>
        )}
      </div>
    </div>
  );
}

function PerformanceBadge({ level }) {
  const badges = {
    excellent: { emoji: '⭐', label: 'Excellent', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
    good: { emoji: '👍', label: 'Bon', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
    fair: { emoji: '📈', label: 'Acceptable', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
    new: { emoji: '🆕', label: 'Nouveau', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
  };

  const badge = badges[level] || badges.new;
  return (
    <div className={`${badge.color} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
      <span>{badge.emoji}</span>
      <span>{badge.label}</span>
    </div>
  );
}

function MiniStat({ label, value, icon, darkMode }) {
  const bgMini = darkMode ? 'bg-navy-800' : 'bg-navy-50';
  return (
    <div className={`${bgMini} rounded-lg p-2 text-center`}>
      <div className="text-xl mb-1">{icon}</div>
      <p className={`text-xs font-semibold ${darkMode ? 'text-navy-300' : 'text-navy-700'}`}>
        {value}
      </p>
      <p className={`text-xs ${darkMode ? 'text-navy-500' : 'text-navy-500'}`}>{label}</p>
    </div>
  );
}

function getPerformanceLevel(crises, requetes, alertes) {
  const total = crises + requetes + alertes;

  if (total === 0) return 'new';
  if (total >= 100) return 'excellent';
  if (total >= 50) return 'good';
  return 'fair';
}

function calculateActivityScore(authority) {
  // Score basé sur le total d'activités (max 200 = 100%)
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
