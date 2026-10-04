import { useCallback, useSyncExternalStore } from 'react';

// Détection de breakpoint côté JS — nécessaire pour choisir quel shell
// monter (mobile vs desktop) sans jamais instancier les deux en même temps
// (ce qui dupliquerait les hooks de données et les effets de chaque page).
export function useMediaQuery(query) {
  const sAbonner = useCallback(
    (prevenir) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', prevenir);
      return () => mql.removeEventListener('change', prevenir);
    },
    [query]
  );
  return useSyncExternalStore(sAbonner, () => window.matchMedia(query).matches, () => false);
}
