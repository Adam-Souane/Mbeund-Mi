import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Hook pour recevoir les notifications push temps réel via WebSocket.
 * Gère la connexion WebSocket et expose les notifications reçues.
 *
 * Usage:
 * const { isConnected, notifications, lastNotification } = useWebSocketNotifications();
 */
export function useWebSocketNotifications() {
  const { token } = useAuth();
  const { addNotification } = useNotifications();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastNotification, setLastNotification] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/alertes/?token=${token}`;

    const ws = new WebSocket(wsUrl);

    // Connexion établie
    ws.onopen = () => {
      console.log('[WebSocket] Connecté aux notifications');
      setIsConnected(true);
      setError(null);

      // Envoyer un heartbeat tous les 30 secondes
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      ws.onclose = () => clearInterval(heartbeat);
    };

    // Message reçu
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        // Ignorer les pongs
        if (payload.type === 'pong') return;

        // Ajouter à la liste des notifications
        const notification = {
          id: Math.random(),
          timestamp: new Date(),
          ...payload,
        };

        setNotifications((prev) => [notification, ...prev].slice(0, 100)); // Garder les 100 dernières
        setLastNotification(notification);

        // Ajouter aussi au système global de notifications
        addNotification(notification);

        // Afficher un toast/son si souhaité
        if (payload.type === 'alerte') {
          console.warn('[WebSocket] Alerte reçue:', payload.data);
          // Peut déclencher une notification navigateur ici
          showBrowserNotification(payload.data.niveau, `Alerte ${payload.data.zone?.quartier || ''}`);
        } else if (payload.type === 'signalement') {
          console.log('[WebSocket] Signalement reçu:', payload.data);
        } else if (payload.type === 'sms') {
          console.log('[WebSocket] SMS reçu:', payload.data);
        }
      } catch (err) {
        console.error('[WebSocket] Erreur parsing message:', err);
      }
    };

    // Erreur
    ws.onerror = (err) => {
      console.error('[WebSocket] Erreur:', err);
      setError('Erreur connexion WebSocket');
      setIsConnected(false);
    };

    // Déconnexion
    ws.onclose = () => {
      console.log('[WebSocket] Déconnecté');
      setIsConnected(false);
    };

    // Cleanup
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [token, addNotification]);

  return {
    isConnected,
    notifications,
    lastNotification,
    error,
  };
}

/**
 * Affiche une notification navigateur (Web Notifications API).
 */
function showBrowserNotification(niveau, titre) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(titre, {
      icon: '/logo.png',
      badge: `/badge-${niveau}.png`,
      tag: 'alert',
      requireInteraction: niveau === 'rouge',
    });
  } else if (Notification.permission !== 'denied') {
    // Demander la permission
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(titre);
      }
    });
  }
}
