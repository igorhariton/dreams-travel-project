import React, { useMemo } from 'react';
import { useI18n } from '../context/AppContext';

type PaginationTone = 'blue' | 'emerald';

type PaginationControlsProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  tone?: PaginationTone;
  className?: string;
};

const activeToneClass: Record<PaginationTone, string> = {
  blue: 'border-blue-600 bg-blue-600 text-white',
  emerald: 'border-emerald-600 bg-emerald-600 text-white',
};

export function PaginationControls({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  tone = 'blue',
  className = '',
}: PaginationControlsProps) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, Math.min(safeCurrentPage - 3, totalPages - 6));
    return Array.from({ length: 7 }, (_, index) => start + index);
  }, [safeCurrentPage, totalPages]);

  if (totalItems <= pageSize) return null;

  const fromItem = Math.min((safeCurrentPage - 1) * pageSize + 1, totalItems);
  const toItem = Math.min(safeCurrentPage * pageSize, totalItems);
  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === safeCurrentPage) return;
    onPageChange(nextPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-sm text-gray-500">
        {fromItem}-{toItem} / {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('common.prev')}
        </button>

        {visiblePages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => goToPage(page)}
            className={`rounded-xl border px-3 py-1.5 text-sm transition ${
              page === safeCurrentPage
                ? activeToneClass[tone]
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
          className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}
