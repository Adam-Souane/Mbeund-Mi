import { useState, useEffect } from 'react';
import client from '../../api/client';

// `enabled` évite l'appel à l'API tant que l'utilisateur n'est pas administrateur.
export function useModelReliability({ enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    const fetchReliability = async () => {
      try {
        setLoading(true);
        const response = await client.get('/predictions/fiabilite/');
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.erreur || 'Erreur lors du chargement des métriques');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReliability();
  }, [enabled]);

  return { data, loading, error };
}
