import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMonEmergencyContact, saveMonEmergencyContact } from '../../api/endpoints/emergencyContact';

export function useEmergencyContact() {
  return useQuery({
    queryKey: ['mon-emergency-contact'],
    queryFn: getMonEmergencyContact,
    retry: 1,
  });
}

export function useSaveEmergencyContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMonEmergencyContact,
    onSuccess: (data) => {
      queryClient.setQueryData(['mon-emergency-contact'], data);
    },
  });
}
