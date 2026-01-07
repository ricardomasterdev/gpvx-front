import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Plus,
  Edit,
  Eye,
  Power,
  PowerOff,
  Building2,
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
import { RegiaoFormModal, RegiaoViewModal } from '../../components/regioes';
import type { Column } from '../../components/ui/DataTable';
import type { FilterConfig } from '../../components/ui/SearchFilter';
import { regioesService, RegiaoListItem } from '../../services/regioes.service';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

// =====================================================
// Configuracoes
// =====================================================

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

const FILTERS: FilterConfig[] = [
  {
    key: 'ativo',
    label: 'Status',
    type: 'boolean',
  },
];

// =====================================================
// Componente de Acoes
// =====================================================

interface ActionButtonsProps {
  regiao: RegiaoListItem;
  onView: (regiao: RegiaoListItem) => void;
  onEdit: (regiao: RegiaoListItem) => void;
  onToggleStatus: (regiao: RegiaoListItem) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  regiao,
  onView,
  onEdit,
  onToggleStatus,
}) => {
  return (
    <div className="flex items-center gap-1">
      {/* Visualizar */}
      <button
        onClick={() => onView(regiao)}
        className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Ver detalhes"
      >
        <Eye className="w-4 h-4" />
      </button>

      {/* Editar */}
      <button
        onClick={() => onEdit(regiao)}
        className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Ativar/Desativar */}
      <button
        onClick={() => onToggleStatus(regiao)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          regiao.ativo
            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
            : 'text-green-500 hover:text-green-600 hover:bg-green-50'
        )}
        title={regiao.ativo ? 'Desativar' : 'Ativar'}
      >
        {regiao.ativo ? (
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

export const RegioesListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { gabinete } = useAuthStore();

  // Estado
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Estado do modal de formulario
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRegiao, setEditingRegiao] = useState<RegiaoListItem | null>(null);

  // Estado do modal de visualizacao
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingRegiao, setViewingRegiao] = useState<RegiaoListItem | null>(null);

  // Estado do modal de confirmacao (ativar/desativar)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [regiaoToToggle, setRegiaoToToggle] = useState<RegiaoListItem | null>(null);

  // Query para buscar regioes
  const { data: regioes = [], isLoading } = useQuery({
    queryKey: ['regioes', gabinete?.id, searchQuery, filters],
    queryFn: () => regioesService.listar({
      search: searchQuery || undefined,
      ativo: filters.ativo,
    }),
    enabled: !!gabinete?.id,
  });

  // Filtrar e ordenar dados localmente
  const filteredData = useMemo(() => {
    let result = [...regioes];

    // Ordenacao
    result.sort((a, b) => {
      const aValue = (a as any)[sortBy] || '';
      const bValue = (b as any)[sortBy] || '';
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [regioes, sortBy, sortDir]);

  // Paginacao
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Mutation para ativar/desativar
  const toggleStatusMutation = useMutation({
    mutationFn: async (regiao: RegiaoListItem) => {
      if (regiao.ativo) {
        return regioesService.desativar(regiao.id);
      } else {
        return regioesService.ativar(regiao.id);
      }
    },
    onSuccess: (_, regiao) => {
      queryClient.invalidateQueries({ queryKey: ['regioes'] });
      toast.success(
        regiao.ativo
          ? `"${regiao.nome}" desativada`
          : `"${regiao.nome}" ativada`
      );
      setConfirmModalOpen(false);
      setRegiaoToToggle(null);
    },
    onError: () => {
      toast.error('Erro ao alterar status');
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

  // Handlers do modal
  const handleOpenNewModal = () => {
    setEditingRegiao(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (regiao: RegiaoListItem) => {
    setEditingRegiao(regiao);
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setEditingRegiao(null);
  };

  // Handlers do modal de visualizacao
  const handleViewRegiao = (regiao: RegiaoListItem) => {
    setViewingRegiao(regiao);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setViewingRegiao(null);
  };

  // Handlers do modal de confirmacao
  const handleOpenToggleModal = (regiao: RegiaoListItem) => {
    setRegiaoToToggle(regiao);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggle = () => {
    if (regiaoToToggle) {
      toggleStatusMutation.mutate(regiaoToToggle);
    }
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setRegiaoToToggle(null);
  };

  // Colunas da tabela
  const columns: Column<RegiaoListItem>[] = [
    {
      key: 'nome',
      header: 'Regiao',
      sortable: true,
      render: (regiao) => (
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: regiao.cor }}
          >
            <MapPin className="w-3.5 h-3.5" />
            {regiao.nome}
          </span>
        </div>
      ),
    },
    {
      key: 'descricao',
      header: 'Descricao',
      render: (regiao) => (
        <span className="text-sm text-slate-600 line-clamp-2">
          {regiao.descricao || '-'}
        </span>
      ),
    },
    {
      key: 'totalMunicipios',
      header: 'Cidades',
      width: '120px',
      align: 'center',
      render: (regiao) => (
        <div
          className="flex items-center justify-center gap-1.5 text-sm cursor-default"
          title={
            regiao.municipiosNomes?.length > 0
              ? regiao.municipiosNomes.join(', ')
              : 'Nenhuma cidade vinculada'
          }
        >
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">{regiao.totalMunicipios}</span>
        </div>
      ),
    },
    {
      key: 'cor',
      header: 'Cor',
      width: '80px',
      align: 'center',
      render: (regiao) => (
        <div className="flex items-center justify-center">
          <div
            className="w-6 h-6 rounded-lg border border-slate-200"
            style={{ backgroundColor: regiao.cor }}
            title={regiao.cor}
          />
        </div>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      align: 'center',
      render: (regiao) => (
        <Badge variant={regiao.ativo ? 'success' : 'default'}>
          {regiao.ativo ? 'Ativa' : 'Inativa'}
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
            <MapPin className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-slate-900">Regioes</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Agrupe cidades em regioes para facilitar a gestao
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNewModal}
        >
          Nova Regiao
        </Button>
      </div>

      {/* Filtros e busca */}
      <Card>
        <div className="flex items-center justify-between">
          <SearchFilter
            placeholder="Buscar por nome ou descricao..."
            value={searchQuery}
            onSearch={handleSearch}
            filters={FILTERS}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
          />
          <p className="text-sm text-slate-500">
            {filteredData.length} regiao(oes) encontrada(s)
          </p>
        </div>
      </Card>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhuma regiao encontrada"
        emptyDescription="Crie uma nova regiao para comecar"
        emptyIcon={<MapPin className="w-12 h-12 text-slate-300" />}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        rowClassName={(regiao) =>
          !regiao.ativo ? 'bg-slate-50 opacity-75' : ''
        }
        actions={(regiao) => (
          <ActionButtons
            regiao={regiao}
            onView={handleViewRegiao}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleOpenToggleModal}
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

      {/* Modal de visualizacao */}
      <RegiaoViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        regiao={viewingRegiao}
      />

      {/* Modal de formulario (criar/editar) */}
      <RegiaoFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        regiao={editingRegiao}
      />

      {/* Modal de confirmacao (ativar/desativar) */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmToggle}
        title={regiaoToToggle?.ativo ? 'Desativar Regiao' : 'Ativar Regiao'}
        message={
          <>
            Tem certeza que deseja {regiaoToToggle?.ativo ? 'desativar' : 'ativar'} a regiao{' '}
            <strong className="text-slate-900">"{regiaoToToggle?.nome}"</strong>?
          </>
        }
        confirmText={regiaoToToggle?.ativo ? 'Sim, Desativar' : 'Sim, Ativar'}
        cancelText="Cancelar"
        variant={regiaoToToggle?.ativo ? 'warning' : 'success'}
        isLoading={toggleStatusMutation.isPending}
      />
    </div>
  );
};
