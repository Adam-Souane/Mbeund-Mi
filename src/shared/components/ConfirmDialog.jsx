import { AlertTriangle, X } from 'lucide-react';

/**
 * Composant de confirmation pour actions destructrices
 * Accessible avec ARIA et keyboard navigation
 */
export default function ConfirmDialog({
  isOpen,
  title = "Confirmer l'action",
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false
}) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        className="bg-white dark:bg-navy-900 rounded-lg p-6 max-w-sm w-full shadow-xl border border-navy-100 dark:border-navy-700"
      >
        <div className="flex items-start gap-3 mb-4">
          {isDangerous && (
            <AlertTriangle
              size={24}
              className="text-orange-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
          <h2
            id="dialog-title"
            className="text-lg font-bold text-navy-900 dark:text-white"
          >
            {title}
          </h2>
        </div>

        <p
          id="dialog-message"
          className="text-sm text-navy-600 dark:text-navy-200 mb-6"
        >
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-md border border-navy-200 dark:border-navy-700 text-navy-900 dark:text-white font-semibold text-sm hover:bg-navy-50 dark:hover:bg-navy-800 transition disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
            className={`px-4 py-2.5 rounded-md font-semibold text-sm text-white transition disabled:opacity-60 ${
              isDangerous
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-red hover:bg-red-700'
            }`}
          >
            {isLoading ? 'Veuillez patienter...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
