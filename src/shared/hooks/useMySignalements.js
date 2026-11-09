import { useQuery } from '@tanstack/react-query';
import { getMesSignalements } from '../../api/endpoints/mesSignalements';
import { getAccessToken } from '../../auth/tokenStorage';

export function useMySignalements() {
  const hasToken = typeof window !== 'undefined' && !!getAccessToken();
  return useQuery({
    queryKey: ['mes-signalements'],
    queryFn: () => getMesSignalements({ page: 1 }),
    enabled: hasToken,
    retry: 1,
  });
}
