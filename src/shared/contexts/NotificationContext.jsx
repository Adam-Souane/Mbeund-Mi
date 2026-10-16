import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const NotificationContext = createContext(null);

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    dedupId: 'alerte-officielle-1',
    type: 'alerte',
    data: {
      titre: 'Vigilance Inondation · Cuvette Ndakhane',
      message: 'Risque de stagnation d’eau suite aux pluies. Les équipes municipales surveillent le niveau des caniveaux.',
      niveau: 'orange',
    },
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    dedupId: 'intervention-relais-2',
    type: 'signalement',
    data: {
      titre: 'Pompage actif · Thiaroye Plage',
      message: 'Déploiement des motopompes au secteur débarcadère. Ruelle sécurisée pour les piétons.',
      niveau: 'vert',
    },
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    dedupId: 'communaute-info-3',
    type: 'toast',
    data: {
      titre: 'Veille communautaire active',
      message: 'Participez à la protection du quartier en confirmant les signalements de vos voisins avec le bouton +1.',
      niveau: 'bleu',
    },
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

export function NotificationProvider({ children }) {
  // Initialisation avec le localStorage ou les notifications par défaut
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const nextIdRef = useRef(100);

  // Sauvegarde automatique dans le localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mbeund_mi_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => {
      // Déduplication si dedupId est fourni
      if (notification.dedupId && prev.some((n) => n.dedupId === notification.dedupId)) {
        return prev;
      }

      const id = nextIdRef.current++;
      const fullNotification = {
        id,
        timestamp: new Date().toISOString(),
        ...notification,
      };

      return [fullNotification, ...prev].slice(0, 50);
    });
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.setItem('mbeund_mi_notifications', JSON.stringify([]));
    } catch {}
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, clearNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
