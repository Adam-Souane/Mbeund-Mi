import { useEffect } from 'react';
import { useAlertesRecentes } from './useAlertes';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Hook automatique qui synchronise les alertes officielles actives
 * et les pousse directement dans le centre de notifications (la cloche du header).
 */
export function useSyncAlertesToNotifications() {
  const { data: alertesData } = useAlertesRecentes();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const alertes = alertesData?.results ?? [];
    if (!alertes.length) return;

    alertes.forEach((a) => {
      addNotification({
        dedupId: `alerte-officielle-${a.id}`,
        type: 'alerte',
        data: {
          titre: `Alerte ${a.niveau ? a.niveau.toUpperCase() : 'OFFICIELLE'} · ${a.zone?.quartier || 'Thiaroye'}`,
          message: a.message,
          niveau: a.niveau,
        },
        timestamp: a.date_creation || a.created_at || new Date().toISOString(),
      });
    });
  }, [alertesData, addNotification]);
}
