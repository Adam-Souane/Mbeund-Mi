import { useQuery } from '@tanstack/react-query';
import { getAlertes } from '../../api/endpoints/alertes';

// alertes/ est paginé — on ne demande que la première page pour un aperçu
// "alertes récentes" ; la Phase 5 (Prévisions & Alertes) paginera pour de vrai.
export function useAlertesRecentes(params = {}) {
  return useQuery({
    queryKey: ['alertes', 'recentes', params],
    queryFn: () => getAlertes({ page: 1, ...params }),
    staleTime: 30_000,
  });
}
