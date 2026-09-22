import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Composant pour afficher les messages de statut avec accessibilité.
 * Utilise aria-live et role="status" pour annoncer aux lecteurs d'écran.
 */
export default function A11yStatusMessage({ type = 'error', message, messages = [], visible = true }) {
  if (!visible || (!message && messages.length === 0)) return null;

  const iconMap = {
    error: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
  };

  const colorMap = {
    error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    success: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  };

  const Icon = iconMap[type];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`flex items-start gap-3 p-4 rounded-lg border ${colorMap[type]}`}
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        {message ? (
          <p className="text-sm">{message}</p>
        ) : (
          <ul className="text-sm space-y-1">
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
