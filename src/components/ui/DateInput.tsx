import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// Formata data ISO (yyyy-mm-dd) para BR (dd/mm/yyyy) sem conversao de timezone
function formatDateBR(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value = '', onChange, label, error, disabled, className }, ref) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    const displayValue = formatDateBR(value);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {/* Icone de calendario */}
          <Calendar
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10"
          />

          {/* Texto formatado sobreposto */}
          <div
            className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none z-10"
          >
            <span className={displayValue ? 'text-slate-900' : 'text-slate-400'}>
              {displayValue || 'dd/mm/aaaa'}
            </span>
          </div>

          {/* Input date nativo - visivel mas com texto transparente */}
          <input
            ref={ref}
            type="date"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white cursor-pointer',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'transition-all duration-200',
              error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-primary-500',
              disabled && 'bg-slate-50 cursor-not-allowed',
              className
            )}
            style={{ color: 'transparent' }}
          />
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
