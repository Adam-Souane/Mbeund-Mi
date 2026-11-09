import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { getMonSurvivalKit, saveMonSurvivalKit } from '../../api/endpoints/survivalKit';

export function useSurvivalKit() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['mon-survival-kit'],
    queryFn: getMonSurvivalKit,
    enabled: !!isAuthenticated,
    retry: false,
  });
}

export function useSaveSurvivalKit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMonSurvivalKit,
    onSuccess: (data) => {
      queryClient.setQueryData(['mon-survival-kit'], data);
    },
  });
}
