import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { getInondations } from '../../api/endpoints/inondations';

// inondations/ n'est pas paginé — historique borné des épisodes constatés.
export function useInondations() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['inondations'],
    queryFn: getInondations,
    enabled: !!isAuthenticated,
    retry: false,
    staleTime: 5 * 60_000,
  });
}
