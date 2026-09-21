import { useState, useEffect } from 'react';
import client from '../../api/client';

export function useBacktesting() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBacktesting = async () => {
      try {
        setLoading(true);
        const response = await client.get('/inondations/backtesting/');
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.erreur || 'Erreur lors du chargement du backtesting');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBacktesting();
  }, []);

  return { data, loading, error };
}
