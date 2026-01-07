import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Plus,
  Edit,
  Power,
  PowerOff,
  Link2,
  Link2Off,
  QrCode,
  Send,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Button,
  Card,
  Badge,
  DataTable,
  Pagination,
  SearchFilter,
  ConfirmModal,
} from '../../components/ui';
import { WhatsAppFormModal, WhatsAppQRCodeModal, WhatsAppSendTestModal, WhatsAppHistoryModal } from '../../components/whatsapp';
import type { Column } from '../../components/ui/DataTable';
import type { FilterConfig } from '../../components/ui/SearchFilter';
import { whatsappService, WhatsAppInstanciaListItem, StatusWhatsApp } from '../../services/whatsapp.service';
import { cn } from '../../utils/cn';

// =====================================================
// Helpers
// =====================================================

/**
 * Formata numero de telefone brasileiro para exibicao
 * Ex: 5562984537185 -> +55 (62) 98453-7185
 */
const formatPhoneForDisplay = (phone: string | undefined | null): string => {
  if (!phone) return '';

  // Remover tudo que nao e numero
  const numbers = phone.replace(/\D/g, '');

  // Se tem menos de 10 digitos, retornar como esta
  if (numbers.length < 10) return phone;

  // Se comeca com 55, formatar completo
  if (numbers.startsWith('55') && numbers.length >= 12) {
    const ddd = numbers.substring(2, 4);
    const rest = numbers.substring(4);

    if (rest.length === 9) {
      // 9 digitos: +55 (XX) 9XXXX-XXXX
      return `+55 (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
    } else if (rest.length === 8) {
      // 8 digitos: +55 (XX) XXXX-XXXX
      return `+55 (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
    }
  }

  // Formato sem o 55: +55 (XX) XXXXX-XXXX ou +55 (XX) XXXX-XXXX
  if (numbers.length === 11) {
    const ddd = numbers.substring(0, 2);
    const rest = numbers.substring(2);
    return `+55 (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
  } else if (numbers.length === 10) {
    const ddd = numbers.substring(0, 2);
    const rest = numbers.substring(2);
    return `+55 (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
  }

  return phone;
};

// =====================================================
// Configuracoes
// =====================================================

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

const FILTERS: FilterConfig[] = [
  {
    key: 'ativo',
    label: 'Status',
    type: 'boolean',
  },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  // Valores do enum PostgreSQL (principais)
  conectado: { label: 'Conectado', variant: 'success' },
  aguardando_qrcode: { label: 'Aguardando QR Code', variant: 'warning' },
  conectando: { label: 'Conectando...', variant: 'warning' },
  desconectado: { label: 'Desconectado', variant: 'default' },
  // Valores internos do Node.js (compatibilidade)
  connected: { label: 'Conectado', variant: 'success' },
  initializing: { label: 'Conectando...', variant: 'warning' },
  awaiting_qr: { label: 'Aguardando QR Code', variant: 'warning' },
  authenticated: { label: 'Conectando...', variant: 'warning' },
  disconnected: { label: 'Desconectado', variant: 'default' },
  auth_failure: { label: 'Erro de Autenticacao', variant: 'error' },
};

// =====================================================
// Componente de Acoes (botoes visiveis)
// =====================================================

interface ActionButtonsProps {
  instancia: WhatsAppInstanciaListItem;
  onEdit: (instancia: WhatsAppInstanciaListItem) => void;
  onToggleStatus: (instancia: WhatsAppInstanciaListItem) => void;
  onConnect: (instancia: WhatsAppInstanciaListItem) => void;
  onDisconnect: (instancia: WhatsAppInstanciaListItem) => void;
  onSendTest: (instancia: WhatsAppInstanciaListItem) => void;
  onViewHistory: (instancia: WhatsAppInstanciaListItem) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  instancia,
  onEdit,
  onToggleStatus,
  onConnect,
  onDisconnect,
  onSendTest,
  onViewHistory,
}) => {
  const statusStr = instancia.status as string;
  const isConnected = statusStr === 'conectado' || statusStr === 'connected';
  const isConnecting = ['conectando', 'aguardando_qrcode', 'initializing', 'awaiting_qr', 'authenticated'].includes(statusStr);

  return (
    <div className="flex items-center gap-1">
      {/* Historico de Mensagens */}
      <button
        onClick={() => onViewHistory(instancia)}
        className="p-2 rounded-lg text-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
        title="Historico de Mensagens"
      >
        <History className="w-4 h-4" />
      </button>

      {/* Enviar Teste - apenas se conectado */}
      {isConnected && (
        <button
          onClick={() => onSendTest(instancia)}
          className="p-2 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Testar Envio"
        >
          <Send className="w-4 h-4" />
        </button>
      )}

      {/* Conectar / Desconectar WhatsApp */}
      {isConnected ? (
        <button
          onClick={() => onDisconnect(instancia)}
          className="p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Desconectar WhatsApp"
        >
          <Link2Off className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={() => onConnect(instancia)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isConnecting
              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
              : 'text-green-500 hover:text-green-600 hover:bg-green-50'
          )}
          title={isConnecting ? 'Ver QR Code' : 'Conectar WhatsApp'}
        >
          {isConnecting ? <QrCode className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        </button>
      )}

      {/* Editar */}
      <button
        onClick={() => onEdit(instancia)}
        className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Ativar/Desativar */}
      <button
        onClick={() => onToggleStatus(instancia)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          instancia.ativo
            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
            : 'text-green-500 hover:text-green-600 hover:bg-green-50'
        )}
        title={instancia.ativo ? 'Desativar' : 'Ativar'}
      >
        {instancia.ativo ? (
          <PowerOff className="w-4 h-4" />
        ) : (
          <Power className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

// =====================================================
// Pagina Principal
// =====================================================

export const WhatsAppListPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Estado
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  // Estado do modal de formulario
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingInstancia, setEditingInstancia] = useState<WhatsAppInstanciaListItem | null>(null);
  // Estado do modal de QR Code
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [connectingInstancia, setConnectingInstancia] = useState<WhatsAppInstanciaListItem | null>(null);
  // Estado do modal de confirmacao
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [instanciaToToggle, setInstanciaToToggle] = useState<WhatsAppInstanciaListItem | null>(null);
  // Estado do modal de desconexao
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [instanciaToDisconnect, setInstanciaToDisconnect] = useState<WhatsAppInstanciaListItem | null>(null);
  // Estado do modal de teste de envio
  const [sendTestModalOpen, setSendTestModalOpen] = useState(false);
  const [instanciaToSendTest, setInstanciaToSendTest] = useState<WhatsAppInstanciaListItem | null>(null);
  // Estado do modal de historico
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [instanciaToViewHistory, setInstanciaToViewHistory] = useState<WhatsAppInstanciaListItem | null>(null);

  // Query para buscar instancias
  const { data: instancias = [], isLoading } = useQuery({
    queryKey: ['whatsapp-instancias'],
    queryFn: () => whatsappService.listar(),
  });

  // Mutation para ativar/desativar
  const toggleStatusMutation = useMutation({
    mutationFn: async (instancia: WhatsAppInstanciaListItem) => {
      if (instancia.ativo) {
        return whatsappService.desativar(instancia.id);
      } else {
        return whatsappService.ativar(instancia.id);
      }
    },
    onSuccess: (_, instancia) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instancias'] });
      toast.success(
        instancia.ativo
          ? `Instancia "${instancia.nome}" desativada`
          : `Instancia "${instancia.nome}" ativada`
      );
    },
    onError: () => {
      toast.error('Erro ao alterar status da instancia');
    },
  });

  // Mutation para desconectar
  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      // Desconectar no Node.js
      const result = await whatsappService.desconectar(id);
      return { id, result };
    },
    onSuccess: ({ id }) => {
      // Atualizar o cache local para mostrar desconectado imediatamente
      queryClient.setQueryData(['whatsapp-instancias'], (oldData: WhatsAppInstanciaListItem[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((item) =>
          item.id === id ? { ...item, status: 'desconectado' as const, telefone: undefined } : item
        );
      });
      // Também invalidar para buscar dados frescos do servidor
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instancias'] });
      toast.success('WhatsApp desconectado com sucesso');
    },
    onError: (error: any) => {
      const message = error.message || 'Erro ao desconectar WhatsApp';
      toast.error(message);
      // Mesmo com erro, tentar atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instancias'] });
    },
  });

  // Filtrar e ordenar dados localmente
  const filteredData = useMemo(() => {
    let result = [...instancias];

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.nome.toLowerCase().includes(query) ||
          i.telefone?.toLowerCase().includes(query)
      );
    }

    // Filtro de status
    if (filters.ativo !== undefined) {
      result = result.filter((i) => i.ativo === filters.ativo);
    }

    // Ordenacao
    result.sort((a, b) => {
      const aValue = (a as any)[sortBy] || '';
      const bValue = (b as any)[sortBy] || '';
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [instancias, searchQuery, filters, sortBy, sortDir]);

  // Paginacao
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Handlers
  const handleSort = useCallback((key: string) => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Handlers do modal de formulario
  const handleOpenNewModal = () => {
    setEditingInstancia(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (instancia: WhatsAppInstanciaListItem) => {
    setEditingInstancia(instancia);
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setEditingInstancia(null);
  };

  // Handlers do modal de confirmacao (ativar/desativar)
  const handleToggleStatus = (instancia: WhatsAppInstanciaListItem) => {
    setInstanciaToToggle(instancia);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggle = () => {
    if (instanciaToToggle) {
      toggleStatusMutation.mutate(instanciaToToggle, {
        onSuccess: () => {
          setConfirmModalOpen(false);
          setInstanciaToToggle(null);
        },
      });
    }
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setInstanciaToToggle(null);
  };

  // Handlers de conexao
  const handleConnect = (instancia: WhatsAppInstanciaListItem) => {
    setConnectingInstancia(instancia);
    setQrCodeModalOpen(true);
  };

  const handleCloseQrCodeModal = () => {
    setQrCodeModalOpen(false);
    setConnectingInstancia(null);
    queryClient.invalidateQueries({ queryKey: ['whatsapp-instancias'] });
  };

  // Handlers de desconexao
  const handleDisconnect = (instancia: WhatsAppInstanciaListItem) => {
    setInstanciaToDisconnect(instancia);
    setDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = () => {
    if (instanciaToDisconnect) {
      disconnectMutation.mutate(instanciaToDisconnect.id, {
        onSuccess: () => {
          setDisconnectModalOpen(false);
          setInstanciaToDisconnect(null);
        },
      });
    }
  };

  const handleCloseDisconnectModal = () => {
    setDisconnectModalOpen(false);
    setInstanciaToDisconnect(null);
  };

  // Handlers de teste de envio
  const handleSendTest = (instancia: WhatsAppInstanciaListItem) => {
    setInstanciaToSendTest(instancia);
    setSendTestModalOpen(true);
  };

  const handleCloseSendTestModal = () => {
    setSendTestModalOpen(false);
    setInstanciaToSendTest(null);
  };

  // Handlers do modal de historico
  const handleViewHistory = (instancia: WhatsAppInstanciaListItem) => {
    setInstanciaToViewHistory(instancia);
    setHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setHistoryModalOpen(false);
    setInstanciaToViewHistory(null);
  };

  // Colunas da tabela
  const columns: Column<WhatsAppInstanciaListItem>[] = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (instancia) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{instancia.nome}</p>
            {instancia.telefone && (
              <p className="text-xs text-slate-500">{formatPhoneForDisplay(instancia.telefone)}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Conexao',
      width: '160px',
      align: 'center',
      render: (instancia) => {
        const config = STATUS_CONFIG[instancia.status] || { label: instancia.status, variant: 'default' as const };
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '120px',
      align: 'center',
      render: (instancia) => (
        <Badge variant={instancia.ativo ? 'success' : 'default'}>
          {instancia.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-500" />
            <h1 className="text-2xl font-bold text-slate-900">WhatsApp</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Gerencie as conexoes do WhatsApp do gabinete
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNewModal}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          Nova Instancia
        </Button>
      </div>

      {/* Filtros e busca */}
      <Card>
        <div className="flex items-center justify-between">
          <SearchFilter
            placeholder="Buscar por nome, telefone..."
            value={searchQuery}
            onSearch={handleSearch}
            filters={FILTERS}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
          />
          <p className="text-sm text-slate-500">
            {filteredData.length} instancia(s) encontrada(s)
          </p>
        </div>
      </Card>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhuma instancia de WhatsApp"
        emptyDescription="Cadastre uma nova instancia para comecar"
        emptyIcon={<MessageSquare className="w-12 h-12 text-slate-300" />}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        rowClassName={(instancia) =>
          !instancia.ativo ? 'bg-slate-50 opacity-75' : ''
        }
        actions={(instancia) => (
          <ActionButtons
            instancia={instancia}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSendTest={handleSendTest}
            onViewHistory={handleViewHistory}
          />
        )}
      />

      {/* Paginacao */}
      {filteredData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      )}

      {/* Modal de formulario (criar/editar) */}
      <WhatsAppFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        instancia={editingInstancia}
      />

      {/* Modal de QR Code */}
      <WhatsAppQRCodeModal
        isOpen={qrCodeModalOpen}
        onClose={handleCloseQrCodeModal}
        instancia={connectingInstancia}
      />

      {/* Modal de confirmacao ativar/desativar */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmToggle}
        title={instanciaToToggle?.ativo ? 'Desativar Instancia' : 'Ativar Instancia'}
        message={
          <>
            Tem certeza que deseja {instanciaToToggle?.ativo ? 'desativar' : 'ativar'} a instancia{' '}
            <strong className="text-slate-900">"{instanciaToToggle?.nome}"</strong>?
            {instanciaToToggle?.ativo && (
              <span className="text-sm text-slate-400 mt-2 block">
                A instancia nao estara mais disponivel para uso.
              </span>
            )}
          </>
        }
        confirmText={instanciaToToggle?.ativo ? 'Sim, Desativar' : 'Sim, Ativar'}
        cancelText="Cancelar"
        variant={instanciaToToggle?.ativo ? 'warning' : 'success'}
        isLoading={toggleStatusMutation.isPending}
      />

      {/* Modal de confirmacao de desconexao */}
      <ConfirmModal
        isOpen={disconnectModalOpen}
        onClose={handleCloseDisconnectModal}
        onConfirm={handleConfirmDisconnect}
        title="Desconectar WhatsApp"
        message={
          <>
            Tem certeza que deseja desconectar o WhatsApp da instancia{' '}
            <strong className="text-slate-900">"{instanciaToDisconnect?.nome}"</strong>?
            <span className="text-sm text-slate-400 mt-2 block">
              Voce precisara escanear o QR Code novamente para reconectar.
            </span>
          </>
        }
        confirmText="Sim, Desconectar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={disconnectMutation.isPending}
      />

      {/* Modal de teste de envio */}
      <WhatsAppSendTestModal
        isOpen={sendTestModalOpen}
        onClose={handleCloseSendTestModal}
        instancia={instanciaToSendTest}
      />

      {/* Modal de historico de mensagens */}
      <WhatsAppHistoryModal
        isOpen={historyModalOpen}
        onClose={handleCloseHistoryModal}
        instancia={instanciaToViewHistory}
      />
    </div>
  );
};
