import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineSignalements } from '../../shared/utils/offlineSignalementsQueue';

export default function NetworkSyncBadge({ className = '' }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const { pendingCount, isSyncing } = useOfflineSignalements();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-2xs ${className}`}
        title="Mode hors-ligne PWA actif : vos signalements seront automatiquement transmis dès le retour de la connexion."
      >
        <WifiOff size={12} className="animate-pulse" />
        <span className="hidden sm:inline">Hors-ligne (PWA)</span>
        <span className="sm:hidden">Hors-ligne</span>
      </span>
    );
  }

  if (pendingCount > 0 || isSyncing) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-blue-500/15 border border-blue-500/40 text-blue-700 dark:text-blue-300 shadow-2xs ${className}`}
        title="Synchronisation automatique des signalements en attente..."
      >
        <RefreshCw size={11} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span>Sync {pendingCount > 0 ? `(${pendingCount})` : ''}</span>
      </span>
    );
  }

  return (
    <span
      className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 shadow-2xs ${className}`}
      title="Connecté en direct au réseau et serveurs Mbeund-Mi"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span>En direct</span>
    </span>
  );
}
