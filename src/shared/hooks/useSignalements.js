import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSignalements, validerSignalement } from '../../api/endpoints/signalements';

// Utilisé ici seulement pour un aperçu/compteur sur les tableaux de bord —
// la page de modération (useSignalements ci-dessous) pagine pour de vrai.
export function useSignalementsApercu() {
  return useQuery({
    queryKey: ['signalements', 'apercu'],
    queryFn: () => getSignalements({ page: 1 }),
    staleTime: 30_000,
  });
}

// Page de modération complète (Signalements terrain) — une page à la fois.
export function useSignalements(page = 1) {
  return useQuery({
    queryKey: ['signalements', 'liste', page],
    queryFn: () => getSignalements({ page }),
    staleTime: 15_000,
  });
}

export function useValiderSignalement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, valide }) => validerSignalement(id, valide),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalements'] });
    },
  });
}
