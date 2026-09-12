import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlertes, createAlerte, updateAlerteStatut } from '../../api/endpoints/alertes';

// alertes/ est paginé — on ne demande que la première page pour un aperçu
// "alertes récentes" sur les tableaux de bord et la page Prévisions.
export function useAlertesRecentes(params = {}) {
  return useQuery({
    queryKey: ['alertes', 'recentes', params],
    queryFn: () => getAlertes({ page: 1, ...params }),
    staleTime: 30_000,
  });
}

// Page de gestion de crise — une page à la fois.
export function useAlertesListe(page = 1) {
  return useQuery({
    queryKey: ['alertes', 'liste', page],
    queryFn: () => getAlertes({ page }),
    staleTime: 15_000,
  });
}

export function useCreateAlerte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAlerte,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertes'] });
    },
  });
}

export function useUpdateAlerteStatut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }) => updateAlerteStatut(id, statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertes'] });
    },
  });
}
