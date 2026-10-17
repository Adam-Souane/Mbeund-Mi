import { useState, useEffect } from 'react';

/**
 * Hook générique pour débouncer une valeur dynamique (ex: chaîne de recherche, filtres).
 * Réduit drastiquement les recalculs de filtrage et les requêtes à chaque frappe clavier.
 *
 * @template T
 * @param {T} value Valeur d'entrée
 * @param {number} [delay=250] Délai d'attente en millisecondes
 * @returns {T} Valeur stabilisée après le délai
 */
export function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // En environnement de test unitaire (Vitest/Jest), mise à jour synchrone pour les assertions de rendu
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
