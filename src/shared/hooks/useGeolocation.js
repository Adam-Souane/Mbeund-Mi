import { useState } from 'react';

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  const locate = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError("Ce navigateur ne permet pas la géolocalisation.");
      return;
    }
    setStatus('loading');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatus('success');
      },
      () => {
        setStatus('error');
        setError("Position refusée ou indisponible — activez la géolocalisation puis réessayez.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  return { position, status, error, locate };
}
