import { useQuery } from '@tanstack/react-query';
import { getRefuges } from '../../api/endpoints/refuges';

export function useRefuges() {
  return useQuery({
    queryKey: ['refuges'],
    queryFn: getRefuges,
    staleTime: 30 * 60_000, // 30 minutes (refuges change rarely)
  });
}
