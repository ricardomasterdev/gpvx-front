import React, { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QrCode, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Spinner } from '../ui';
import { whatsappService, whatsappSocket, WhatsAppInstanciaListItem, WhatsAppStatus } from '../../services/whatsapp.service';
import { useAuthStore } from '../../stores/authStore';

// =====================================================
// Tipos
// =====================================================

interface WhatsAppQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  instancia?: WhatsAppInstanciaListItem | null;
}

type ModalStatus = 'loading' | 'awaiting_qr' | 'connecting' | 'connected' | 'error';

// =====================================================
// Componente
// =====================================================

export const WhatsAppQRCodeModal: React.FC<WhatsAppQRCodeModalProps> = ({
  isOpen,
  onClose,
  instancia,
}) => {
  const queryClient = useQueryClient();
  const gabinete = useAuthStore((s) => s.gabinete);

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [modalStatus, setModalStatus] = useState<ModalStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Iniciar conexao e obter QR Code
  const startConnection = useCallback(async () => {
    if (!instancia || !gabinete) return;

    setModalStatus('loading');
    setErrorMessage(null);
    setQrCode(null);

    try {
      // Conectar ao socket para receber eventos em tempo real
      whatsappSocket.connect(instancia.id);

      // Chamar API para iniciar sessao
      const response = await whatsappService.conectar(instancia.id);

      if (response.status === 'connected') {
        setModalStatus('connected');
        toast.success('WhatsApp ja esta conectado!');
      } else {
        setModalStatus('awaiting_qr');
        // QR Code vira via socket ou podemos buscar
        const qrResponse = await whatsappService.obterQRCode(instancia.id).catch(() => null);
        if (qrResponse?.qrCode) {
          setQrCode(qrResponse.qrCode);
        }
      }
    } catch (error: any) {
      console.error('Erro ao conectar:', error);
      setErrorMessage(error.message || 'Erro ao iniciar conexao');
      setModalStatus('error');
    }
  }, [instancia, gabinete]);

  // Configurar listeners do socket
  useEffect(() => {
    if (!isOpen || !instancia) return;

    // Listener para QR Code
    const removeQrListener = whatsappSocket.on('qr', (data) => {
      console.log('QR Code recebido:', data);
      if (data.qrCode || data.qrcode) {
        setQrCode(data.qrCode || data.qrcode);
        setModalStatus('awaiting_qr');
      }
    });

    // Listener para autenticado
    const removeAuthListener = whatsappSocket.on('authenticated', () => {
      console.log('Autenticado!');
      setModalStatus('connecting');
      setQrCode(null);
      toast.success('Codigo escaneado! Conectando...');
    });

    // Listener para pronto (conectado)
    const removeReadyListener = whatsappSocket.on('ready', () => {
      console.log('Pronto!');
      setModalStatus('connected');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instancias'] });
      toast.success('WhatsApp conectado com sucesso!');
    });

    // Listener para desconectado
    const removeDisconnectedListener = whatsappSocket.on('disconnected', (data) => {
      console.log('Desconectado:', data);
      setModalStatus('error');
      setErrorMessage(data?.reason || 'Desconectado');
      setQrCode(null);
    });

    // Listener para falha de autenticacao
    const removeAuthFailureListener = whatsappSocket.on('auth_failure', (data) => {
      console.log('Falha na autenticacao:', data);
      setModalStatus('error');
      setErrorMessage(data?.message || 'Falha na autenticacao');
      setQrCode(null);
      toast.error('Falha na autenticacao');
    });

    // Listener para status
    const removeStatusListener = whatsappSocket.on('status', (data: WhatsAppStatus) => {
      console.log('Status recebido:', data);
      if (data.connected) {
        setModalStatus('connected');
      } else if (data.qrCode) {
        setQrCode(data.qrCode);
        setModalStatus('awaiting_qr');
      }
    });

    // Listener para erros
    const removeErrorListener = whatsappSocket.on('error', (data) => {
      console.error('Erro no socket:', data);
      setErrorMessage(data?.message || 'Erro de conexao');
      setModalStatus('error');
    });

    return () => {
      removeQrListener();
      removeAuthListener();
      removeReadyListener();
      removeDisconnectedListener();
      removeAuthFailureListener();
      removeStatusListener();
      removeErrorListener();
    };
  }, [isOpen, instancia, queryClient]);

  // Iniciar conexao quando modal abre
  useEffect(() => {
    if (isOpen && instancia) {
      // Se ja esta conectado, apenas mostra status
      if (instancia.status === 'conectado') {
        setModalStatus('connected');
        setQrCode(null);
      } else {
        startConnection();
      }
    }

    // Cleanup ao fechar
    return () => {
      if (!isOpen) {
        whatsappSocket.disconnect();
      }
    };
  }, [isOpen, instancia?.id, startConnection]);

  const handleClose = () => {
    whatsappSocket.disconnect();
    setQrCode(null);
    setModalStatus('loading');
    setErrorMessage(null);
    onClose();
  };

  const handleRefresh = () => {
    startConnection();
  };

  const renderContent = () => {
    // Loading
    if (modalStatus === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-slate-500">Iniciando conexao...</p>
        </div>
      );
    }

    // Erro
    if (modalStatus === 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Erro na Conexao</h3>
          <p className="text-slate-500 text-center mb-4">
            {errorMessage || 'Ocorreu um erro ao tentar conectar.'}
          </p>
          <Button
            variant="primary"
            onClick={handleRefresh}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Tentar Novamente
          </Button>
        </div>
      );
    }

    // Conectando (apos escanear QR)
    if (modalStatus === 'connecting') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Conectando...</h3>
          <p className="text-slate-500 text-center">
            Aguarde enquanto estabelecemos a conexao com o WhatsApp.
          </p>
        </div>
      );
    }

    // Conectado
    if (modalStatus === 'connected') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">WhatsApp Conectado!</h3>
          <p className="text-slate-500 text-center">
            Sua instancia esta conectada e pronta para uso.
          </p>
        </div>
      );
    }

    // Aguardando QR Code
    return (
      <div className="flex flex-col items-center py-4">
        {/* QR Code Box */}
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 mb-6">
          <div className="w-64 h-64 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
            {qrCode ? (
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-2" />
                <p className="text-sm">Gerando QR Code...</p>
              </div>
            )}
          </div>
        </div>

        {/* Instrucoes */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Escaneie o QR Code
          </h3>
          <p className="text-slate-500 text-sm max-w-xs">
            Abra o WhatsApp no seu celular, va em <strong>Dispositivos conectados</strong> e escaneie o codigo acima.
          </p>
        </div>

        {/* Status aguardando */}
        <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
          <Spinner size="sm" />
          <span>Aguardando leitura do QR Code...</span>
        </div>

        {/* Botao refresh */}
        <Button
          variant="secondary"
          onClick={handleRefresh}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Gerar novo QR Code
        </Button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Conectar WhatsApp - ${instancia?.nome || ''}`}
      size="md"
    >
      {renderContent()}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
        <Button
          variant="secondary"
          onClick={handleClose}
        >
          Fechar
        </Button>
      </div>
    </Modal>
  );
};
