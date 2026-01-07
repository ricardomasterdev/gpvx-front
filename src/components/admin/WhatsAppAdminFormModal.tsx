import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Save, QrCode, RefreshCw, CheckCircle, Building2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input, Textarea, Spinner, Select } from '../ui';
import {
  adminService,
  WhatsAppSessionItem,
  WhatsAppSessionCreate,
  WhatsAppSessionUpdate,
  GabineteSubgabineteItem,
} from '../../services/admin.service';

// =====================================================
// Tipos
// =====================================================

interface WhatsAppFormData {
  gabineteId: string;
  nome: string;
  telefone: string;
  autoRead: boolean;
  autoResponse: boolean;
  mensagemBoasVindas: string;
}

interface WhatsAppAdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: WhatsAppSessionItem | null;
}

type ModalStep = 'form' | 'qrcode' | 'connected';

// =====================================================
// Componente
// =====================================================

export const WhatsAppAdminFormModal: React.FC<WhatsAppAdminFormModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!session;

  // Estados
  const [step, setStep] = useState<ModalStep>('form');
  const [createdSession, setCreatedSession] = useState<WhatsAppSessionItem | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('desconectado');
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
      gabineteId: '',
      nome: '',
      telefone: '',
      autoRead: true,
      autoResponse: false,
      mensagemBoasVindas: '',
    },
  });

  const autoResponse = watch('autoResponse');
  const selectedGabineteId = watch('gabineteId');

  // Query para buscar gabinetes e subgabinetes
  const { data: gabinetes = [], isLoading: loadingGabinetes } = useQuery({
    queryKey: ['admin-gabinetes-subgabinetes'],
    queryFn: () => adminService.listarGabinetesSubgabinetes(),
    enabled: isOpen,
  });

  // Organizar gabinetes em grupos
  const gabinetesOrganizados = useMemo(() => {
    const principais = gabinetes.filter(g => !g.gabinetePrincipalId);
    const subgabinetes = gabinetes.filter(g => g.gabinetePrincipalId);

    const resultado: { label: string; value: string; isSubgabinete: boolean; parentName?: string }[] = [];

    principais.forEach(gab => {
      resultado.push({
        label: gab.nome,
        value: gab.id,
        isSubgabinete: false,
      });

      // Adicionar subgabinetes deste gabinete
      subgabinetes
        .filter(sub => sub.gabinetePrincipalId === gab.id)
        .forEach(sub => {
          resultado.push({
            label: `↳ ${sub.nome}`,
            value: sub.id,
            isSubgabinete: true,
            parentName: gab.nome,
          });
        });
    });

    return resultado;
  }, [gabinetes]);

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (session) {
        // Modo edicao - carregar dados da sessao
        adminService.obterSessaoWhatsApp(session.id).then((data) => {
          reset({
            gabineteId: data.gabineteId,
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
          gabineteId: '',
          nome: '',
          telefone: '',
          autoRead: true,
          autoResponse: false,
          mensagemBoasVindas: '',
        });
        setStep('form');
      }
      setCreatedSession(null);
      setQrCode(null);
      setStatus('desconectado');
      setIsPolling(false);
    }
  }, [session, reset, isOpen]);

  // Polling para verificar status da conexao
  useEffect(() => {
    if (!isPolling || !createdSession) return;

    const interval = setInterval(async () => {
      try {
        const data = await adminService.obterSessaoWhatsApp(createdSession.id);
        setStatus(data.status);

        if (data.status === 'conectado') {
          setIsPolling(false);
          setStep('connected');
          queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessions'] });
          toast.success('WhatsApp conectado com sucesso!');
        } else if (data.qrcode && data.qrcode !== qrCode) {
          setQrCode(data.qrcode);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPolling, createdSession, qrCode, queryClient]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: WhatsAppSessionCreate) => adminService.criarSessaoWhatsApp(data),
    onSuccess: async (response) => {
      setCreatedSession(response);
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessions'] });
      toast.success('Sessao criada! Gerando QR Code...');

      // Iniciar conexao automaticamente
      try {
        const connectResponse = await adminService.conectarSessaoWhatsApp(response.id);
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
      const message = error.response?.data?.detail || 'Erro ao criar sessao';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: WhatsAppSessionUpdate) =>
      adminService.atualizarSessaoWhatsApp(session!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessions'] });
      toast.success('Sessao atualizada com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar sessao';
      toast.error(message);
    },
  });

  // Mutation para reconectar
  const connectMutation = useMutation({
    mutationFn: (id: string) => adminService.conectarSessaoWhatsApp(id),
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
    setCreatedSession(null);
    setQrCode(null);
    setStatus('desconectado');
    onClose();
  };

  const onSubmit = (data: WhatsAppFormData) => {
    if (isEditing) {
      // UUID zero para sessao geral (gabinete SISTEMA)
      const SISTEMA_UUID = '00000000-0000-0000-0000-000000000000';
      const payload: WhatsAppSessionUpdate = {
        // Enviar UUID zero para indicar "sem vinculo" (gabinete SISTEMA)
        gabineteId: data.gabineteId === '' ? SISTEMA_UUID : data.gabineteId,
        nome: data.nome,
        telefone: data.telefone || undefined,
        autoRead: data.autoRead,
        autoResponse: data.autoResponse,
        mensagemBoasVindas: data.mensagemBoasVindas || undefined,
      };
      updateMutation.mutate(payload);
    } else {
      const payload: WhatsAppSessionCreate = {
        // Somente enviar gabineteId se foi selecionado
        gabineteId: data.gabineteId || undefined,
        nome: data.nome,
        telefone: data.telefone || undefined,
        autoRead: data.autoRead,
        autoResponse: data.autoResponse,
        mensagemBoasVindas: data.mensagemBoasVindas || undefined,
      };
      createMutation.mutate(payload);
    }
  };

  const handleRefreshQrCode = () => {
    if (createdSession) {
      connectMutation.mutate(createdSession.id);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // =====================================================
  // Renderizacao do Form
  // =====================================================
  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Gabinete/Subgabinete */}
      <div>
        <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
          <Building2 className="w-4 h-4" />
          <span>Gabinete / Subgabinete (opcional)</span>
        </div>
        {loadingGabinetes ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner size="sm" />
            <span>Carregando gabinetes...</span>
          </div>
        ) : (
          <select
            {...register('gabineteId')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <option value="">Sem vinculo (sessao geral)</option>
            {gabinetesOrganizados.map((gab) => (
              <option key={gab.value} value={gab.value}>
                {gab.isSubgabinete ? `  ${gab.label}` : gab.label}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-xs text-slate-500">
          {isEditing
            ? 'Altere para vincular ou desvincular a sessao de um gabinete'
            : 'Deixe vazio para criar uma sessao sem vinculo a gabinete'
          }
        </p>
      </div>

      {/* Nome da Sessao */}
      <div>
        <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
          <MessageSquare className="w-4 h-4" />
          <span>Nome da Sessao</span>
        </div>
        <Input
          placeholder="Ex: WhatsApp Principal"
          {...register('nome', {
            required: 'Nome e obrigatorio',
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
          Abra o WhatsApp no celular, va em <strong>Dispositivos conectados</strong> e escaneie o codigo acima.
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
        A sessao <strong>{createdSession?.nome}</strong> esta conectada e pronta para uso.
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
    if (isEditing) return 'Editar Sessao WhatsApp';
    switch (step) {
      case 'form':
        return 'Nova Sessao de WhatsApp';
      case 'qrcode':
        return `Conectar WhatsApp - ${createdSession?.nome || ''}`;
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
