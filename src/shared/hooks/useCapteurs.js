import { useQuery } from '@tanstack/react-query';
import { getCapteurs } from '../../api/endpoints/capteurs';

// capteurs/ n'est pas paginé (IsAutoriteOrAdmin — lecture ouverte à tout
// utilisateur authentifié, citoyen inclus, mais utile surtout côté autorité).
export function useCapteurs() {
  return useQuery({
    queryKey: ['capteurs'],
    queryFn: getCapteurs,
    staleTime: 60_000,
  });
}
