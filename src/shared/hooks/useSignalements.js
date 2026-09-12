import { useQuery } from '@tanstack/react-query';
import { getSignalements } from '../../api/endpoints/signalements';

// Utilisé ici seulement pour un aperçu/compteur sur les tableaux de bord —
// la vraie page de modération (Phase 5) paginera et filtrera pour de vrai.
export function useSignalementsApercu() {
  return useQuery({
    queryKey: ['signalements', 'apercu'],
    queryFn: () => getSignalements({ page: 1 }),
    staleTime: 30_000,
  });
}
