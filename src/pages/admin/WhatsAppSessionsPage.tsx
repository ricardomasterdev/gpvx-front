import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Link2,
  Link2Off,
  QrCode,
  Send,
  Trash2,
  Building2,
  Layers,
  RefreshCw,
  Phone,
  History,
  Edit,
  Plus,
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
import { WhatsAppQRCodeModal, WhatsAppSendTestModal, WhatsAppHistoryModal } from '../../components/whatsapp';
import { WhatsAppAdminFormModal } from '../../components/admin';
import type { Column } from '../../components/ui/DataTable';
import type { FilterConfig } from '../../components/ui/SearchFilter';
import { adminService, WhatsAppSessionItem } from '../../services/admin.service';
import type { WhatsAppInstanciaListItem } from '../../services/whatsapp.service';
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
// Helper para converter WhatsAppSessionItem para WhatsAppInstanciaListItem
// =====================================================

const toInstanciaListItem = (session: WhatsAppSessionItem): WhatsAppInstanciaListItem => ({
  id: session.id,
  gabineteId: session.gabineteId,
  nome: session.nome,
  telefone: session.telefone,
  status: session.status as any,
  ativo: session.ativo,
  createdAt: session.createdAt,
});

// =====================================================
// Componente de Acoes (botoes visiveis)
// =====================================================

