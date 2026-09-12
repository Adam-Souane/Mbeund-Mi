import { useQuery } from '@tanstack/react-query';
import { getMesuresRecentes } from '../../api/endpoints/mesures';

export function useMesuresRecentes() {
  return useQuery({
    queryKey: ['mesures', 'recentes'],
    queryFn: getMesuresRecentes,
    staleTime: 60_000,
  });
}
