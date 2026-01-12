import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Plus,
  Edit,
  Power,
  PowerOff,
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
import { SubgabineteFormModal } from '../../components/admin';
import type { Column } from '../../components/ui/DataTable';
import type { FilterConfig } from '../../components/ui/SearchFilter';
import { adminService, SubgabineteListItem } from '../../services/admin.service';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

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

// =====================================================
// Componente de Acoes (botoes visiveis)
// =====================================================

interface ActionButtonsProps {
  subgabinete: SubgabineteListItem;
  onEdit: (subgabinete: SubgabineteListItem) => void;
  onToggleStatus: (subgabinete: SubgabineteListItem) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  subgabinete,
  onEdit,
  onToggleStatus,
}) => {
  return (
    <div className="flex items-center gap-1">
      {/* Editar */}
      <button
        onClick={() => onEdit(subgabinete)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Ativar/Desativar */}
      <button
        onClick={() => onToggleStatus(subgabinete)}
        className={cn(
          'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors',
          subgabinete.ativo
            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
            : 'text-green-500 hover:text-green-600 hover:bg-green-50'
        )}
        title={subgabinete.ativo ? 'Desativar' : 'Ativar'}
      >
        {subgabinete.ativo ? (
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

export const SubgabinetesListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { setSubgabinetes, usuario, gabinete } = useAuthStore();

  // Estado
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  // Estado do modal de formulario
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSubgabinete, setEditingSubgabinete] = useState<SubgabineteListItem | null>(null);

  // Estado do modal de confirmacao
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [subgabineteToToggle, setSubgabineteToToggle] = useState<SubgabineteListItem | null>(null);

  // Query para buscar subgabinetes
  const { data: subgabinetes = [], isLoading } = useQuery({
    queryKey: ['admin-subgabinetes', filters],
    queryFn: () => adminService.listarSubgabinetes(),
  });

  // Mutation para ativar/desativar
  const toggleStatusMutation = useMutation({
    mutationFn: async (subgabinete: SubgabineteListItem) => {
      if (subgabinete.ativo) {
        return adminService.desativarSubgabinete(subgabinete.id);
      } else {
        return adminService.ativarSubgabinete(subgabinete.id);
      }
    },
    onSuccess: async (_, subgabinete) => {
      queryClient.invalidateQueries({ queryKey: ['admin-subgabinetes'] });
      toast.success(
        subgabinete.ativo
          ? `Subgabinete "${subgabinete.nome}" desativado`
          : `Subgabinete "${subgabinete.nome}" ativado`
      );

      // Recarregar lista de subgabinetes do usuario
      if (usuario?.isAdminGabinete) {
        try {
          const updatedUser = await authService.me();
          if (updatedUser.subgabinetes) {
            setSubgabinetes(updatedUser.subgabinetes);
          }
        } catch (error) {
          console.error('Erro ao atualizar lista de subgabinetes:', error);
        }
      }
    },
    onError: () => {
      toast.error('Erro ao alterar status do subgabinete');
    },
  });

  // Filtrar e ordenar dados localmente
  const filteredData = useMemo(() => {
    let result = [...subgabinetes];

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (sg) =>
          sg.nome.toLowerCase().includes(query) ||
          sg.codigo.toLowerCase().includes(query)
      );
    }

    // Filtro de status
    if (filters.ativo !== undefined) {
      result = result.filter((sg) => sg.ativo === filters.ativo);
    }

    // Ordenacao
    result.sort((a, b) => {
      const aValue = (a as any)[sortBy] || '';
      const bValue = (b as any)[sortBy] || '';
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [subgabinetes, searchQuery, filters, sortBy, sortDir]);

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

  // Handlers do modal
  const handleOpenNewModal = () => {
    setEditingSubgabinete(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (subgabinete: SubgabineteListItem) => {
    setEditingSubgabinete(subgabinete);
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setEditingSubgabinete(null);
  };

  // Handlers do modal de confirmacao (ativar/desativar)
  const handleToggleStatus = (subgabinete: SubgabineteListItem) => {
    setSubgabineteToToggle(subgabinete);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggle = () => {
    if (subgabineteToToggle) {
      toggleStatusMutation.mutate(subgabineteToToggle, {
        onSuccess: () => {
          setConfirmModalOpen(false);
          setSubgabineteToToggle(null);
        },
      });
    }
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setSubgabineteToToggle(null);
  };

  // Colunas da tabela
  const columns: Column<SubgabineteListItem>[] = [
    {
      key: 'nome',
      header: 'Subgabinete',
      sortable: true,
      render: (subgabinete) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {subgabinete.nome.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900">{subgabinete.nome}</p>
            <p className="text-xs text-slate-500">{subgabinete.codigo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '120px',
      align: 'center',
      render: (subgabinete) => (
        <Badge variant={subgabinete.ativo ? 'success' : 'default'}>
          {subgabinete.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-violet-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Subgabinetes</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Gerencie os subgabinetes do {gabinete?.nome || 'gabinete'}
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNewModal}
          className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
        >
          Novo Subgabinete
        </Button>
      </div>

      {/* Filtros e busca */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <SearchFilter
            placeholder="Buscar por nome, codigo..."
            value={searchQuery}
            onSearch={handleSearch}
            filters={FILTERS}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            className="w-full sm:w-auto"
          />
          <p className="text-sm text-slate-500">
            {filteredData.length} subgabinete(s) encontrado(s)
          </p>
        </div>
      </Card>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhum subgabinete encontrado"
        emptyDescription="Cadastre um novo subgabinete para comecar"
        emptyIcon={<Layers className="w-12 h-12 text-slate-300" />}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        rowClassName={(subgabinete) =>
          !subgabinete.ativo ? 'bg-slate-50 opacity-75' : ''
        }
        actions={(subgabinete) => (
          <ActionButtons
            subgabinete={subgabinete}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
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
      <SubgabineteFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        subgabinete={editingSubgabinete}
      />

      {/* Modal de confirmacao ativar/desativar */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmToggle}
        title={subgabineteToToggle?.ativo ? 'Desativar Subgabinete' : 'Ativar Subgabinete'}
        message={
          <>
            Tem certeza que deseja {subgabineteToToggle?.ativo ? 'desativar' : 'ativar'} o subgabinete{' '}
            <strong className="text-slate-900">"{subgabineteToToggle?.nome}"</strong>?
            {subgabineteToToggle?.ativo && (
              <span className="text-sm text-slate-400 mt-2 block">
                O subgabinete nao estara mais disponivel para acesso.
              </span>
            )}
          </>
        }
        confirmText={subgabineteToToggle?.ativo ? 'Sim, Desativar' : 'Sim, Ativar'}
        cancelText="Cancelar"
        variant={subgabineteToToggle?.ativo ? 'warning' : 'success'}
        isLoading={toggleStatusMutation.isPending}
      />
    </div>
  );
};
