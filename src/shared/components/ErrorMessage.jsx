import { AlertCircle, Info } from 'lucide-react';

/**
 * Messages d'erreur UX-friendly avec explication et suggestions
 */
export default function ErrorMessage({
  error,
  title = "Une erreur s'est produite",
  suggestion,
  type = 'error'
}) {
  if (!error) return null;

  const typeConfig = {
    error: {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: AlertCircle,
    },
    warning: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: Info,
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  // Parse error message (backend sends detailed messages)
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Une erreur inattendue s\'est produite';

  // Friendly error messages
  const friendlyMessages = {
    'Citoyen non trouvé': 'Cet ID de citoyen n\'existe pas. Vérifiez et réessayez.',
    'Identifiant ou mot de passe incorrect': 'Les identifiants saisis sont incorrects. Vérifiez votre connexion.',
    'Permission refusée': 'Vous n\'avez pas les permissions pour effectuer cette action.',
    'Erreur réseau': 'Problème de connexion. Vérifiez votre internet et réessayez.',
    'Délai d\'attente dépassé': 'La requête a pris trop longtemps. Réessayez.',
  };

  // Find friendly message or use original
  const displayMessage = Object.entries(friendlyMessages).find(
    ([key]) => errorMessage.toLowerCase().includes(key.toLowerCase())
  )?.[1] || errorMessage;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}
    >
      <Icon size={20} className={`${config.color} flex-shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-sm ${config.color} mb-0.5`}>
          {title}
        </h3>
        <p className={`text-sm ${config.color} opacity-90`}>
          {displayMessage}
        </p>
        {suggestion && (
          <p className={`text-xs ${config.color} opacity-75 mt-2 italic`}>
            💡 {suggestion}
          </p>
        )}
      </div>
    </div>
  );
}
