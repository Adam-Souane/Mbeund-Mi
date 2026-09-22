import { useQuery } from '@tanstack/react-query';
import { getMesSignalements } from '../../api/endpoints/mesSignalements';

export function useMySignalements() {
  return useQuery({
    queryKey: ['mes-signalements'],
    queryFn: () => getMesSignalements({ page: 1 }),
    retry: 1,
  });
}
