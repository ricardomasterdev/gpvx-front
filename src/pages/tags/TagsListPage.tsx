import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tag,
  Plus,
  Edit,
  Power,
  PowerOff,
  FolderOpen,
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
import { TagFormModal } from '../../components/tags';
import type { Column } from '../../components/ui/DataTable';
import type { FilterConfig } from '../../components/ui/SearchFilter';
import { tagsService, TagListItem } from '../../services/tags.service';
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
  tag: TagListItem;
  onEdit: (tag: TagListItem) => void;
  onToggleStatus: (tag: TagListItem) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  tag,
  onEdit,
  onToggleStatus,
}) => {
  return (
    <div className="flex items-center gap-1">
      {/* Editar */}
      <button
        onClick={() => onEdit(tag)}
        className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Ativar/Desativar */}
      <button
        onClick={() => onToggleStatus(tag)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          tag.ativo
            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
            : 'text-green-500 hover:text-green-600 hover:bg-green-50'
        )}
        title={tag.ativo ? 'Desativar' : 'Ativar'}
      >
        {tag.ativo ? (
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

export const TagsListPage: React.FC = () => {
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
  const [editingTag, setEditingTag] = useState<TagListItem | null>(null);

  // Query para buscar tags
  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['tags', gabinete?.id, currentPage, pageSize, searchQuery, filters],
    queryFn: () => tagsService.listar({
      page: currentPage,
      perPage: pageSize,
      search: searchQuery || undefined,
      ativo: filters.ativo,
    }),
    enabled: !!gabinete?.id,
  });

  const tags = tagsData?.items || [];
  const totalItems = tagsData?.total || 0;
  const totalPages = tagsData?.pages || 1;

  // Mutation para ativar/desativar
  const toggleStatusMutation = useMutation({
    mutationFn: async (tag: TagListItem) => {
      if (tag.ativo) {
        return tagsService.desativar(tag.id);
      } else {
        return tagsService.ativar(tag.id);
      }
    },
    onSuccess: (_, tag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success(
        tag.ativo
          ? `"${tag.nome}" desativada`
          : `"${tag.nome}" ativada`
      );
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
    setEditingTag(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (tag: TagListItem) => {
    setEditingTag(tag);
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setEditingTag(null);
  };

  // Colunas da tabela
  const columns: Column<TagListItem>[] = [
    {
      key: 'nome',
      header: 'Tag',
      sortable: true,
      render: (tag) => (
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: tag.cor }}
          >
            <Tag className="w-3.5 h-3.5" />
            {tag.nome}
          </span>
        </div>
      ),
    },
    {
      key: 'descricao',
      header: 'Descricao',
      render: (tag) => (
        <span className="text-sm text-slate-600 line-clamp-2">
          {tag.descricao || '-'}
        </span>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoria',
      width: '180px',
      render: (tag) => (
        tag.categoriaNome ? (
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            {tag.categoriaNome}
          </div>
        ) : (
          <span className="text-slate-400 text-sm">-</span>
        )
      ),
    },
    {
      key: 'cor',
      header: 'Cor',
      width: '100px',
      align: 'center',
      render: (tag) => (
        <div className="flex items-center justify-center">
          <div
            className="w-6 h-6 rounded-lg border border-slate-200"
            style={{ backgroundColor: tag.cor }}
            title={tag.cor}
          />
        </div>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      align: 'center',
      render: (tag) => (
        <Badge variant={tag.ativo ? 'success' : 'default'}>
          {tag.ativo ? 'Ativa' : 'Inativa'}
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
            <Tag className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-slate-900">Tags</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Gerencie as tags para classificar pessoas e demandas
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNewModal}
        >
          Nova Tag
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
            {totalItems} tag(s) encontrada(s)
          </p>
        </div>
      </Card>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={tags}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhuma tag encontrada"
        emptyDescription="Crie uma nova tag para comecar"
        emptyIcon={<Tag className="w-12 h-12 text-slate-300" />}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        rowClassName={(tag) =>
          !tag.ativo ? 'bg-slate-50 opacity-75' : ''
        }
        actions={(tag) => (
          <ActionButtons
            tag={tag}
            onEdit={handleOpenEditModal}
            onToggleStatus={(t) => toggleStatusMutation.mutate(t)}
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

      {/* Modal de formulario (criar/editar) */}
      <TagFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        tag={editingTag}
      />
    </div>
  );
};
