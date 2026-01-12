import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
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
import { GabineteFormModal } from '../../components/admin';
import type { Column } from '../../components/ui/DataTable';
import type { FilterConfig } from '../../components/ui/SearchFilter';
import { adminService, GabineteListItem } from '../../services/admin.service';
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
  gabinete: GabineteListItem;
  onEdit: (gabinete: GabineteListItem) => void;
  onToggleStatus: (gabinete: GabineteListItem) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  gabinete,
  onEdit,
  onToggleStatus,
}) => {
  return (
    <div className="flex items-center gap-1">
      {/* Editar */}
      <button
        onClick={() => onEdit(gabinete)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Ativar/Desativar */}
      <button
        onClick={() => onToggleStatus(gabinete)}
        className={cn(
          'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors',
          gabinete.ativo
            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
            : 'text-green-500 hover:text-green-600 hover:bg-green-50'
        )}
        title={gabinete.ativo ? 'Desativar' : 'Ativar'}
      >
        {gabinete.ativo ? (
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

export const GabinetesListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { setGabinetes, usuario } = useAuthStore();

  // Estado
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  // Estado do modal de formulario
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingGabinete, setEditingGabinete] = useState<GabineteListItem | null>(null);

  // Estado do modal de confirmacao
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [gabineteToToggle, setGabineteToToggle] = useState<GabineteListItem | null>(null);

  // Query para buscar gabinetes
  const { data: gabinetes = [], isLoading } = useQuery({
    queryKey: ['admin-gabinetes', filters],
    queryFn: () => adminService.listarGabinetes({
      ativo: filters.ativo,
    }),
  });

  // Mutation para ativar/desativar
  const toggleStatusMutation = useMutation({
    mutationFn: async (gabinete: GabineteListItem) => {
      if (gabinete.ativo) {
        return adminService.desativarGabinete(gabinete.id);
      } else {
        return adminService.ativarGabinete(gabinete.id);
      }
    },
    onSuccess: async (_, gabinete) => {
      queryClient.invalidateQueries({ queryKey: ['admin-gabinetes'] });
      toast.success(
        gabinete.ativo
          ? `Gabinete "${gabinete.nome}" desativado`
          : `Gabinete "${gabinete.nome}" ativado`
      );

      // Recarregar lista de gabinetes do super usuario
      if (usuario?.superUsuario) {
        try {
          const updatedUser = await authService.me();
          if (updatedUser.gabinetes) {
            setGabinetes(updatedUser.gabinetes);
          }
        } catch (error) {
          console.error('Erro ao atualizar lista de gabinetes:', error);
        }
      }
    },
    onError: () => {
      toast.error('Erro ao alterar status do gabinete');
    },
  });

  // Filtrar e ordenar dados localmente
  const filteredData = useMemo(() => {
    let result = [...gabinetes];

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.nome.toLowerCase().includes(query) ||
          g.codigo.toLowerCase().includes(query) ||
          g.parlamentar?.nome.toLowerCase().includes(query) ||
          g.parlamentar?.email.toLowerCase().includes(query)
      );
    }

    // Ordenacao
    result.sort((a, b) => {
      const aValue = (a as any)[sortBy] || '';
      const bValue = (b as any)[sortBy] || '';
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [gabinetes, searchQuery, sortBy, sortDir]);

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
    setEditingGabinete(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (gabinete: GabineteListItem) => {
    setEditingGabinete(gabinete);
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setEditingGabinete(null);
  };

  // Handlers do modal de confirmacao (ativar/desativar)
  const handleToggleStatus = (gabinete: GabineteListItem) => {
    setGabineteToToggle(gabinete);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggle = () => {
    if (gabineteToToggle) {
      toggleStatusMutation.mutate(gabineteToToggle, {
        onSuccess: () => {
          setConfirmModalOpen(false);
          setGabineteToToggle(null);
        },
      });
    }
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setGabineteToToggle(null);
  };

  // Colunas da tabela
  const columns: Column<GabineteListItem>[] = [
    {
      key: 'nome',
      header: 'Gabinete',
      sortable: true,
      render: (gabinete) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
            {gabinete.nome.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900">{gabinete.nome}</p>
            <p className="text-xs text-slate-500">{gabinete.codigo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'parlamentar',
      header: 'Parlamentar',
      render: (gabinete) => (
        <div>
          {gabinete.parlamentar ? (
            <>
              <p className="text-slate-700">{gabinete.parlamentar.nome}</p>
              <p className="text-xs text-slate-500">{gabinete.parlamentar.email}</p>
            </>
          ) : (
            <span className="text-slate-400 text-sm">Nao vinculado</span>
          )}
        </div>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '120px',
      align: 'center',
      render: (gabinete) => (
        <Badge variant={gabinete.ativo ? 'success' : 'default'}>
          {gabinete.ativo ? 'Ativo' : 'Inativo'}
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
            <Building2 className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gabinetes</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Gerencie os gabinetes cadastrados no sistema
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNewModal}
          className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          Novo Gabinete
        </Button>
      </div>

      {/* Filtros e busca */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <SearchFilter
            placeholder="Buscar por nome, codigo, parlamentar..."
            value={searchQuery}
            onSearch={handleSearch}
            filters={FILTERS}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            className="w-full sm:w-auto"
          />
          <p className="text-sm text-slate-500">
            {filteredData.length} gabinete(s) encontrado(s)
          </p>
        </div>
      </Card>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhum gabinete encontrado"
        emptyDescription="Cadastre um novo gabinete para comecar"
        emptyIcon={<Building2 className="w-12 h-12 text-slate-300" />}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        rowClassName={(gabinete) =>
          !gabinete.ativo ? 'bg-slate-50 opacity-75' : ''
        }
        actions={(gabinete) => (
          <ActionButtons
            gabinete={gabinete}
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
      <GabineteFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        gabinete={editingGabinete}
      />

      {/* Modal de confirmacao ativar/desativar */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmToggle}
        title={gabineteToToggle?.ativo ? 'Desativar Gabinete' : 'Ativar Gabinete'}
        message={
          <>
            Tem certeza que deseja {gabineteToToggle?.ativo ? 'desativar' : 'ativar'} o gabinete{' '}
            <strong className="text-slate-900">"{gabineteToToggle?.nome}"</strong>?
            {gabineteToToggle?.ativo && (
              <span className="text-sm text-slate-400 mt-2 block">
                O gabinete nao estara mais disponivel para acesso.
              </span>
            )}
          </>
        }
        confirmText={gabineteToToggle?.ativo ? 'Sim, Desativar' : 'Sim, Ativar'}
        cancelText="Cancelar"
        variant={gabineteToToggle?.ativo ? 'warning' : 'success'}
        isLoading={toggleStatusMutation.isPending}
      />
    </div>
  );
};
