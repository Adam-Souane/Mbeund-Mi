import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Composant de champ de formulaire avec validation inline
 * Affiche feedback en temps réel
 */
export default function FormField({
  id,
  label,
  description,
  value,
  error,
  isValid = null,
  type = 'text',
  placeholder,
  onChange,
  onBlur,
  required = false,
  validator = null,
  ...props
}) {
  // Validation inline en temps réel
  const hasError = error || (validator && value && !validator(value));
  const showValid = isValid === true || (validator && value && validator(value));

  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="block text-sm font-semibold text-navy-900 dark:text-white" id={`${id}-label`}>
          {label}
          {required && <span className="text-red ml-1" aria-label="requis">*</span>}
        </span>
        {showValid && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 size={14} aria-hidden="true" />
            Valide
          </span>
        )}
      </div>

      {description && (
        <span
          className="block text-xs text-navy-500 dark:text-navy-400 mb-1.5"
          id={`${id}-desc`}
        >
          {description}
        </span>
      )}

      {type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-labelledby={`${id}-label`}
          aria-describedby={description ? `${id}-desc` : undefined}
          aria-invalid={hasError}
          className={`w-full px-3.5 py-2.5 rounded-md border-[1.5px] transition ${
            hasError
              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
              : showValid
              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
              : 'border-navy-200 dark:border-navy-800 bg-white dark:bg-navy'
          } text-sm focus:ring-2 focus:ring-inset ${
            hasError ? 'focus:ring-red' : 'focus:ring-green-600'
          } focus:border-transparent`}
          {...props}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-labelledby={`${id}-label`}
          aria-describedby={description ? `${id}-desc` : undefined}
          aria-invalid={hasError}
          className={`w-full px-3.5 py-2.5 rounded-md border-[1.5px] transition ${
            hasError
              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
              : showValid
              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
              : 'border-navy-200 dark:border-navy-800 bg-white dark:bg-navy'
          } text-sm focus:ring-2 focus:ring-inset ${
            hasError ? 'focus:ring-red' : 'focus:ring-green-600'
          } focus:border-transparent`}
          {...props}
        />
      )}

      {hasError && (
        <div className="flex items-start gap-2 mt-1.5">
          <AlertCircle
            size={16}
            className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </span>
        </div>
      )}
    </label>
  );
}
