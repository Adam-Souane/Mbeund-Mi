import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMonRelais,
  createRelais,
  deleteRelais,
  getRelaisQuartier,
  verifierRelais,
} from '../../api/endpoints/relais';

export function useMonRelais() {
  return useQuery({
    queryKey: ['mon-relais'],
    queryFn: getMonRelais,
    staleTime: 30_000,
  });
}

export function useCreateRelais() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRelais,
    onSuccess: (data) => {
      queryClient.setQueryData(['mon-relais'], data);
    },
  });
}

export function useDeleteRelais() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRelais,
    onSuccess: () => {
      queryClient.setQueryData(['mon-relais'], null);
    },
  });
}

// Réservé autorité/admin.
export function useRelaisQuartierListe(page = 1) {
  return useQuery({
    queryKey: ['relais-quartier', page],
    queryFn: () => getRelaisQuartier({ page }),
    staleTime: 30_000,
  });
}

export function useVerifierRelais() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verifie }) => verifierRelais(id, verifie),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relais-quartier'] });
    },
  });
}
