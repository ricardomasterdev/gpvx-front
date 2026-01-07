import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Edit,
  Power,
  PowerOff,
  Shield,
  Building2,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Button,
  Card,
  Badge,
  DataTable,
  Pagination,
  SearchFilter,
} from '../../components/ui';
import { UsuarioFormModal } from '../../components/admin';
import type { Column } from '../../components/ui/DataTable';
import type { FilterConfig } from '../../components/ui/SearchFilter';
import { adminService, UsuarioListItem } from '../../services/admin.service';
import { cn } from '../../utils/cn';

// =====================================================
// Configuracoes
// =====================================================

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

const FILTERS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'ativo', label: 'Ativo' },
      { value: 'inativo', label: 'Inativo' },
      { value: 'bloqueado', label: 'Bloqueado' },
    ],
  },
];

// =====================================================
// Componente de Acoes (botoes visiveis)
// =====================================================

interface ActionButtonsProps {
  usuario: UsuarioListItem;
  onEdit: (usuario: UsuarioListItem) => void;
  onToggleStatus: (usuario: UsuarioListItem) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  usuario,
  onEdit,
  onToggleStatus,
}) => {
  const isAtivo = usuario.status === 'ativo';

  return (
    <div className="flex items-center gap-1">
      {/* Editar */}
      <button
        onClick={() => onEdit(usuario)}
        className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Ativar/Desativar */}
      <button
        onClick={() => onToggleStatus(usuario)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isAtivo
            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
            : 'text-green-500 hover:text-green-600 hover:bg-green-50'
        )}
        title={isAtivo ? 'Desativar' : 'Ativar'}
      >
        {isAtivo ? (
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

export const UsuariosListPage: React.FC = () => {
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
  const [editingUsuario, setEditingUsuario] = useState<UsuarioListItem | null>(null);

  // Query para buscar usuarios
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['admin-usuarios', filters],
    queryFn: () => adminService.listarUsuarios({}),
  });

  // Mutation para ativar/desativar
  const toggleStatusMutation = useMutation({
    mutationFn: async (usuario: UsuarioListItem) => {
      const novoStatus = usuario.status === 'ativo' ? 'inativo' : 'ativo';
      return adminService.atualizarUsuario(usuario.id, { status: novoStatus });
    },
    onSuccess: (_, usuario) => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
      toast.success(
        usuario.status === 'ativo'
          ? `Usuario "${usuario.nome}" desativado`
          : `Usuario "${usuario.nome}" ativado`
      );
    },
    onError: () => {
      toast.error('Erro ao alterar status do usuario');
    },
  });

  // Filtrar e ordenar dados localmente
  const filteredData = useMemo(() => {
    let result = [...usuarios];

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.nome.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.gabineteNome?.toLowerCase().includes(query) ||
          u.gabinetePrincipalNome?.toLowerCase().includes(query)
      );
    }

    // Filtro de status
    if (filters.status) {
      result = result.filter((u) => u.status === filters.status);
    }

    // Ordenacao
    result.sort((a, b) => {
      const aValue = (a as any)[sortBy] || '';
      const bValue = (b as any)[sortBy] || '';
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [usuarios, searchQuery, filters, sortBy, sortDir]);

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
    setEditingUsuario(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (usuario: UsuarioListItem) => {
    setEditingUsuario(usuario);
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setEditingUsuario(null);
  };

  // Colunas da tabela
  const columns: Column<UsuarioListItem>[] = [
    {
      key: 'nome',
      header: 'Usuario',
      sortable: true,
      render: (usuario) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
            {usuario.nome.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">{usuario.nome}</p>
              {usuario.superUsuario && (
                <Shield className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-slate-500">{usuario.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'gabineteNome',
      header: 'Gabinete/SubGabinete',
      render: (usuario) => (
        <div>
          {usuario.gabineteNome ? (
            <div className="flex items-center gap-2">
              {usuario.isSubgabinete ? (
                <Layers className="w-4 h-4 text-violet-500 flex-shrink-0" />
              ) : (
                <Building2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
              )}
              <div>
                <p className="text-xs text-slate-400">
                  {usuario.isSubgabinete ? 'Subgabinete' : 'Gabinete'}
                </p>
                <p className="text-slate-700 font-medium">{usuario.gabineteNome}</p>
                {usuario.isSubgabinete && usuario.gabinetePrincipalNome && (
                  <p className="text-xs text-slate-400">
                    Gab: {usuario.gabinetePrincipalNome}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <span className="text-slate-400 text-sm">
              {usuario.superUsuario ? 'Todos' : 'Nao vinculado'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      align: 'center',
      render: (usuario) => {
        const statusConfig: Record<string, { variant: 'success' | 'default' | 'error'; label: string }> = {
          ativo: { variant: 'success', label: 'Ativo' },
          inativo: { variant: 'default', label: 'Inativo' },
          bloqueado: { variant: 'error', label: 'Bloqueado' },
          pendente: { variant: 'default', label: 'Pendente' },
        };
        const config = statusConfig[usuario.status] || statusConfig.inativo;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Gerencie os usuarios cadastrados no sistema
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNewModal}
        >
          Novo Usuario
        </Button>
      </div>

      {/* Filtros e busca */}
      <Card>
        <div className="flex items-center justify-between">
          <SearchFilter
            placeholder="Buscar por nome, email, gabinete, subgabinete..."
            value={searchQuery}
            onSearch={handleSearch}
            filters={FILTERS}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
          />
          <p className="text-sm text-slate-500">
            {filteredData.length} usuario(s) encontrado(s)
          </p>
        </div>
      </Card>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhum usuario encontrado"
        emptyDescription="Cadastre um novo usuario para comecar"
        emptyIcon={<Users className="w-12 h-12 text-slate-300" />}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        rowClassName={(usuario) =>
          usuario.status !== 'ativo' ? 'bg-slate-50 opacity-75' : ''
        }
        actions={(usuario) => (
          <ActionButtons
            usuario={usuario}
            onEdit={handleOpenEditModal}
            onToggleStatus={(u) => toggleStatusMutation.mutate(u)}
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
      <UsuarioFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        usuario={editingUsuario}
      />
    </div>
  );
};
