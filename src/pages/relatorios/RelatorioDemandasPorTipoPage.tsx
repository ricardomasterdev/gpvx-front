import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban,
  Download,
  ClipboardList,
  BarChart3,
  Filter,
  X,
} from 'lucide-react';

import {
  Button,
  Card,
  DataTable,
  Pagination,
  SearchableSelect,
} from '../../components/ui';
import type { Column } from '../../components/ui/DataTable';
import { relatoriosService, RelatorioDemandaTipoItem } from '../../services/relatorios.service';
import { tagsService } from '../../services/tags.service';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

// =====================================================
// Configuracoes
// =====================================================

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

// =====================================================
// Pagina Principal
// =====================================================

export const RelatorioDemandasPorTipoPage: React.FC = () => {
  const { gabinete } = useAuthStore();

  // Estado
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('quantidade');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [categoriaId, setCategoriaId] = useState<string>('');

  // Query para buscar categorias
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-list'],
    queryFn: () => tagsService.listarCategorias(),
  });

  const categorias = categoriasData || [];

  // Query para buscar dados
  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['relatorio-demandas-por-tipo', gabinete?.id, currentPage, pageSize, categoriaId],
    queryFn: () => relatoriosService.demandasPorTipo({
      page: currentPage,
      perPage: pageSize,
      categoriaId: categoriaId || undefined,
    }),
    enabled: !!gabinete?.id,
  });

  const items = relatorioData?.items || [];
  const totalItems = relatorioData?.total || 0;
  const totalGeral = relatorioData?.totalGeral || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Mapa de quantidades por categoria (do relatorio)
  const quantidadesPorCategoria = useMemo(() => {
    const mapa: Record<string, number> = {};
    items.forEach((item) => {
      mapa[item.tipoId] = item.quantidade;
    });
    return mapa;
  }, [items]);

  // Opcoes para os selects (com quantidade)
  const categoriasOptions = useMemo(() => [
    { value: '', label: `Todas as categorias (${totalGeral})` },
    ...categorias.map((c: any) => {
      const qtd = quantidadesPorCategoria[c.id] || 0;
      return {
        value: String(c.id),
        label: `${c.nome} (${qtd.toLocaleString('pt-BR')})`,
      };
    })
  ], [categorias, quantidadesPorCategoria, totalGeral]);

  // Handlers
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
      setSortDir('desc');
      return key;
    });
  }, []);

  const handleExport = () => {
    console.log('Exportar relatorio');
  };

  const handleClearFilters = () => {
    setCategoriaId('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!categoriaId;

  // Colunas da tabela
  const columns: Column<RelatorioDemandaTipoItem>[] = [
    {
      key: 'nome',
      header: 'Tipo de Demanda',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-amber-600" />
          </div>
          <p className="font-medium text-slate-900">{item.nome}</p>
        </div>
      ),
    },
    {
      key: 'quantidade',
      header: 'Quantidade',
      sortable: true,
      width: '150px',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-400" />
          <span className="text-lg font-semibold text-slate-900">
            {item.quantidade.toLocaleString('pt-BR')}
          </span>
        </div>
      ),
    },
    {
      key: 'percentual',
      header: 'Percentual',
      sortable: true,
      width: '200px',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${item.percentual}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-600 w-12 text-right">
            {item.percentual.toFixed(1)}%
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-primary-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Demandas por Tipo</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Relatorio de demandas agrupadas por tipo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-primary-50 border-primary-300')}
          >
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 w-2 h-2 rounded-full bg-primary-500" />
            )}
          </Button>
          <Button
            variant="outline"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExport}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-600">Total de Tipos</p>
              <p className="text-2xl font-bold text-amber-900">{totalItems}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Total de Demandas</p>
              <p className="text-2xl font-bold text-blue-900">{totalGeral.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-emerald-600">Media por Tipo</p>
              <p className="text-2xl font-bold text-emerald-900">
                {totalItems > 0 ? Math.round(totalGeral / totalItems) : 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card className="border-primary-100 bg-primary-50/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-900">Filtros</h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpar filtros
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchableSelect
              label="Categoria"
              className="w-full sm:w-auto sm:min-w-[250px]"
              value={categoriaId}
              onChange={(value) => {
                setCategoriaId(value);
                setCurrentPage(1);
              }}
              options={categoriasOptions}
              placeholder="Selecione uma categoria..."
            />
          </div>
        </Card>
      )}

      {/* Info de filtros */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {totalItems} tipo(s) encontrado(s)
            {hasActiveFilters && ' com os filtros aplicados'}
          </p>
        </div>
      </Card>

      {/* Tabela */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[600px] px-4 sm:px-0">
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.tipoId}
        isLoading={isLoading}
        emptyMessage="Nenhum dado encontrado"
        emptyDescription="Nao ha demandas cadastradas"
        emptyIcon={<FolderKanban className="w-12 h-12 text-slate-300" />}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />
        </div>
      </div>

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
    </div>
  );
};
