import { useQuery } from '@tanstack/react-query';
import { getInondations } from '../../api/endpoints/inondations';

// inondations/ n'est pas paginé — historique borné des épisodes constatés.
export function useInondations() {
  return useQuery({
    queryKey: ['inondations'],
    queryFn: getInondations,
    staleTime: 5 * 60_000,
  });
}
