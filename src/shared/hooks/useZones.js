import { useQuery } from '@tanstack/react-query';
import { getZones } from '../../api/endpoints/zones';

// zones/ n'est pas paginé — la FeatureCollection complète tient en une requête.
export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: getZones,
    staleTime: 5 * 60_000,
  });
}
