import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, updateCurrentUser } from '../../api/endpoints/user';
import { getAccessToken } from '../../auth/tokenStorage';

export function useCurrentUser() {
  const hasToken = typeof window !== 'undefined' && !!getAccessToken();
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    enabled: hasToken,
    staleTime: 60_000,
  });
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['currentUser'], updatedData);
    },
  });
}

