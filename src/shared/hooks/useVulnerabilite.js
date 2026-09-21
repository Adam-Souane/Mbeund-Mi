import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMonProfilVulnerabilite,
  saveMonProfilVulnerabilite,
  getProfilsVulnerabilite,
} from '../../api/endpoints/vulnerabilite';

export function useMonProfilVulnerabilite() {
  return useQuery({
    queryKey: ['mon-profil-vulnerabilite'],
    queryFn: getMonProfilVulnerabilite,
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
