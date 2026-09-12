import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../shared/toast/ToastContext';
import { riskInfo } from '../shared/components/RiskBadge';

// Ouvre le WebSocket ws/alertes/ (broadcast-only, groupe "alertes" — voir
// alertes/consumers.py et alertes/signals.py côté backend) et, à chaque
// nouvelle Alerte créée, invalide le cache React Query concerné et affiche
// un toast. Dégradation totalement silencieuse si Channels/Redis n'est pas
// démarré : l'app reste utilisable, juste sans mise à jour instantanée —
// un rechargement de page ou le polling de React Query prennent le relais.
export function useAlertesSocket() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) return undefined;

    let socket;
    try {
      socket = new WebSocket(wsUrl);
    } catch {
      return undefined;
    }

    socket.onmessage = (event) => {
      let alerte;
      try {
        alerte = JSON.parse(event.data);
      } catch {
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['alertes'] });

      showToast({
        niveau: alerte.niveau,
        title: `Nouvelle alerte ${riskInfo(alerte.niveau).label.toLowerCase()} — ${alerte.zone?.quartier ?? ''}`,
        message: alerte.message,
      });
    };

    // Pas de reconnexion automatique : une coupure de Redis/Channels ne doit
    // ni spammer la console ni bloquer le reste de l'app.
    socket.onerror = () => {};

    return () => socket.close();
  }, [isAuthenticated, queryClient, showToast]);
}
