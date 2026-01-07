import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// =====================================================
// Tipos
// =====================================================

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showInfo?: boolean;
  className?: string;
}

// =====================================================
// Componente Pagination
// =====================================================

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showInfo = true,
  className,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    if (totalPages <= 1) return [1];

    range.push(1);

    if (left > 2) {
      range.push('...');
    }

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (right < totalPages - 1) {
      range.push('...');
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={cn(
      'flex flex-col items-center gap-4 px-4 py-3 bg-white border-t border-slate-200',
      className
    )}>
      {/* Navegacao - centralizada */}
      <div className="flex items-center gap-1">
        {/* Primeira pagina */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            'p-2 rounded-lg transition-colors',
            currentPage === 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
          title="Primeira pagina"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Pagina anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'p-2 rounded-lg transition-colors',
            currentPage === 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
          title="Pagina anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Numeros das paginas */}
        <div className="flex items-center gap-1 mx-2">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-slate-400">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={cn(
                    'min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors',
                    page === currentPage
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Proxima pagina */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={cn(
            'p-2 rounded-lg transition-colors',
            currentPage === totalPages || totalPages === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
          title="Proxima pagina"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Ultima pagina */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={cn(
            'p-2 rounded-lg transition-colors',
            currentPage === totalPages || totalPages === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
          title="Ultima pagina"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Info e seletor de tamanho */}
      <div className="flex items-center gap-4">
        {showInfo && (
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-medium">{startItem}</span> a{' '}
            <span className="font-medium">{endItem}</span> de{' '}
            <span className="font-medium">{totalItems}</span> registros
          </p>
        )}

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Exibir:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
