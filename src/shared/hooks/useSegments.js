import { useQuery } from '@tanstack/react-query';
import { getSegments } from '../../api/endpoints/segments';

// segments/ n'est pas paginé — utilisé pour la couche SIG "rues & drainage".
export function useSegments() {
  return useQuery({
    queryKey: ['segments'],
    queryFn: getSegments,
    staleTime: 5 * 60_000,
  });
}
