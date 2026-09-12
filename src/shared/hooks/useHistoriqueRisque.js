import { useQuery } from '@tanstack/react-query';
import { getHistoriqueRisque } from '../../api/endpoints/historiqueRisque';

export function useHistoriqueRisque(page = 1) {
  return useQuery({
    queryKey: ['historique-risque', page],
    queryFn: () => getHistoriqueRisque({ page }),
    staleTime: 60_000,
  });
}
