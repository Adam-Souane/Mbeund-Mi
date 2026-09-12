import { useQuery } from '@tanstack/react-query';
import { getPrevisions } from '../../api/endpoints/previsions';

export function usePrevisions() {
  return useQuery({
    queryKey: ['previsions'],
    queryFn: () => getPrevisions({ page: 1 }),
    staleTime: 5 * 60_000,
  });
}
