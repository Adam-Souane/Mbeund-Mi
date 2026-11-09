import { useQuery } from '@tanstack/react-query';
import { getInondations } from '../../api/endpoints/inondations';

// inondations/ en lecture publique pour la cartographie des zones inondées
export function useInondations() {
  return useQuery({
    queryKey: ['inondations'],
    queryFn: getInondations,
    retry: false,
    staleTime: 5 * 60_000,
  });
}
