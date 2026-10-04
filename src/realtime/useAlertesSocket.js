import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { getAccessToken } from '../auth/tokenStorage';
import { useToast } from '../shared/toast/ToastContext';
import { riskInfo } from '../shared/components/RiskBadge';
import { definirConnexion } from './etatConnexion';

// Unique WebSocket de l'application (ws/alertes/, voir alertes/consumers.py).
// Le serveur envoie { type, data, timestamp } avec type = alerte (tout le
// monde), signalement ou sms (autorités) et prediction. Chaque message
// rafraîchit les données React Query concernées et s'affiche en toast, donc
// aussi dans le centre de notifications.
//
// Le jeton d'accès voyage dans Sec-WebSocket-Protocol : ['mbeund.jwt', jeton].
// Un sous-protocole ne peut pas contenir d'espace (« Bearer <jeton> » fait
// échouer new WebSocket) et le jeton ne doit pas apparaître dans l'URL.
//
// Dégradation silencieuse si Channels/Redis n'est pas démarré : l'app reste
// utilisable, un rechargement ou le polling de React Query prennent le relais.
const SOUS_PROTOCOLE_JWT = 'mbeund.jwt';

const TRAITEMENTS = {
  alerte: (data) => ({
    cles: [['alertes']],
    toast: {
      categorie: 'alerte',
      niveau: data.niveau,
      title: `Nouvelle alerte ${riskInfo(data.niveau).label.toLowerCase()} — ${data.zone?.quartier ?? ''}`,
      message: data.message,
    },
  }),
  signalement: (data) => ({
    cles: [['signalements']],
    toast: { categorie: 'signalement', niveau: 'jaune', title: 'Nouveau signalement citoyen', message: (data.properties ?? data).description },
  }),
  sms: (data) => ({
    cles: [['signalements']],
    toast: { categorie: 'sms', niveau: 'jaune', title: 'SMS citoyen reçu', message: data.contenu_sms },
  }),
  prediction: () => ({ cles: [['predictions']], toast: null }),
};

export function useAlertesSocket() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const wsUrl = import.meta.env.VITE_WS_URL;
    const accessToken = getAccessToken();
    if (!wsUrl || !accessToken) return undefined;

    let socket;
    try {
      socket = new WebSocket(wsUrl, [SOUS_PROTOCOLE_JWT, accessToken]);
    } catch {
      return undefined;
    }

    // La fermeture d'un ancien socket (effet relancé, mode strict de React)
    // arrive après l'ouverture du nouveau : on ignore les sockets remplacés.
    let actif = true;
    socket.onopen = () => {
      if (actif) definirConnexion(true);
    };
    socket.onclose = () => {
      if (actif) definirConnexion(false);
    };

    socket.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      const traiter = TRAITEMENTS[message.type];
      if (!traiter) return;
      const { cles, toast } = traiter(message.data ?? {});
      cles.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      if (toast) showToast(toast);
    };

    // Pas de reconnexion automatique : une coupure de Redis/Channels ne doit
    // ni spammer la console ni bloquer le reste de l'app.
    socket.onerror = () => {};

    return () => {
      actif = false;
      socket.close();
      definirConnexion(false);
    };
  }, [isAuthenticated, queryClient, showToast]);
}
