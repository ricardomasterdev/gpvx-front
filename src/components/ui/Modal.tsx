import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noPadding?: boolean;
  hideCloseButton?: boolean;
  children: React.ReactNode;
}

const sizeStyles = {
  sm: 'max-w-full sm:max-w-md',
  md: 'max-w-full sm:max-w-lg',
  lg: 'max-w-full sm:max-w-2xl',
  xl: 'max-w-full sm:max-w-4xl',
  full: 'max-w-full sm:max-w-6xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  noPadding = false,
  hideCloseButton = false,
  children,
}) => {
  const hasHeader = title || description || !hideCloseButton;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform rounded-xl sm:rounded-2xl bg-white shadow-xl transition-all',
                  'max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto',
                  'mx-1 sm:mx-0',
                  sizeStyles[size]
                )}
              >
                {hasHeader && !noPadding && (
                  <div className="sticky top-0 bg-white z-10 p-4 sm:p-6 border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        {title && (
                          <Dialog.Title className="text-lg font-semibold text-slate-900">
                            {title}
                          </Dialog.Title>
                        )}
                        {description && (
                          <Dialog.Description className="text-sm text-slate-500 mt-1">
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                      {!hideCloseButton && (
                        <button
                          onClick={onClose}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className={cn(noPadding ? '' : 'p-4 sm:p-6')}>
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
