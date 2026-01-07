import React from 'react';
import { AlertTriangle, Trash2, X, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

const VARIANT_CONFIG: Record<ConfirmVariant, {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  buttonVariant: 'primary' | 'danger' | 'secondary';
}> = {
  danger: {
    icon: <Trash2 className="w-6 h-6" />,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonVariant: 'danger',
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6" />,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonVariant: 'primary',
  },
  info: {
    icon: <HelpCircle className="w-6 h-6" />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonVariant: 'primary',
  },
  success: {
    icon: <CheckCircle className="w-6 h-6" />,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    buttonVariant: 'primary',
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {
  const config = VARIANT_CONFIG[variant];

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center">
        {/* Icone */}
        <div className={`mx-auto w-16 h-16 rounded-full ${config.iconBg} ${config.iconColor} flex items-center justify-center mb-5`}>
          {config.icon}
        </div>

        {/* Titulo */}
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {title}
        </h3>

        {/* Mensagem */}
        <p className="text-slate-500 mb-8">
          {message}
        </p>

        {/* Botoes */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            isLoading={isLoading}
            className="min-w-[120px]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
