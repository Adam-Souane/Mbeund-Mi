import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCapteurs, updateCapteur } from '../../api/endpoints/capteurs';

// capteurs/ n'est pas paginé (IsAutoriteOrAdmin — lecture ouverte à tout
// utilisateur authentifié, citoyen inclus, mais utile surtout côté autorité).
export function useCapteurs() {
  return useQuery({
    queryKey: ['capteurs'],
    queryFn: getCapteurs,
    staleTime: 60_000,
  });
}

export function useUpdateCapteur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateCapteur(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capteurs'] });
    },
  });
}
