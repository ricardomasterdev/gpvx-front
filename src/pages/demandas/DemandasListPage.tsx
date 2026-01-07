import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Plus,
  Eye,
  Edit,
  XCircle,
  User,
  Calendar,
  Tag,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
  PauseCircle,
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
import { DemandaFormModal, DemandaViewModal } from '../../components/demandas';
import type { Column } from '../../components/ui/DataTable';
import type { FilterConfig } from '../../components/ui/SearchFilter';
import {
  demandasService,
  categoriasService,
  DemandaListItem,
  StatusDemanda,
  PrioridadeDemanda,
} from '../../services/demandas.service';
import { cn } from '../../utils/cn';

// =====================================================
// Configuracoes
// =====================================================

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

const STATUS_CONFIG: Record<StatusDemanda, { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'primary'; icon: React.ReactNode }> = {
  aberta: { label: 'Aberta', variant: 'primary', icon: <Clock className="w-3 h-3" /> },
  em_andamento: { label: 'Em Andamento', variant: 'warning', icon: <Loader2 className="w-3 h-3" /> },
  aguardando: { label: 'Aguardando', variant: 'default', icon: <PauseCircle className="w-3 h-3" /> },
  concluida: { label: 'Concluida', variant: 'success', icon: <CheckCircle className="w-3 h-3" /> },
  cancelada: { label: 'Cancelada', variant: 'error', icon: <XCircle className="w-3 h-3" /> },
};

const PRIORIDADE_CONFIG: Record<PrioridadeDemanda, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'text-slate-500' },
  normal: { label: 'Normal', color: 'text-blue-500' },
  alta: { label: 'Alta', color: 'text-amber-500' },
  urgente: { label: 'Urgente', color: 'text-orange-500' },
  critica: { label: 'Critica', color: 'text-red-500' },
};

// =====================================================
// Componente de Acoes
// =====================================================