interface ActionButtonsProps {
  session: WhatsAppSessionItem;
  onViewHistory: (session: WhatsAppSessionItem) => void;
  onSendTest: (session: WhatsAppSessionItem) => void;
  onConnect: (session: WhatsAppSessionItem) => void;
  onDisconnect: (session: WhatsAppSessionItem) => void;
  onEdit: (session: WhatsAppSessionItem) => void;
  onDelete: (session: WhatsAppSessionItem) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  session,
  onViewHistory,
  onSendTest,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete,
}) => {
  const statusStr = session.status as string;
  const isConnected = statusStr === 'conectado' || statusStr === 'connected';
  const isConnecting = ['conectando', 'aguardando_qrcode', 'initializing', 'awaiting_qr', 'authenticated'].includes(statusStr);

  return (
    <div className="flex items-center gap-1">
      {/* Historico de Mensagens */}
      <button
        onClick={() => onViewHistory(session)}
        className="p-2 rounded-lg text-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
        title="Historico de Mensagens"
      >
        <History className="w-4 h-4" />
      </button>

      {/* Enviar Teste - apenas se conectado */}
      {isConnected && (
        <button
          onClick={() => onSendTest(session)}
          className="p-2 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Testar Envio"
        >
          <Send className="w-4 h-4" />
        </button>
      )}

      {/* Conectar / Desconectar WhatsApp */}
      {isConnected ? (
        <button
          onClick={() => onDisconnect(session)}
          className="p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Desconectar WhatsApp"
        >
          <Link2Off className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={() => onConnect(session)}
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
        onClick={() => onEdit(session)}
        className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Excluir */}
      <button
        onClick={() => onDelete(session)}
        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Excluir Sessao"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

// =====================================================
// Pagina Principal
// =====================================================

export const WhatsAppSessionsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Estado
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('gabineteNome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Estado do modal de formulario (criar/editar)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<WhatsAppSessionItem | null>(null);

  // Estado do modal de QR Code
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [connectingSession, setConnectingSession] = useState<WhatsAppSessionItem | null>(null);

  // Estado do modal de teste de envio
  const [sendTestModalOpen, setSendTestModalOpen] = useState(false);
  const [sessionToSendTest, setSessionToSendTest] = useState<WhatsAppSessionItem | null>(null);

  // Estado do modal de historico
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [sessionToViewHistory, setSessionToViewHistory] = useState<WhatsAppSessionItem | null>(null);

  // Estado do modal de desconexao
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [sessionToDisconnect, setSessionToDisconnect] = useState<WhatsAppSessionItem | null>(null);

  // Estado do modal de exclusao
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<WhatsAppSessionItem | null>(null);

  // Query para buscar sessoes
  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-whatsapp-sessions'],
    queryFn: () => adminService.listarSessoesWhatsApp(),
  });

  // Mutation para desconectar
  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminService.desconectarSessaoWhatsApp(id);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessions'] });
      if (result.nodeError) {
        toast.success(result.message, { duration: 5000 });
        toast.error(`Aviso: ${result.nodeError}`, { duration: 5000 });
      } else {
        toast.success(result.message);
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Erro ao desconectar WhatsApp';
      toast.error(message);
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessions'] });
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminService.deletarSessaoWhatsApp(id);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessions'] });
      if (result.nodeError) {
        toast.success(result.message, { duration: 5000 });
        toast.error(`Aviso: ${result.nodeError}`, { duration: 5000 });
      } else {
        toast.success(result.message);
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Erro ao excluir sessao';
      toast.error(message);
    },
  });

  // Filtrar e ordenar dados localmente
  const filteredData = useMemo(() => {
    let result = [...sessions];

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.nome.toLowerCase().includes(query) ||
          (s.gabineteNome?.toLowerCase().includes(query) ?? false) ||
          s.telefone?.toLowerCase().includes(query)
      );
    }

    // Filtro de status
    if (filters.ativo !== undefined) {
      result = result.filter((s) => s.ativo === filters.ativo);
    }

    // Ordenacao
    result.sort((a, b) => {
      const aValue = (a as any)[sortBy] || '';
      const bValue = (b as any)[sortBy] || '';
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [sessions, searchQuery, filters, sortBy, sortDir]);

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

  // Handlers do modal de formulario (criar/editar)
  const handleOpenNewModal = () => {
    setEditingSession(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (session: WhatsAppSessionItem) => {
    setEditingSession(session);
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setEditingSession(null);
  };

  // Handlers de conexao (QR Code)
  const handleConnect = (session: WhatsAppSessionItem) => {
    setConnectingSession(session);
    setQrCodeModalOpen(true);
  };

  const handleCloseQrCodeModal = () => {
    setQrCodeModalOpen(false);
    setConnectingSession(null);
    queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessions'] });
  };

  // Handlers de teste de envio
  const handleSendTest = (session: WhatsAppSessionItem) => {
    setSessionToSendTest(session);
    setSendTestModalOpen(true);
  };

  const handleCloseSendTestModal = () => {
    setSendTestModalOpen(false);
    setSessionToSendTest(null);
  };

  // Handlers do modal de historico
  const handleViewHistory = (session: WhatsAppSessionItem) => {
    setSessionToViewHistory(session);
    setHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setHistoryModalOpen(false);
    setSessionToViewHistory(null);
  };

  // Handlers de desconexao
  const handleDisconnect = (session: WhatsAppSessionItem) => {
    setSessionToDisconnect(session);
    setDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = () => {
    if (sessionToDisconnect) {
      disconnectMutation.mutate(sessionToDisconnect.id, {
        onSuccess: () => {
          setDisconnectModalOpen(false);
          setSessionToDisconnect(null);
        },
      });
    }
  };

  const handleCloseDisconnectModal = () => {
    setDisconnectModalOpen(false);
    setSessionToDisconnect(null);
  };

  // Handlers de exclusao
  const handleDelete = (session: WhatsAppSessionItem) => {
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      deleteMutation.mutate(sessionToDelete.id, {
        onSuccess: () => {
          setDeleteModalOpen(false);
          setSessionToDelete(null);
        },
      });
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSessionToDelete(null);
  };

  // Handler de refresh
  const handleRefresh = useCallback(() => {
    refetch();
    toast.success('Atualizando lista de sessoes...');
  }, [refetch]);

  // Colunas da tabela
  const columns: Column<WhatsAppSessionItem>[] = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (session) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{session.nome}</p>
            {session.telefone && (
              <p className="text-xs text-slate-500">{formatPhoneForDisplay(session.telefone)}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'gabineteNome',
      header: 'Gabinete',
      sortable: true,
      render: (session) => (
        <div className="flex items-center gap-2">
          {session.gabineteNome ? (
            <>
              {session.isSubgabinete ? (
                <Layers className="w-4 h-4 text-violet-500" />
              ) : (
                <Building2 className="w-4 h-4 text-primary-500" />
              )}
              <div>
                <p className="text-xs text-slate-400">
                  {session.isSubgabinete ? 'Subgabinete' : 'Gabinete'}
                </p>
                <p className="font-medium text-slate-700">{session.gabineteNome}</p>
                {session.isSubgabinete && session.gabinetePrincipalNome && (
                  <p className="text-xs text-slate-400">
                    Gab: {session.gabinetePrincipalNome}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Sem vinculo</p>
                <p className="font-medium text-slate-500 italic">Sessao geral</p>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Conexao',
      width: '160px',
      align: 'center',
      render: (session) => {
        const config = STATUS_CONFIG[session.status] || { label: session.status, variant: 'default' as const };
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
      render: (session) => (
        <Badge variant={session.ativo ? 'success' : 'default'}>
          {session.ativo ? 'Ativo' : 'Inativo'}
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
            <h1 className="text-2xl font-bold text-slate-900">Sessoes WhatsApp</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Gerenciar sessoes de WhatsApp de todos os gabinetes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={handleRefresh}
            loading={isLoading}
            variant="outline"
          >
            Atualizar
          </Button>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenNewModal}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            Nova Sessao
          </Button>
        </div>
      </div>

      {/* Filtros e busca */}
      <Card>
        <div className="flex items-center justify-between">
          <SearchFilter
            placeholder="Buscar por nome, gabinete, telefone..."
            value={searchQuery}
            onSearch={handleSearch}
            filters={FILTERS}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
          />
          <p className="text-sm text-slate-500">
            {filteredData.length} sessao(oes) encontrada(s)
          </p>
        </div>
      </Card>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhuma sessao de WhatsApp"
        emptyDescription="Nao existem sessoes de WhatsApp cadastradas"
        emptyIcon={<MessageSquare className="w-12 h-12 text-slate-300" />}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        rowClassName={(session) =>
          !session.ativo ? 'bg-slate-50 opacity-75' : ''
        }
        actions={(session) => (
          <ActionButtons
            session={session}
            onViewHistory={handleViewHistory}
            onSendTest={handleSendTest}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
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

      {/* Modal de confirmacao de desconexao */}
      <ConfirmModal
        isOpen={disconnectModalOpen}
        onClose={handleCloseDisconnectModal}
        onConfirm={handleConfirmDisconnect}
        title="Desconectar WhatsApp"
        message={
          <>
            Tem certeza que deseja desconectar o WhatsApp da sessao{' '}
            <strong className="text-slate-900">"{sessionToDisconnect?.nome}"</strong>
            {sessionToDisconnect?.gabineteNome && (
              <>
                {' '}do gabinete <strong className="text-slate-900">"{sessionToDisconnect.gabineteNome}"</strong>
              </>
            )}
            ?
            <span className="text-sm text-slate-400 mt-2 block">
              O gabinete precisara escanear o QR Code novamente para reconectar.
            </span>
          </>
        }
        confirmText="Sim, Desconectar"
        cancelText="Cancelar"
        variant="warning"
        isLoading={disconnectMutation.isPending}
      />

      {/* Modal de confirmacao de exclusao */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Excluir Sessao WhatsApp"
        message={
          <>
            Tem certeza que deseja <strong className="text-red-600">excluir</strong> a sessao{' '}
            <strong className="text-slate-900">"{sessionToDelete?.nome}"</strong>
            {sessionToDelete?.gabineteNome && (
              <>
                {' '}do gabinete <strong className="text-slate-900">"{sessionToDelete.gabineteNome}"</strong>
              </>
            )}
            ?
            <span className="text-sm text-red-400 mt-2 block">
              Esta acao ira remover a sessao do banco de dados e limpar os arquivos
              de autenticacao do servidor WhatsApp. Esta acao nao pode ser desfeita.
            </span>
          </>
        }
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Modal de QR Code */}
      <WhatsAppQRCodeModal
        isOpen={qrCodeModalOpen}
        onClose={handleCloseQrCodeModal}
        instancia={connectingSession ? toInstanciaListItem(connectingSession) : null}
      />

      {/* Modal de teste de envio */}
      <WhatsAppSendTestModal
        isOpen={sendTestModalOpen}
        onClose={handleCloseSendTestModal}
        instancia={sessionToSendTest ? toInstanciaListItem(sessionToSendTest) : null}
      />

      {/* Modal de historico de mensagens */}
      <WhatsAppHistoryModal
        isOpen={historyModalOpen}
        onClose={handleCloseHistoryModal}
        instancia={sessionToViewHistory ? toInstanciaListItem(sessionToViewHistory) : null}
      />

      {/* Modal de formulario (criar/editar) */}
      <WhatsAppAdminFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        session={editingSession}
      />
    </div>
  );
};
