import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { Popover, Transition } from '@headlessui/react';

// =====================================================
// Tipos
// =====================================================

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'boolean';
  options?: FilterOption[];
}

export interface SearchFilterProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  filters?: FilterConfig[];
  activeFilters?: Record<string, any>;
  onFilterChange?: (filters: Record<string, any>) => void;
  className?: string;
}

// =====================================================
// Hook de debounce
// =====================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// =====================================================
// Componente SearchFilter
// =====================================================

export const SearchFilter: React.FC<SearchFilterProps> = ({
  placeholder = 'Buscar...',
  value = '',
  onChange,
  onSearch,
  debounceMs = 300,
  filters,
  activeFilters = {},
  onFilterChange,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const debouncedValue = useDebounce(internalValue, debounceMs);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (onSearch && debouncedValue !== value) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    onSearch?.('');
  };

  const handleFilterChange = (key: string, filterValue: any) => {
    if (onFilterChange) {
      const newFilters = { ...activeFilters };
      if (filterValue === '' || filterValue === undefined) {
        delete newFilters[key];
      } else {
        newFilters[key] = filterValue;
      }
      onFilterChange(newFilters);
    }
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Campo de busca */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm placeholder:text-slate-400 transition-all"
        />
        {internalValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtros */}
      {filters && filters.length > 0 && (
        <Popover className="relative">
          {({ open }) => (
            <>
              <Popover.Button
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all',
                  open || activeFilterCount > 0
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                )}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
              </Popover.Button>

              <Transition
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Popover.Panel className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 p-4 z-50">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">Filtros</h3>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => onFilterChange?.({})}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Limpar todos
                        </button>
                      )}
                    </div>

                    {filters.map((filter) => (
                      <div key={filter.key}>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          {filter.label}
                        </label>
                        {filter.type === 'select' && filter.options && (
                          <select
                            value={activeFilters[filter.key] ?? ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm"
                          >
                            <option value="">Todos</option>
                            {filter.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {filter.type === 'boolean' && (
                          <select
                            value={activeFilters[filter.key] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleFilterChange(filter.key, val === '' ? undefined : val === 'true');
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm"
                          >
                            <option value="">Todos</option>
                            <option value="true">Sim</option>
                            <option value="false">Não</option>
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      )}
    </div>
  );
};
