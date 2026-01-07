import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Tag,
  Download,
  Users,
  BarChart3,
  Filter,
  X,
  User,
  Phone,
  Mail,
} from 'lucide-react';

import {
  Button,
  Card,
  DataTable,
  Pagination,
  SearchableSelect,
  Avatar,
} from '../../components/ui';
import type { Column } from '../../components/ui/DataTable';
import {
  relatoriosService,
  RelatorioTagItem,
  RelatorioPessoaItem,
} from '../../services/relatorios.service';
import { tagsService } from '../../services/tags.service';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

// =====================================================
// Configuracoes
// =====================================================

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

// =====================================================
// Type Guards
// =====================================================

function isPessoaItem(item: RelatorioTagItem | RelatorioPessoaItem): item is RelatorioPessoaItem {
  return (item as RelatorioPessoaItem).tipo === 'pessoa';
}

function isTagItem(item: RelatorioTagItem | RelatorioPessoaItem): item is RelatorioTagItem {
  return (item as RelatorioTagItem).tipo === 'tag' || !(item as RelatorioPessoaItem).pessoaId;
}

// =====================================================
// Pagina Principal
// =====================================================

export const RelatorioPessoasPorTagsPage: React.FC = () => {
  const { gabinete } = useAuthStore();

  // Estado
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('quantidade');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [tagId, setTagId] = useState<string>('');

  // Query para buscar tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags-list'],
    queryFn: () => tagsService.listar({ perPage: 100 }),
  });

  const tags = tagsData?.items || [];

  // Query para buscar dados
  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['relatorio-pessoas-por-tags', gabinete?.id, currentPage, pageSize, tagId],
    queryFn: () => relatoriosService.pessoasPorTag({
      page: currentPage,
      perPage: pageSize,
      tagId: tagId || undefined,
    }),
    enabled: !!gabinete?.id,
  });

  const items = relatorioData?.items || [];
  const totalItems = relatorioData?.total || 0;
  const totalGeral = relatorioData?.totalGeral || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Detecta se esta mostrando pessoas ou tags
  const showingPeople = tagId && items.length > 0 && isPessoaItem(items[0]);

  // Filtra items por tipo para tipagem correta
  const tagItems = useMemo(() => {
    if (showingPeople) return [];
    return items.filter(isTagItem) as RelatorioTagItem[];
  }, [items, showingPeople]);

  const pessoaItems = useMemo(() => {
    if (!showingPeople) return [];
    return items.filter(isPessoaItem) as RelatorioPessoaItem[];
  }, [items, showingPeople]);

  // Mapa de quantidades por tag (do relatorio)
  const quantidadesPorTag = useMemo(() => {
    const mapa: Record<string, number> = {};
    tagItems.forEach((item) => {
      mapa[item.id] = item.quantidade;
    });
    return mapa;
  }, [tagItems]);

  // Nome da tag selecionada
  const tagSelecionadaNome = useMemo(() => {
    if (!tagId) return '';
    const tag = tags.find((t: any) => String(t.id) === tagId);
    return tag?.nome || '';
  }, [tagId, tags]);

  // Opcoes para os selects (com quantidade)
  const tagsOptions = useMemo(() => [
    { value: '', label: `Todas as tags (${totalGeral})` },
    ...tags.map((t: any) => {
      const qtd = quantidadesPorTag[t.id] || 0;
      return {
        value: String(t.id),
        label: `${t.nome} (${qtd.toLocaleString('pt-BR')})`,
      };
    })
  ], [tags, quantidadesPorTag, totalGeral]);

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
    setTagId('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!tagId;

  // Colunas da tabela - TAGS
  const columnsTag: Column<RelatorioTagItem>[] = [
    {
      key: 'nome',
      header: 'Tag',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: item.cor }}
          >
            <Tag className="w-3.5 h-3.5" />
            {item.nome}
          </span>
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
          <Users className="w-4 h-4 text-slate-400" />
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
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${item.percentual}%`,
                backgroundColor: item.cor,
              }}
            />
          </div>
          <span className="text-sm font-medium text-slate-600 w-12 text-right">
            {item.percentual.toFixed(1)}%
          </span>
        </div>
      ),
    },
  ];

  // Colunas da tabela - PESSOAS
  const columnsPessoa: Column<RelatorioPessoaItem>[] = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar name={item.nome} size="md" />
          <div>
            <p className="font-medium text-slate-900">{item.nome}</p>
            {item.cpf && (
              <p className="text-xs text-slate-500">CPF: {item.cpf}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'telefone',
      header: 'Telefone',
      width: '180px',
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.telefone ? (
            <>
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">{item.telefone}</span>
            </>
          ) : (
            <span className="text-sm text-slate-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      width: '250px',
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.email ? (
            <>
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700 truncate">{item.email}</span>
            </>
          ) : (
            <span className="text-sm text-slate-400">-</span>
          )}
        </div>
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
            <h1 className="text-2xl font-bold text-slate-900">
              {showingPeople ? `Pessoas com tag "${tagSelecionadaNome}"` : 'Pessoas por Tags'}
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            {showingPeople
              ? `Lista de pessoas com a tag "${tagSelecionadaNome}"`
              : 'Relatorio de cadastros agrupados por tags'}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary-50 to-emerald-50 border-primary-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              {showingPeople ? (
                <User className="w-6 h-6 text-primary-600" />
              ) : (
                <Tag className="w-6 h-6 text-primary-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-primary-600">
                {showingPeople ? 'Pessoas Encontradas' : 'Total de Tags'}
              </p>
              <p className="text-2xl font-bold text-primary-900">{totalItems}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">
                {showingPeople ? 'Total com Tag' : 'Total de Pessoas'}
              </p>
              <p className="text-2xl font-bold text-blue-900">{totalGeral.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-600">
                {showingPeople ? 'Pagina Atual' : 'Media por Tag'}
              </p>
              <p className="text-2xl font-bold text-amber-900">
                {showingPeople
                  ? `${currentPage}/${totalPages || 1}`
                  : totalItems > 0 ? Math.round(totalGeral / totalItems) : 0}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchableSelect
              label="Tag"
              value={tagId}
              onChange={(value) => {
                setTagId(value);
                setCurrentPage(1);
              }}
              options={tagsOptions}
              placeholder="Selecione uma tag..."
            />
          </div>
        </Card>
      )}

      {/* Info de filtros */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {showingPeople
              ? `${totalItems} pessoa(s) encontrada(s) com a tag "${tagSelecionadaNome}"`
              : `${totalItems} tag(s) encontrada(s)${hasActiveFilters ? ' com os filtros aplicados' : ''}`}
          </p>
        </div>
      </Card>

      {/* Tabela - Condicional */}
      {showingPeople ? (
        <DataTable
          columns={columnsPessoa}
          data={pessoaItems}
          keyExtractor={(item) => item.pessoaId}
          isLoading={isLoading}
          emptyMessage="Nenhuma pessoa encontrada"
          emptyDescription="Nao ha pessoas com esta tag"
          emptyIcon={<User className="w-12 h-12 text-slate-300" />}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      ) : (
        <DataTable
          columns={columnsTag}
          data={tagItems}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="Nenhum dado encontrado"
          emptyDescription="Nao ha pessoas cadastradas com tags"
          emptyIcon={<Tag className="w-12 h-12 text-slate-300" />}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}

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
