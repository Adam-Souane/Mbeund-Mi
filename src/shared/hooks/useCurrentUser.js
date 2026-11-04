import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, updateCurrentUser } from '../../api/endpoints/user';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
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