interface ActionButtonsProps {
  demanda: DemandaListItem;
  onView: (demanda: DemandaListItem) => void;
  onEdit: (demanda: DemandaListItem) => void;
  onCancel: (demanda: DemandaListItem) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  demanda,
  onView,
  onEdit,
  onCancel,
}) => {
  const isCancelada = demanda.status === 'cancelada';
  const isConcluida = demanda.status === 'concluida';

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onView(demanda)}
        className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Visualizar"
      >
        <Eye className="w-4 h-4" />
      </button>

      {!isCancelada && !isConcluida && (
        <>
          <button
            onClick={() => onEdit(demanda)}
            className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCancel(demanda)}
            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Cancelar"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

// =====================================================
// Pagina Principal
// =====================================================

export const DemandasListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Ler filtros iniciais da URL
  const getInitialFilters = useCallback(() => {
    const initialFilters: Record<string, any> = {};
    const status = searchParams.get('status');
    const prioridade = searchParams.get('prioridade');
    const atrasadas = searchParams.get('atrasadas');

    if (status) initialFilters.status = status;
    if (prioridade) initialFilters.prioridade = prioridade;
    if (atrasadas === 'true') initialFilters.atrasadas = true;

    return initialFilters;
  }, [searchParams]);

  // Estado
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>(getInitialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Atualizar filtros quando URL mudar
  useEffect(() => {
    const urlFilters = getInitialFilters();
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, [searchParams, getInitialFilters]);

  // Modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingDemanda, setEditingDemanda] = useState<DemandaListItem | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingDemanda, setViewingDemanda] = useState<DemandaListItem | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [demandaToCancel, setDemandaToCancel] = useState<DemandaListItem | null>(null);

  // Query para buscar categorias (para filtro)
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriasService.listar(),
  });

  // Filtros dinamicos
  const FILTERS: FilterConfig[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'aberta', label: 'Aberta' },
        { value: 'em_andamento', label: 'Em Andamento' },
        { value: 'aguardando', label: 'Aguardando' },
        { value: 'concluida', label: 'Concluida' },
        { value: 'cancelada', label: 'Cancelada' },
      ],
    },
    {
      key: 'prioridade',
      label: 'Prioridade',
      type: 'select',
      options: [
        { value: 'baixa', label: 'Baixa' },
        { value: 'normal', label: 'Normal' },
        { value: 'alta', label: 'Alta' },
        { value: 'urgente', label: 'Urgente' },
        { value: 'critica', label: 'Critica' },
      ],
    },
    {
      key: 'categoriaId',
      label: 'Tipo',
      type: 'select',
      options: categorias.map((c) => ({ value: c.id, label: c.nome })),
    },
  ], [categorias]);

  // Query para buscar demandas
  const { data: demandasData, isLoading } = useQuery({
    queryKey: ['demandas', currentPage, pageSize, searchQuery, filters],
    queryFn: () =>
      demandasService.listar({
        page: currentPage,
        perPage: pageSize,
        search: searchQuery || undefined,
        status: filters.status || undefined,
        prioridade: filters.prioridade || undefined,
        categoriaId: filters.categoriaId || undefined,
        atrasadas: filters.atrasadas || undefined,
      }),
  });

  const demandas = demandasData?.items || [];
  const totalPages = demandasData?.pages || 0;
  const totalItems = demandasData?.total || 0;

  // Mutation para cancelar
  const cancelarMutation = useMutation({
    mutationFn: (demanda: DemandaListItem) => demandasService.cancelar(demanda.id),
    onSuccess: (_, demanda) => {
      queryClient.invalidateQueries({ queryKey: ['demandas'] });
      toast.success(`Demanda "${demanda.numeroProtocolo}" cancelada`);
    },
    onError: () => {
      toast.error('Erro ao cancelar demanda');
    },
  });

  // Handlers
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

  const handleOpenNewModal = () => {
    setEditingDemanda(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (demanda: DemandaListItem) => {
    setEditingDemanda(demanda);
    setFormModalOpen(true);
  };

  const handleViewDemanda = (demanda: DemandaListItem) => {
    setViewingDemanda(demanda);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setViewingDemanda(null);
  };

  const handleCancelDemanda = (demanda: DemandaListItem) => {
    setDemandaToCancel(demanda);
    setConfirmModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (demandaToCancel) {
      cancelarMutation.mutate(demandaToCancel, {
        onSuccess: () => {
          setConfirmModalOpen(false);
          setDemandaToCancel(null);
        },
      });
    }
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setDemandaToCancel(null);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setEditingDemanda(null);
  };

  // Formatar data sem conversao de timezone
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    // Se vier no formato ISO yyyy-mm-dd, formata diretamente
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Colunas da tabela
  const columns: Column<DemandaListItem>[] = [
    {
      key: 'numeroProtocolo',
      header: 'Protocolo',
      width: '120px',
      render: (demanda) => (
        <span className="font-mono text-sm font-medium text-primary-600">
          #{demanda.numeroProtocolo}
        </span>
      ),
    },
    {
      key: 'titulo',
      header: 'Demanda',
      render: (demanda) => (
        <div className="max-w-xs">
          <p className="font-medium text-slate-900 truncate" title={demanda.titulo}>
            {demanda.titulo}
          </p>
          {demanda.categoriaNome && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: demanda.categoriaCor || '#6B7280' }}
              />
              <span className="text-xs text-slate-500">{demanda.categoriaNome}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'nomeSolicitante',
      header: 'Solicitante',
      render: (demanda) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-sm text-slate-700">
            {demanda.pessoaNome || demanda.nomeSolicitante || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (demanda) => {
        const config = STATUS_CONFIG[demanda.status] || STATUS_CONFIG.aberta;
        return (
          <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'prioridade',
      header: 'Prioridade',
      width: '100px',
      render: (demanda) => {
        const config = PRIORIDADE_CONFIG[demanda.prioridade] || PRIORIDADE_CONFIG.normal;
        return (
          <div className={cn('flex items-center gap-1 text-sm font-medium', config.color)}>
            {demanda.prioridade === 'urgente' || demanda.prioridade === 'critica' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : null}
            {config.label}
          </div>
        );
      },
    },
    {
      key: 'dataAbertura',
      header: 'Abertura',
      width: '100px',
      render: (demanda) => (
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          {formatDate(demanda.dataAbertura)}
        </div>
      ),
    },
    {
      key: 'dataPrazo',
      header: 'Prazo',
      width: '100px',
      render: (demanda) => (
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          {formatDate(demanda.dataPrazo)}
        </div>
      ),
    },
    {
      key: 'diasAberto',
      header: 'Dias',
      width: '80px',
      align: 'center',
      render: (demanda) => {
        const dias = demanda.diasAberto;
        const isAtrasado = dias > 30;
        return (
          <span className={cn(
            'text-sm font-medium',
            isAtrasado ? 'text-red-500' : 'text-slate-600'
          )}>
            {dias}d
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-slate-900">Demandas</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Gerencie as demandas do gabinete
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNewModal}
        >
          Nova Demanda
        </Button>
      </div>

      {/* Filtros e busca */}
      <Card>
        <div className="flex items-center justify-between">
          <SearchFilter
            placeholder="Buscar por protocolo, titulo, solicitante..."
            value={searchQuery}
            onSearch={handleSearch}
            filters={FILTERS}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
          />
          <p className="text-sm text-slate-500">
            {totalItems} demanda(s) encontrada(s)
          </p>
        </div>
      </Card>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={demandas}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhuma demanda encontrada"
        emptyDescription="Cadastre uma nova demanda para comecar"
        emptyIcon={<ClipboardList className="w-12 h-12 text-slate-300" />}
        rowClassName={(demanda) =>
          demanda.status === 'cancelada' ? 'bg-slate-50 opacity-75' : ''
        }
        actions={(demanda) => (
          <ActionButtons
            demanda={demanda}
            onView={handleViewDemanda}
            onEdit={handleOpenEditModal}
            onCancel={handleCancelDemanda}
          />
        )}
      />

      {/* Paginacao */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      )}

      {/* Modal de formulario */}
      <DemandaFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        demanda={editingDemanda}
      />

      {/* Modal de visualizacao */}
      <DemandaViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        demanda={viewingDemanda}
      />

      {/* Modal de confirmacao de cancelamento */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmCancel}
        title="Cancelar Demanda"
        message={
          <>
            Tem certeza que deseja cancelar a demanda{' '}
            <strong className="text-slate-900">#{demandaToCancel?.numeroProtocolo}</strong>?
            <br />
            <span className="text-sm text-slate-400 mt-2 block">
              Esta acao nao podera ser desfeita.
            </span>
          </>
        }
        confirmText="Sim, Cancelar"
        cancelText="Nao, Manter"
        variant="danger"
        isLoading={cancelarMutation.isPending}
      />
    </div>
  );
};
