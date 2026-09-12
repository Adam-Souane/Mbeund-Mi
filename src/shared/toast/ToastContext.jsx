import { createContext, useCallback, useContext, useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { riskInfo } from '../components/RiskBadge';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast) => {
      const id = nextId++;
      setToasts((list) => [...list, { id, ...toast }]);
      setTimeout(() => dismiss(id), 7000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[2000] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => {
          const { hex } = riskInfo(t.niveau);
          return (
            <div
              key={t.id}
              className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg shadow-lg p-4 flex items-start gap-3 animate-[fadeIn_0.2s_ease-out]"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{ backgroundColor: hex ?? '#1B2A40' }}
              >
                <ShieldAlert size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy dark:text-navy-50">{t.title}</p>
                {t.message && <p className="text-xs text-navy-600 dark:text-navy-200 mt-0.5">{t.message}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="text-navy-400 hover:text-navy dark:hover:text-navy-50 flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé à l’intérieur de <ToastProvider>.');
  return ctx;
}
