import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContactsAlerte, deleteContactAlerte } from '../../api/endpoints/contactsAlerte';

export function useContactsAlerte(page = 1) {
  return useQuery({
    queryKey: ['contacts-alerte', page],
    queryFn: () => getContactsAlerte({ page }),
    staleTime: 30_000,
  });
}

export function useDeleteContactAlerte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContactAlerte,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts-alerte'] });
    },
  });
}
