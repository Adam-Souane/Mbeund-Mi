import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { getCapteurs, updateCapteur } from '../../api/endpoints/capteurs';

// capteurs/ en lecture publique pour permettre la consultation citoyenne et cartographique
export function useCapteurs() {
  return useQuery({
    queryKey: ['capteurs'],
    queryFn: getCapteurs,
    retry: false,
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
