import React, { Fragment, useState, useMemo, useRef } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  error,
  disabled,
  loading,
  className,
}) => {
  const [query, setQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(lowerQuery)
    );
  }, [options, query]);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <Combobox value={value} onChange={(val) => onChange(val || '')} disabled={disabled}>
        {({ open }) => (
          <div className="relative">
            <div className="relative">
              <Combobox.Input
                className={cn(
                  'w-full px-4 py-2.5 pr-10 rounded-xl border bg-white cursor-pointer',
                  'focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200',
                  error
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-primary-500',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                displayValue={() => selectedOption?.label || ''}
                onChange={(e) => setQuery(e.target.value)}
                onClick={() => buttonRef.current?.click()}
                placeholder={placeholder}
                autoComplete="off"
              />
              <Combobox.Button
                ref={buttonRef}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <ChevronDown className={cn(
                  'w-5 h-5 text-slate-400 transition-transform',
                  open && 'rotate-180'
                )} />
              </Combobox.Button>
            </div>
            <Transition
              as={Fragment}
              show={open}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setQuery('')}
            >
              <Combobox.Options
                static
                className="absolute z-50 w-full mt-1 overflow-auto bg-white rounded-xl shadow-lg max-h-60 border border-slate-100 focus:outline-none"
              >
                {loading ? (
                  <div className="py-3 px-4 text-slate-500 text-center">
                    Carregando...
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <div className="py-3 px-4 text-slate-500 text-center">
                    {query ? 'Nenhum resultado encontrado' : 'Nenhuma opcao disponivel'}
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <Combobox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active }) =>
                        cn(
                          'relative cursor-pointer select-none py-3 px-4',
                          active ? 'bg-primary-50 text-primary-600' : 'text-slate-700'
                        )
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={cn('block truncate', selected && 'font-medium')}>
                            {option.label}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                              <Check className="w-5 h-5" />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        )}
      </Combobox>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};
