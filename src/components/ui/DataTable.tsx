import React from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// =====================================================
// Tipos
// =====================================================

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  actions?: (item: T) => React.ReactNode;
  stickyHeader?: boolean;
}

// =====================================================
// Componente DataTable
// =====================================================

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado',
  emptyDescription,
  emptyIcon,
  sortBy,
  sortDir,
  onSort,
  onRowClick,
  rowClassName,
  actions,
  stickyHeader = false,
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    if (sortBy === column.key) {
      return sortDir === 'asc' ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      );
    }

    return <ChevronsUpDown className="w-4 h-4 opacity-40" />;
  };

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        description={emptyDescription}
        icon={emptyIcon}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full">
        <thead>
          <tr className={cn(
            'bg-slate-50 border-b border-slate-200',
            stickyHeader && 'sticky top-0 z-10'
          )}>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider',
                  alignClass[column.align || 'left'],
                  column.sortable && 'cursor-pointer hover:bg-slate-100 select-none transition-colors'
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className={cn(
                  'flex items-center gap-1',
                  column.align === 'center' && 'justify-center',
                  column.align === 'right' && 'justify-end'
                )}>
                  {column.header}
                  {renderSortIcon(column)}
                </div>
              </th>
            ))}
            {actions && (
              <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right w-32">
                Acoes
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                'hover:bg-slate-50 transition-colors',
                onRowClick && 'cursor-pointer',
                rowClassName?.(item)
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-sm text-slate-700',
                    alignClass[column.align || 'left']
                  )}
                >
                  {column.render
                    ? column.render(item, index)
                    : (item as any)[column.key]}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {actions(item)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
