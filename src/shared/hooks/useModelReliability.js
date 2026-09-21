import { useState, useEffect } from 'react';
import client from '../../api/client';

export function useModelReliability() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
  }, []);

  return { data, loading, error };
}
