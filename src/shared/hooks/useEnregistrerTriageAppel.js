import { useMutation } from '@tanstack/react-query';
import { enregistrerTriageAppel } from '../../api/endpoints/triageAppel';

export function useEnregistrerTriageAppel() {
  return useMutation({
    mutationFn: enregistrerTriageAppel,
  });
}
