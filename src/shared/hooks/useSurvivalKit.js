import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMonSurvivalKit, saveMonSurvivalKit } from '../../api/endpoints/survivalKit';

export function useSurvivalKit() {
  return useQuery({
    queryKey: ['mon-survival-kit'],
    queryFn: getMonSurvivalKit,
    retry: 1,
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
