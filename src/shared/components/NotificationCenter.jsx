import { useState } from 'react';
import { X, Bell, AlertTriangle, MessageSquare, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
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
 * Affiche les notifications WebSocket + Toast (alertes, signalements, SMS, messages d'application).
 */
export default function NotificationCenter() {
  const isConnected = useConnexionTempsReel();
  const { notifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  // Numéro de la dernière notification vue (les numéros sont croissants) :
  // le compteur se déduit de la liste, sans effet ni état à synchroniser.
  const [derniereVue, setDerniereVue] = useState(0);

  // Les notifications incluent à la fois les WebSocket et les Toast (déjà fusionnées dans le contexte)
  const allNotifications = notifications;
  const unreadCount = allNotifications.filter((n) => n.id > derniereVue).length;

  const handleOpenPanel = () => {
    if (!isOpen) setDerniereVue(allNotifications[0]?.id ?? derniereVue);
    setIsOpen(!isOpen);
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
          className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
          title={isConnected ? 'Notifications (connecté)' : 'Notifications (déconnecté)'}
        >
          <Bell size={20} />

          {/* Badge de compteur */}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse-notification">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {/* Indicateur de connexion */}
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-gray-900 ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}
            title={isConnected ? 'Connecté' : 'Déconnecté'}
          />
        </button>

        {/* Panneau des notifications */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-navy border border-gray-200 dark:border-navy-700 rounded-lg shadow-xl z-[2001]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-navy-700">
              <h3 className="font-bold text-gray-900 dark:text-gray-50">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={18} />
              </button>
            </div>

            {/* Liste des notifications */}
            <div className="max-h-96 overflow-y-auto">
              {allNotifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Aucune notification
                </p>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-navy-700">
                  {allNotifications.slice(0, 10).map((notif) => {
                    return (
                      <div key={notif.id} className="p-3 hover:bg-gray-50 dark:hover:bg-navy-800 cursor-pointer">
                        <div className="flex gap-2">
                          <div className="flex-shrink-0 pt-0.5">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-50">
                              {notif.data?.titre || notif.type}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {notif.data?.message || notif.data?.description}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Statut de connexion */}
            <div className="border-t border-gray-200 dark:border-navy-700 p-2 text-xs text-gray-500 dark:text-gray-400">
              {isConnected ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Connecté aux notifications temps réel
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  Temps réel indisponible (les données se mettent à jour au rechargement)
                </span>
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
