import { memo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function PaginationComponent({ currentPage, totalPages, onPageChange, isLoading }) {
  const handlePrevious = useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  }, [currentPage, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1 || isLoading}
        className="p-2 text-navy dark:text-white border border-navy-200 dark:border-navy-700 rounded-md hover:bg-navy-50 dark:hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        aria-label="Page précédente"
      >
        <ChevronLeft size={16} />
      </button>

      {startPage > 1 && (
        <>
          <button onClick={() => onPageChange(1)} disabled={isLoading} className="px-3 py-1 text-sm font-medium text-navy dark:text-white hover:bg-navy-50 dark:hover:bg-navy-800 rounded-md disabled:opacity-50">
            1
          </button>
          {startPage > 2 && <span className="text-navy-400">...</span>}
        </>
      )}

      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={isLoading}
          className={`px-3 py-1 text-sm font-medium rounded-md transition disabled:opacity-50 ${
            page === currentPage
              ? 'bg-red text-white'
              : 'text-navy dark:text-white border border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-800'
          }`}
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-navy-400">...</span>}
          <button onClick={() => onPageChange(totalPages)} disabled={isLoading} className="px-3 py-1 text-sm font-medium text-navy dark:text-white hover:bg-navy-50 dark:hover:bg-navy-800 rounded-md disabled:opacity-50">
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages || isLoading}
        className="p-2 text-navy dark:text-white border border-navy-200 dark:border-navy-700 rounded-md hover:bg-navy-50 dark:hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        aria-label="Page suivante"
      >
        <ChevronRight size={16} />
      </button>

      <span className="ml-4 text-sm text-navy-600 dark:text-navy-400">
        Page {currentPage} sur {totalPages}
      </span>
    </div>
  );
}

export const Pagination = memo(PaginationComponent);
