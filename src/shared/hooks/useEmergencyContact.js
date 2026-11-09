import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { getMonEmergencyContact, saveMonEmergencyContact } from '../../api/endpoints/emergencyContact';

export function useEmergencyContact() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['mon-emergency-contact'],
    queryFn: getMonEmergencyContact,
    enabled: !!isAuthenticated,
    retry: false,
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
