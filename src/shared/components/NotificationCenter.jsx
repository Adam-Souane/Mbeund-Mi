import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Bell, AlertTriangle, MessageSquare, Smartphone, CheckCircle, AlertCircle, ChevronRight, Users } from 'lucide-react';
import { useConnexionTempsReel } from '../../realtime/etatConnexion';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../../auth/AuthContext';

function useSafeAuth() {
  try {
    return useAuth();
  } catch {
    return { role: null, service: null, username: null };
  }
}

const ROLE_SERVICE_NOTIFICATIONS = {
  cod: [
    {
      id: 'cod-1',
      type: 'alerte',
      url: '/autorite/previsions',
      data: {
        titre: 'Alerte IA C.O.D · Seuil 25 cm (Thiaroye Gare)',
        message: 'Hausse rapide prévue par le modèle IA (fiabilité 90%). Supervision globale des 3 corps requise.',
      },
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
    {
      id: 'cod-2',
      type: 'signalement',
      url: '/autorite/signalements',
      data: {
        titre: 'Nouveaux signalements citoyens à certifier',
        message: 'Observations géolocalisées en attente de validation et d’affectation (BNSP / ONAS / Mairie).',
      },
      timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    },
    {
      id: 'cod-3',
      type: 'toast',
      url: '/autorite/authorities',
      data: {
        titre: 'Suivi Équipes · 3 unités opérationnelles prêtes',
        message: 'BNSP Pompiers, ONAS Hydraulique et Cellule Municipale sont connectés au poste de commandement.',
      },
      timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    },
  ],
  bnsp: [
    {
      id: 'bnsp-1',
      type: 'alerte',
      url: '/autorite/signalements',
      data: {
        titre: 'Urgence BNSP · Sauvetage & Évacuation (Thiaroye Gare)',
        message: 'Niveau d’eau critique (> 50 cm) signalé par les riverains. Intervention VSR prioritaire.',
      },
      timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    },
    {
      id: 'bnsp-2',
      type: 'signalement',
      url: '/autorite/registre',
      data: {
        titre: 'Foyers vulnérables prioritaires · Zone Rouge',
        message: 'Personnes à mobilité réduite recensées dans le secteur Cuvette Basse à sécuriser.',
      },
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
  ],
  onas: [
    {
      id: 'onas-1',
      type: 'alerte',
      url: '/autorite/signalements',
      data: {
        titre: 'Urgence ONAS · Collecteur pluvial obstrué (Ndakhane)',
        message: 'Refoulement signalé sur le canal principal. Déploiement camion hydrocureur requis.',
      },
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'onas-2',
      type: 'prediction',
      url: '/autorite/carte',
      data: {
        titre: 'Sonde Piézométrique TH-01 · Pompage P1 requis',
        message: 'Saturation du bassin tampon détectée. Activation de la motopompe grand débit recommandée.',
      },
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
  ],
  mairie: [
    {
      id: 'mairie-1',
      type: 'alerte',
      url: '/autorite/crise',
      data: {
        titre: 'Cellule Municipale · Ouverture École Refuge',
        message: 'Préparation logistique des abris temporaires et diffusion des consignes aux délégués de quartier.',
      },
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'mairie-2',
      type: 'communaute',
      url: '/autorite/registre',
      data: {
        titre: 'Relais de Quartier · Appui logistique demandé',
        message: 'Demande de sacs de sable et passerelles piétonnes provisoires à Thiaroye Plage.',
      },
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
  ],
};

const FEED_LABELS = {
  cod: 'Flux C.O.D Global · Admin Général',
  bnsp: 'Flux Opérationnel · BNSP Pompiers',
  onas: 'Flux Opérationnel · ONAS Hydraulique',
  mairie: 'Flux Opérationnel · Cellule Municipale',
};

const NOTIFICATION_COLORS = {
  alerte: { bg: 'bg-red-50 dark:bg-red/15', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle, color: 'text-[#CC131A] dark:text-red-400' },
  signalement: { bg: 'bg-navy-50 dark:bg-navy-900', border: 'border-navy-200 dark:border-navy-800', icon: MessageSquare, color: 'text-[#0B2545] dark:text-blue-400' },
  communaute: { bg: 'bg-navy-50 dark:bg-navy-900', border: 'border-navy-200 dark:border-navy-800', icon: Users, color: 'text-[#0B2545] dark:text-blue-300' },
  sms: { bg: 'bg-navy-50 dark:bg-navy-900', border: 'border-navy-200 dark:border-navy-800', icon: Smartphone, color: 'text-[#0B2545] dark:text-blue-300' },
  prediction: { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
  toast: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400' },
  error: { bg: 'bg-red-50 dark:bg-red/15', border: 'border-red-200 dark:border-red-800', icon: AlertCircle, color: 'text-[#CC131A] dark:text-red-400' },
};

/**
 * Centre de notifications temps réel.
 * Affiche les notifications WebSocket + Communauté + Toast et permet de naviguer directement vers l'élément signalé.
 */
export default function NotificationCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, service, username } = useSafeAuth();
  const isAutorite =
    location.pathname.startsWith('/autorite') || role === 'admin' || role === 'autorite';

  const activeFeedKey = useMemo(() => {
    if (!isAutorite) return null;
    if (role === 'admin') return 'cod';
    if (service && ROLE_SERVICE_NOTIFICATIONS[service]) return service;
    return 'bnsp';
  }, [isAutorite, role, service]);

  const userScopePrefix = isAutorite ? `${username || activeFeedKey || 'autorite'}:` : '';

  const isConnected = useConnexionTempsReel();
  const {
    notifications,
    unreadCount: contextUnreadCount,
    markAsRead,
    isRead,
    clearNotifications,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const allNotifications = useMemo(() => {
    if (!isAutorite || !activeFeedKey) return notifications;
    const roleSpecific = ROLE_SERVICE_NOTIFICATIONS[activeFeedKey] || [];
    // Ajouter aussi les notifications dynamiques temps réel (hors les 3 notifications citoyennes par défaut)
    const liveExtras = notifications.filter((n) => ![1, 2, 3].includes(n.id));
    return [...roleSpecific, ...liveExtras];
  }, [isAutorite, activeFeedKey, notifications]);

  const isNotifRead = (id) => {
    if (typeof isRead !== 'function') return false;
    if (!isAutorite) return isRead(id);
    return isRead(`${userScopePrefix}${id}`) || isRead(id);
  };

  const unreadCount = useMemo(() => {
    if (!isAutorite) return contextUnreadCount;
    return allNotifications.filter((n) => !isNotifRead(n.id)).length;
  }, [isAutorite, contextUnreadCount, allNotifications, isRead, userScopePrefix]);

  // Déterminer la page de destination selon le sujet de la notification
  const getNotificationTargetUrl = (notif) => {
    if (notif.url) return notif.url;
    if (notif.link) return notif.link;
    if (notif.targetUrl) return notif.targetUrl;
    if (notif.data?.url) return notif.data.url;

    const type = (notif.type || '').toLowerCase();
    const message = (notif.data?.message || notif.message || '').toLowerCase();
    const titre = (notif.data?.titre || notif.data?.title || notif.title || '').toLowerCase();

    // 1. Communauté & Posts riverains
    if (type === 'communaute' || notif.data?.postId || titre.includes('communauté') || titre.includes('post') || message.includes('post')) {
      return notif.data?.url || (notif.data?.postId ? `/citoyen/communaute?postId=${notif.data.postId}` : '/citoyen/communaute');
    }

    // 2. Alertes & Risques
    if (type === 'alerte' || type === 'prediction' || titre.includes('alerte') || message.includes('évacuation') || message.includes('risque')) {
      return isAutorite ? '/autorite/crise' : '/citoyen/alertes';
    }

    // 3. Signalements & Confirmations de voisins
    if (type === 'signalement' || titre.includes('signalement') || titre.includes('+1 vu')) {
      if (message.includes('confirmé') || titre.includes('+1 vu') || message.includes('riverain')) {
        return isAutorite ? '/autorite/signalements' : '/citoyen/communaute';
      }
      return isAutorite ? '/autorite/signalements' : '/citoyen/signaler';
    }

    // 4. Carte & Zones
    if (type === 'carte' || titre.includes('carte') || titre.includes('zone') || notif.data?.zone_id) {
      return isAutorite ? '/autorite/carte' : '/citoyen/carte';
    }

    // 5. Météo & Prévisions
    if (type === 'prevision' || titre.includes('météo') || message.includes('pluie')) {
      return isAutorite ? '/autorite/previsions' : '/citoyen/alertes';
    }

    // 6. IoT & Capteurs (espace autorité)
    if (type === 'capteur' || message.includes('capteur') || message.includes('mesure')) {
      return isAutorite ? '/autorite/capteurs' : '/citoyen/carte';
    }

    return isAutorite ? '/autorite/dashboard' : '/citoyen/accueil';
  };

  const handleNotificationClick = (notif) => {
    // 1. Marquer cette notification spécifique comme lue -> le compteur diminue immédiatement de 1 (-1)
    if (typeof markAsRead === 'function') {
      markAsRead(isAutorite ? `${userScopePrefix}${notif.id}` : notif.id);
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
    // Ouvre ou ferme le panneau sans marquer automatiquement toutes les notifications comme lues
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = () => {
    // Marquer l'ensemble des notifications visibles comme lues -> le compteur devient 0 et disparaît
    if (typeof markAsRead === 'function') {
      allNotifications.forEach((n) => {
        markAsRead(isAutorite ? `${userScopePrefix}${n.id}` : n.id);
      });
    }
  };

  const getNotificationIcon = (type) => {
    const config = NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.alerte;
    const Icon = config.icon;
    return <Icon size={18} className={config.color} />;
  };

  return (
    <>
      {/* Badge de notification (header) avec nombre affiché à côté de la cloche */}
      <div className="relative">
        <button
          type="button"
          onClick={handleOpenPanel}
          className="relative inline-flex items-center gap-1.5 px-2 py-1.5 text-navy-700 dark:text-navy-200 hover:text-navy-950 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800 rounded-xl transition-colors cursor-pointer flex-shrink-0"
          title={isConnected ? 'Centre de notifications (connecté 24/7)' : 'Centre de notifications'}
          aria-label={unreadCount > 0 ? `Centre de notifications (${unreadCount} non lue${unreadCount > 1 ? 's' : ''})` : 'Centre de notifications'}
        >
          <div className="relative flex items-center justify-center">
            <Bell size={18} />

            {/* Indicateur de connexion temps réel */}
            <span
              className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border-2 border-white dark:border-[#071322] ${
                isConnected ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
              title={isConnected ? 'Connecté au flux d’alerte temps réel' : 'Mode standard'}
            />
          </div>

          {/* Nombre de notifications non lues affiché clairement à côté de la cloche */}
          {unreadCount > 0 && (
            <span
              data-testid="notification-unread-count"
              className="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[18px] text-[10px] font-black leading-none text-white bg-red-600 rounded-full animate-pulse-notification shadow-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Panneau déroulant des notifications (centré sur mobile, ancré sous la cloche sur desktop) */}
        {isOpen && (
          <>
            {/* Arrière-plan semi-transparent pour fermer au clic en dehors sur mobile */}
            <div
              className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-xs sm:hidden"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <div className="fixed left-1/2 -translate-x-1/2 top-16 sm:top-full sm:absolute sm:right-0 sm:left-auto sm:translate-x-0 sm:mt-2 w-[calc(100vw-24px)] max-w-sm sm:max-w-none sm:w-96 max-h-[calc(100vh-80px)] sm:max-h-none bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl shadow-2xl z-[2001] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-3.5 border-b border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-[#050D18]">
              <div>
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
                {activeFeedKey && FEED_LABELS[activeFeedKey] && (
                  <p className="text-[10px] font-bold text-navy-500 dark:text-navy-400 mt-0.5">
                    {FEED_LABELS[activeFeedKey]}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white cursor-pointer"
                  >
                    Tout lire
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-100 dark:hover:bg-navy-800 cursor-pointer"
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
                  const notifIsUnread = !isNotifRead(notif.id);

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 transition-all cursor-pointer group ${
                        notifIsUnread
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
                              {notifIsUnread && (
                                <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0 animate-pulse" />
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
        </>
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
