import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Save, QrCode, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input, Textarea, Spinner } from '../ui';
import { whatsappService, WhatsAppInstanciaCreate, WhatsAppInstanciaListItem, WhatsAppInstanciaResponse, StatusWhatsApp } from '../../services/whatsapp.service';

// =====================================================
// Tipos
// =====================================================

interface WhatsAppFormData {
  nome: string;
  telefone: string;
  autoRead: boolean;
  autoResponse: boolean;
  mensagemBoasVindas: string;
}

interface WhatsAppFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  instancia?: WhatsAppInstanciaListItem | null;
}

type ModalStep = 'form' | 'qrcode' | 'connected';

// =====================================================
// Componente
// =====================================================

export const WhatsAppFormModal: React.FC<WhatsAppFormModalProps> = ({
  isOpen,
  onClose,
  instancia,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!instancia;

  // Estados
  const [step, setStep] = useState<ModalStep>('form');
  const [createdInstancia, setCreatedInstancia] = useState<WhatsAppInstanciaResponse | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusWhatsApp>('desconectado');
  const [isPolling, setIsPolling] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WhatsAppFormData>({
    defaultValues: {
      nome: '',
      telefone: '',
      autoRead: true,
      autoResponse: false,
      mensagemBoasVindas: '',
    },
  });

  const autoResponse = watch('autoResponse');

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (instancia) {
        // Modo edicao - apenas form
        whatsappService.obter(instancia.id).then((data) => {
          reset({
            nome: data.nome,
            telefone: data.telefone || '',
            autoRead: data.autoRead,
            autoResponse: data.autoResponse,
            mensagemBoasVindas: data.mensagemBoasVindas || '',
          });
        });
        setStep('form');
      } else {
        // Novo cadastro
        reset({
          nome: '',
          telefone: '',
          autoRead: true,
          autoResponse: false,
          mensagemBoasVindas: '',
        });
        setStep('form');
      }
      setCreatedInstancia(null);
      setQrCode(null);
      setStatus('desconectado');
      setIsPolling(false);
    }
  }, [instancia, reset, isOpen]);

  // Polling para verificar status da conexao
  useEffect(() => {
    if (!isPolling || !createdInstancia) return;

    const interval = setInterval(async () => {
      try {
        const data = await whatsappService.obter(createdInstancia.id);
        setStatus(data.status);

        if (data.status === 'conectado') {
          setIsPolling(false);
          setStep('connected');
          queryClient.invalidateQueries({ queryKey: ['whatsapp-instancias'] });
          toast.success('WhatsApp conectado com sucesso!');
        } else if (data.qrcode && data.qrcode !== qrCode) {
          setQrCode(data.qrcode);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPolling, createdInstancia, qrCode, queryClient]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: WhatsAppInstanciaCreate) => whatsappService.criar(data),
    onSuccess: async (response) => {
      setCreatedInstancia(response);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instancias'] });
      toast.success('Instancia criada! Gerando QR Code...');

      // Iniciar conexao automaticamente
      try {
        const connectResponse = await whatsappService.conectar(response.id);
        if (connectResponse.qrcode) {
          setQrCode(connectResponse.qrcode);
          setStatus('aguardando_qrcode');
          setStep('qrcode');
          setIsPolling(true);
        }
      } catch (error: any) {
        toast.error('Erro ao gerar QR Code');
        handleClose();
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar instancia';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: WhatsAppInstanciaCreate) =>
      whatsappService.atualizar(instancia!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instancias'] });
      toast.success('Instancia atualizada com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar instancia';
      toast.error(message);
    },
  });

  // Mutation para reconectar
  const connectMutation = useMutation({
    mutationFn: (id: string) => whatsappService.conectar(id),
    onSuccess: (response) => {
      if (response.qrcode) {
        setQrCode(response.qrcode);
        setStatus('aguardando_qrcode');
        setIsPolling(true);
      }
    },
    onError: () => {
      toast.error('Erro ao gerar QR Code');
    },
  });

  const handleClose = () => {
    setIsPolling(false);
    reset();
    setStep('form');
    setCreatedInstancia(null);
    setQrCode(null);
    setStatus('desconectado');
    onClose();
  };

  const onSubmit = (data: WhatsAppFormData) => {
    const payload: WhatsAppInstanciaCreate = {
      nome: data.nome,
      telefone: data.telefone || undefined,
      autoRead: data.autoRead,
      autoResponse: data.autoResponse,
      mensagemBoasVindas: data.mensagemBoasVindas || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleRefreshQrCode = () => {
    if (createdInstancia) {
      connectMutation.mutate(createdInstancia.id);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // =====================================================
  // Renderizacao do Form
  // =====================================================
  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Nome da Instancia */}
      <div>
        <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
          <MessageSquare className="w-4 h-4" />
          <span>Nome da Instancia</span>
        </div>
        <Input
          placeholder="Ex: WhatsApp Principal"
          {...register('nome', {
            required: 'Campo obrigatorio',
            maxLength: { value: 100, message: 'Maximo 100 caracteres' },
          })}
          error={errors.nome?.message}
        />
      </div>

      {/* Telefone - apenas no modo edicao */}
      {isEditing && (
        <div>
          <Input
            label="Telefone"
            placeholder="Ex: +55 11 99999-9999"
            {...register('telefone')}
          />
          <p className="mt-1 text-xs text-slate-500">
            Preenchido automaticamente apos conectar o WhatsApp
          </p>
        </div>
      )}

      {/* Configuracoes */}
      <div className="space-y-4">
        <h3 className="font-medium text-slate-700">Configuracoes</h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={watch('autoRead')}
            onChange={(e) => setValue('autoRead', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-green-500 focus:ring-green-500"
          />
          <span className="text-sm text-slate-700">Marcar mensagens como lidas automaticamente</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoResponse}
            onChange={(e) => setValue('autoResponse', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-green-500 focus:ring-green-500"
          />
          <span className="text-sm text-slate-700">Resposta automatica de boas-vindas</span>
        </label>

        {autoResponse && (
          <Textarea
            label="Mensagem de boas-vindas"
            placeholder="Ex: Ola! Obrigado por entrar em contato. Em breve retornaremos..."
            rows={3}
            {...register('mensagemBoasVindas')}
          />
        )}
      </div>

      {/* Botoes */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          leftIcon={isEditing ? <Save className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          {isEditing ? 'Salvar' : 'Criar e Conectar'}
        </Button>
      </div>
    </form>
  );

  // =====================================================
  // Renderizacao do QR Code
  // =====================================================
  const renderQRCode = () => (
    <div className="flex flex-col items-center py-4">
      {/* QR Code */}
      <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 mb-6">
        <div className="w-64 h-64 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
          {connectMutation.isPending ? (
            <div className="flex flex-col items-center">
              <Spinner size="lg" />
              <p className="mt-2 text-sm text-slate-500">Gerando QR Code...</p>
            </div>
          ) : qrCode ? (
            qrCode.startsWith('data:image') ? (
              <img src={qrCode} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                <QrCode className="w-16 h-16 mb-2" />
                <p className="text-xs text-center font-mono break-all">{qrCode}</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <QrCode className="w-16 h-16" />
              <p className="mt-2 text-sm">QR Code indisponivel</p>
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

      {/* Status de polling */}
      {isPolling && (
        <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
          <Spinner size="sm" />
          <span>Aguardando conexao...</span>
        </div>
      )}

      {/* Botoes */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={handleRefreshQrCode}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          disabled={connectMutation.isPending}
        >
          Novo QR Code
        </Button>
        <Button
          variant="secondary"
          onClick={handleClose}
        >
          Fechar
        </Button>
      </div>
    </div>
  );

  // =====================================================
  // Renderizacao de Conectado
  // =====================================================
  const renderConnected = () => (
    <div className="flex flex-col items-center py-8">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">WhatsApp Conectado!</h3>
      <p className="text-slate-500 text-center mb-6">
        A instancia <strong>{createdInstancia?.nome}</strong> esta conectada e pronta para uso.
      </p>
      <Button
        onClick={handleClose}
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
      >
        Concluir
      </Button>
    </div>
  );

  // =====================================================
  // Titulo dinamico
  // =====================================================
  const getTitle = () => {
    if (isEditing) return 'Editar Instancia';
    switch (step) {
      case 'form':
        return 'Nova Instancia de WhatsApp';
      case 'qrcode':
        return `Conectar WhatsApp - ${createdInstancia?.nome || ''}`;
      case 'connected':
        return 'Conexao Estabelecida';
      default:
        return 'WhatsApp';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      size="md"
    >
      {step === 'form' && renderForm()}
      {step === 'qrcode' && renderQRCode()}
      {step === 'connected' && renderConnected()}
    </Modal>
  );
};
