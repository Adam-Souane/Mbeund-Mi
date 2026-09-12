import { useQuery } from '@tanstack/react-query';
import { getPredictions } from '../../api/endpoints/predictions';

// predictions/ renvoie déjà la dernière PredictionIA par zone — pas de
// pagination, pas de filtre à faire côté client.
export function usePredictions() {
  return useQuery({
    queryKey: ['predictions'],
    queryFn: getPredictions,
    staleTime: 2 * 60_000,
  });
}
