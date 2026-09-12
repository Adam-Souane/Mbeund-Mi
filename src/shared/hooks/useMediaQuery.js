import { useEffect, useState } from 'react';

// Détection de breakpoint côté JS — nécessaire pour choisir quel shell
// monter (mobile vs desktop) sans jamais instancier les deux en même temps
// (ce qui dupliquerait les hooks de données et les effets de chaque page).
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
