import { useSyncExternalStore } from 'react';

// État de l'unique WebSocket de l'application (ouvert par useAlertesSocket),
// partagé avec les composants qui l'affichent (NotificationCenter).
let connecte = false;
const abonnes = new Set();

export function definirConnexion(valeur) {
  if (valeur === connecte) return;
  connecte = valeur;
  abonnes.forEach((prevenir) => prevenir());
}

function sAbonner(prevenir) {
  abonnes.add(prevenir);
  return () => abonnes.delete(prevenir);
}

export function useConnexionTempsReel() {
  return useSyncExternalStore(sAbonner, () => connecte);
}
