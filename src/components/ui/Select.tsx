import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  error,
  disabled,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={cn(
              'relative w-full px-4 py-2.5 pr-10 text-left rounded-xl border bg-white cursor-pointer',
              'focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200',
              error
                ? 'border-red-300 focus:ring-red-500'
                : 'border-slate-200 focus:ring-primary-500',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className={cn(!selectedOption && 'text-slate-400')}>
              {selectedOption?.label || placeholder}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className="absolute z-10 w-full mt-1 overflow-auto bg-white rounded-xl shadow-lg max-h-60 border border-slate-100 focus:outline-none"
            >
              {options.map((option) => (
                <Listbox.Option
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
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};
