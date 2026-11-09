import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import {
  getMonProfilVulnerabilite,
  saveMonProfilVulnerabilite,
  getProfilsVulnerabilite,
} from '../../api/endpoints/vulnerabilite';

export function useMonProfilVulnerabilite() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['mon-profil-vulnerabilite'],
    queryFn: getMonProfilVulnerabilite,
    enabled: !!isAuthenticated,
    retry: false,
    staleTime: 30_000,
  });
}

export function useSaveMonProfilVulnerabilite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMonProfilVulnerabilite,
    onSuccess: (data) => {
      queryClient.setQueryData(['mon-profil-vulnerabilite'], data);
    },
  });
}

// Réservé autorité/admin.
export function useProfilsVulnerabilite({ page = 1, zone } = {}) {
  return useQuery({
    queryKey: ['profils-vulnerabilite', page, zone],
    queryFn: () => getProfilsVulnerabilite({ page, zone }),
    staleTime: 30_000,
  });
}
