import { ChevronLeft, ChevronRight } from 'lucide-react';

const BOUTON = 'flex items-center gap-1 text-sm font-bold text-navy-600 dark:text-navy-200 disabled:opacity-40';

// Pagination d'une liste paginée par l'API (DRF : champs `next` et `previous`).
// Rien n'est affiché quand tout tient sur une page.
export default function Pagination({ page, data, setPage }) {
  if (!data?.next && !data?.previous) return null;
  return (
    <div className="flex items-center justify-center gap-3">
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data?.previous} className={BOUTON}>
        <ChevronLeft size={14} />
        Précédent
      </button>
      <span className="text-sm text-navy-400">Page {page}</span>
      <button onClick={() => setPage((p) => p + 1)} disabled={!data?.next} className={BOUTON}>
        Suivant
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
