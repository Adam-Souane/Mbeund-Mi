import { useMutation } from '@tanstack/react-query';
import { getItineraireSecurise } from '../../api/endpoints/itineraire';

export function useItineraireSecurise() {
  return useMutation({
    mutationFn: getItineraireSecurise,
  });
}
