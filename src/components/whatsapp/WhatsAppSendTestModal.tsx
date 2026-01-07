import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Phone, MessageSquare, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input, Textarea } from '../ui';
import { whatsappService, WhatsAppInstanciaListItem } from '../../services/whatsapp.service';

// =====================================================
// Tipos
// =====================================================

interface WhatsAppSendTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  instancia?: WhatsAppInstanciaListItem | null;
}

interface SendResult {
  telefone: string;
  success: boolean;
  timestamp: string;
  error?: string;
}

// =====================================================
// Componente
// =====================================================

export const WhatsAppSendTestModal: React.FC<WhatsAppSendTestModalProps> = ({
  isOpen,
  onClose,
  instancia,
}) => {
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState('Ola! Esta e uma mensagem de teste do GPVx.');
  const [lastSentResults, setLastSentResults] = useState<SendResult[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  // Mutation para enviar mensagem
  const sendMutation = useMutation({
    mutationFn: () => {
      if (!instancia) throw new Error('Instancia nao selecionada');
      setLastError(null); // Limpar erro anterior
      return whatsappService.enviarMensagem(instancia.id, { telefone, mensagem });
    },
    onSuccess: () => {
      // Adicionar resultado de sucesso
      setLastSentResults(prev => [{
        telefone: telefone,
        success: true,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      }, ...prev.slice(0, 4)]); // Manter apenas os ultimos 5

      setLastError(null);
      toast.success('Mensagem enviada com sucesso!');
      // Limpar apenas o telefone, manter a mensagem
      setTelefone('');
    },
    onError: (error: any) => {
      const message = error.message || error.response?.data?.detail || error.response?.data?.error || 'Erro ao enviar mensagem';

      // Adicionar resultado de erro
      setLastSentResults(prev => [{
        telefone: telefone,
        success: false,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        error: message,
      }, ...prev.slice(0, 4)]);

      setLastError(message);
      toast.error(message);
    },
  });

  const handleClose = () => {
    setTelefone('');
    setMensagem('Ola! Esta e uma mensagem de teste do GPVx.');
    setLastSentResults([]);
    setLastError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefone.trim()) {
      toast.error('Informe o numero de telefone');
      return;
    }
    if (!mensagem.trim()) {
      toast.error('Informe a mensagem');
      return;
    }
    sendMutation.mutate();
  };

  // Formatar telefone enquanto digita
  const formatPhone = (value: string) => {
    // Remove tudo que nao e numero
    const numbers = value.replace(/\D/g, '');

    // Aplica mascara
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Testar Envio - ${instancia?.nome || ''}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Telefone */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
            <Phone className="w-4 h-4" />
            <span>Numero do WhatsApp</span>
          </div>
          <Input
            placeholder="(11) 99999-9999"
            value={telefone}
            onChange={handlePhoneChange}
            maxLength={16}
          />
          <p className="mt-1 text-xs text-slate-500">
            Digite o numero com DDD (sem o +55)
          </p>
        </div>

        {/* Mensagem */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
            <MessageSquare className="w-4 h-4" />
            <span>Mensagem</span>
          </div>
          <Textarea
            placeholder="Digite a mensagem de teste..."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={4}
          />
        </div>

        {/* Erro atual */}
        {lastError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <span className="font-medium text-red-800">Erro ao enviar mensagem</span>
                <p className="text-sm text-red-700 mt-1">{lastError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Historico de envios */}
        {lastSentResults.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-slate-600" />
              <span className="font-medium text-slate-800">Historico de Envios</span>
            </div>
            <ul className="space-y-2">
              {lastSentResults.map((result, index) => (
                <li
                  key={index}
                  className={`text-sm flex items-start gap-2 p-2 rounded-lg ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                        {result.telefone}
                      </span>
                      <span className="text-slate-400 text-xs">({result.timestamp})</span>
                    </div>
                    {result.error && (
                      <p className="text-red-600 text-xs mt-1 truncate" title={result.error}>
                        {result.error}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Aviso */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Atenção:</strong> Esta é uma funcionalidade de teste.
            A mensagem será enviada para o número informado através da instância "{instancia?.nome}".
          </p>
        </div>

        {/* Botoes */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={sendMutation.isPending}
          >
            Fechar
          </Button>
          <Button
            type="submit"
            isLoading={sendMutation.isPending}
            leftIcon={<Send className="w-4 h-4" />}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            Enviar Mensagem
          </Button>
        </div>
      </form>
    </Modal>
  );
};
