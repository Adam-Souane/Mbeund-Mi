import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

// Canaux par lesquels le serveur peut envoyer un code en ce moment. Tant
// qu'aucun fournisseur SMS n'est actif, seul l'email est proposé. Pendant le
// chargement (ou si la requête échoue malgré les nouvelles tentatives), les
// deux canaux restent affichés : le serveur refuse de toute façon un canal
// indisponible avec un message clair.
export default function useCanauxOtp() {
  const { data } = useQuery({
    queryKey: ['otp-canaux'],
    queryFn: () => client.get('/users/otp-canaux/').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: 2, // le serveur peut mettre du temps à se réveiller (démarrage à froid)
  });
  return { smsDisponible: data?.telephone ?? true };
}
