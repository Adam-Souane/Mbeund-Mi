import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Bell, AlertTriangle, MessageSquare, Smartphone, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { useConnexionTempsReel } from '../../realtime/etatConnexion';
import { useNotifications } from '../contexts/NotificationContext';

const NOTIFICATION_COLORS = {
  alerte: { bg: 'bg-red-50 dark:bg-red/15', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' },
  signalement: { bg: 'bg-blue-50 dark:bg-blue/15', border: 'border-blue-200 dark:border-blue-800', icon: MessageSquare, color: 'text-blue-600 dark:text-blue-400' },
  sms: { bg: 'bg-purple-50 dark:bg-purple/15', border: 'border-purple-200 dark:border-purple-800', icon: Smartphone, color: 'text-purple-600 dark:text-purple-400' },
  prediction: { bg: 'bg-orange-50 dark:bg-orange/15', border: 'border-orange-200 dark:border-orange-800', icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400' },
  toast: { bg: 'bg-green-50 dark:bg-green/15', border: 'border-green-200 dark:border-green-800', icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
  error: { bg: 'bg-red-50 dark:bg-red/15', border: 'border-red-200 dark:border-red-800', icon: AlertCircle, color: 'text-red-600 dark:text-red-400' },
};

/**
 * Centre de notifications temps réel.
 * Affiche les notifications WebSocket + Toast et permet de naviguer directement vers l'élément signalé.
 */
export default function NotificationCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAutorite = location.pathname.startsWith('/autorite');

  const isConnected = useConnexionTempsReel();
  const { notifications, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Mémorisation de la dernière notification lue dans le localStorage
  const [derniereVue, setDerniereVue] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_derniere_vue_notif');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const allNotifications = notifications;
  const unreadCount = allNotifications.filter((n) => n.id > derniereVue).length;

  // Déterminer la page de destination selon le sujet de la notification
  const getNotificationTargetUrl = (notif) => {
    if (notif.url) return notif.url;
    if (notif.link) return notif.link;
    if (notif.targetUrl) return notif.targetUrl;
    if (notif.data?.url) return notif.data.url;

    const type = (notif.type || '').toLowerCase();
    const message = (notif.data?.message || notif.message || '').toLowerCase();
    const titre = (notif.data?.titre || notif.data?.title || notif.title || '').toLowerCase();

    // 1. Alertes & Risques
    if (type === 'alerte' || type === 'prediction' || titre.includes('alerte') || message.includes('évacuation') || message.includes('risque')) {
      return isAutorite ? '/autorite/alertes' : '/citoyen/alertes';
    }

    // 2. Signalements & Confirmations de voisins
    if (type === 'signalement' || titre.includes('signalement') || titre.includes('+1 vu')) {
      if (message.includes('confirmé') || titre.includes('+1 vu') || message.includes('riverain')) {
        return isAutorite ? '/autorite/signalements' : '/citoyen/communaute';
      }
      return isAutorite ? '/autorite/signalements' : '/citoyen/signaler';
    }

    // 3. Carte & Zones
    if (type === 'carte' || titre.includes('carte') || titre.includes('zone') || notif.data?.zone_id) {
      return isAutorite ? '/autorite/carte' : '/citoyen/carte';
    }

    // 4. Météo & Prévisions
    if (type === 'prevision' || titre.includes('météo') || message.includes('pluie')) {
      return isAutorite ? '/autorite/previsions' : '/citoyen/alertes';
    }

    // 5. IoT & Capteurs (espace autorité)
    if (type === 'capteur' || message.includes('capteur') || message.includes('mesure')) {
      return isAutorite ? '/autorite/capteurs' : '/citoyen/carte';
    }

    return isAutorite ? '/autorite/tableau-de-bord' : '/citoyen';
  };

  const handleNotificationClick = (notif) => {
    // 1. Marquer comme lue
    if (notif.id > derniereVue) {
      setDerniereVue(notif.id);
      try {
        localStorage.setItem('mbeund_mi_derniere_vue_notif', String(notif.id));
      } catch {}
    }

    // 2. Fermer le panneau déroulant
    setIsOpen(false);

    // 3. Rediriger vers l'élément correspondant dans le tableau de bord
    const targetUrl = getNotificationTargetUrl(notif);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  const handleOpenPanel = () => {
    if (!isOpen && allNotifications.length > 0) {
      const highestId = Math.max(...allNotifications.map((n) => n.id));
      setDerniereVue(highestId);
      try {
        localStorage.setItem('mbeund_mi_derniere_vue_notif', String(highestId));
      } catch {}
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = () => {
    if (allNotifications.length > 0) {
      const highestId = Math.max(...allNotifications.map((n) => n.id));
      setDerniereVue(highestId);
      try {
        localStorage.setItem('mbeund_mi_derniere_vue_notif', String(highestId));
      } catch {}
    }
  };

  const getNotificationIcon = (type) => {
    const config = NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.alerte;
    const Icon = config.icon;
    return <Icon size={18} className={config.color} />;
  };

  return (
    <>
      {/* Badge de notification (header) */}
      <div className="relative">
        <button
          onClick={handleOpenPanel}
          className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-navy-700 dark:text-navy-200 hover:text-navy-950 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800 rounded-xl transition-colors cursor-pointer flex-shrink-0"
          title={isConnected ? 'Centre de notifications (connecté 24/7)' : 'Centre de notifications'}
        >
          <Bell size={18} />

          {/* Badge de compteur rouge pulsant */}
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-red-600 rounded-full animate-pulse-notification shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {/* Indicateur de connexion temps réel */}
          <span
            className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#071322] ${
              isConnected ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
            title={isConnected ? 'Connecté au flux d’alerte temps réel' : 'Mode standard'}
          />
        </button>

        {/* Panneau déroulant des notifications */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl shadow-2xl z-[2001] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-3.5 border-b border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-[#050D18]">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-navy-900 dark:text-white">
                  Notifications & Alertes
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950 text-red-600 px-2 py-0.5 rounded-full">
                    {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white"
                  >
                    Tout lire
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-100 dark:hover:bg-navy-800"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="max-h-96 overflow-y-auto divide-y divide-navy-100/70 dark:divide-navy-800/80">
              {allNotifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-navy-400">
                  Aucune notification pour le moment.
                </div>
              ) : (
                allNotifications.slice(0, 15).map((notif) => {
                  const titre = notif.data?.titre || notif.data?.title || notif.title || notif.type;
                  const message = notif.data?.message || notif.data?.description || notif.message;
                  const isUnread = notif.id > derniereVue;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 transition-all cursor-pointer group ${
                        isUnread
                          ? 'bg-red-50/40 dark:bg-red-950/25 hover:bg-red-50/80 dark:hover:bg-red-950/50'
                          : 'hover:bg-navy-50/80 dark:hover:bg-white/5'
                      }`}
                      title="Cliquer pour afficher cet élément sur le tableau de bord"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-0.5">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-xs sm:text-sm text-navy-900 dark:text-white truncate group-hover:text-[#CC131A] transition-colors">
                              {titre}
                            </p>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
                              )}
                              <ChevronRight size={14} className="text-navy-400 dark:text-navy-500 group-hover:text-[#CC131A] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                          <p className="text-xs text-navy-600 dark:text-navy-300 mt-0.5 line-clamp-2">
                            {message}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-navy-400 dark:text-navy-400">
                            <span>
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="font-bold text-[#CC131A] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              Consulter →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Statut de connexion au flux */}
            <div className="border-t border-navy-100 dark:border-navy-800 p-2.5 px-3 text-[11px] text-navy-500 dark:text-navy-400 bg-navy-50/30 dark:bg-[#050D18] flex items-center justify-between">
              <span className="flex items-center gap-1.5 truncate">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {isConnected ? 'Flux d’alerte Thiaroye actif' : 'Mise à jour périodique'}
              </span>
              {allNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearNotifications}
                  className="text-[10px] font-bold text-red-600 hover:underline"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        @keyframes pulse-notification {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
          }
        }
        .animate-pulse-notification {
          animation: pulse-notification 2s infinite;
        }
      `}</style>
    </>
  );
}
