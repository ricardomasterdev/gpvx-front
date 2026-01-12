import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UserCheck,
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
  Badge,
} from '../../components/ui';
import type { Column } from '../../components/ui/DataTable';
import {
  relatoriosService,
  RelatorioLiderancaItem,
  RelatorioPessoaItem,
} from '../../services/relatorios.service';
import { pessoasService } from '../../services/pessoas.service';
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

function isPessoaItem(item: RelatorioLiderancaItem | RelatorioPessoaItem): item is RelatorioPessoaItem {
  return (item as RelatorioPessoaItem).tipo === 'pessoa';
}

function isLiderancaItem(item: RelatorioLiderancaItem | RelatorioPessoaItem): item is RelatorioLiderancaItem {
  return (item as RelatorioLiderancaItem).tipo === 'lideranca' || !(item as RelatorioPessoaItem).pessoaId;
}

// =====================================================
// Pagina Principal
// =====================================================

export const RelatorioPessoasPorLiderancaPage: React.FC = () => {
  const { gabinete } = useAuthStore();

  // Estado
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('quantidade');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [liderancaId, setLiderancaId] = useState<string>('');

  // Query para buscar liderancas
  const { data: liderancasData } = useQuery({
    queryKey: ['liderancas-list'],
    queryFn: () => pessoasService.buscarLiderancas(),
  });

  const liderancas = liderancasData || [];

  // Query para buscar dados de agregacao (sempre sem filtro - para o dropdown)
  const { data: agregacaoData } = useQuery({
    queryKey: ['relatorio-pessoas-por-lideranca-agregacao', gabinete?.id],
    queryFn: () => relatoriosService.pessoasPorLideranca({
      page: 1,
      perPage: 1000, // Busca todos para popular o dropdown
    }),
    enabled: !!gabinete?.id,
  });

  // Query para buscar dados (com filtro se selecionado)
  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['relatorio-pessoas-por-lideranca', gabinete?.id, currentPage, pageSize, liderancaId],
    queryFn: () => relatoriosService.pessoasPorLideranca({
      page: currentPage,
      perPage: pageSize,
      liderancaId: liderancaId || undefined,
    }),
    enabled: !!gabinete?.id,
  });

  const items = relatorioData?.items || [];
  const totalItems = relatorioData?.total || 0;
  const totalGeral = relatorioData?.totalGeral || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Detecta se esta mostrando pessoas ou liderancas
  const showingPeople = liderancaId && items.length > 0 && isPessoaItem(items[0]);

  // Filtra items por tipo para tipagem correta
  const liderancaItems = useMemo(() => {
    if (showingPeople) return [];
    return items.filter(isLiderancaItem) as RelatorioLiderancaItem[];
  }, [items, showingPeople]);

  const pessoaItems = useMemo(() => {
    if (!showingPeople) return [];
    return items.filter(isPessoaItem) as RelatorioPessoaItem[];
  }, [items, showingPeople]);

  // Mapa de quantidades por lideranca (da agregacao - sempre atualizado)
  const quantidadesPorLideranca = useMemo(() => {
    const mapa: Record<string, number> = {};
    const agregacaoItems = agregacaoData?.items || [];
    agregacaoItems.forEach((item: any) => {
      if (item.liderancaId) {
        mapa[item.liderancaId] = item.quantidade;
      }
    });
    return mapa;
  }, [agregacaoData]);

  // Total geral da agregacao (para o dropdown)
  const totalGeralAgregacao = agregacaoData?.totalGeral || 0;

  // Nome da lideranca selecionada
  const liderancaSelecionadaNome = useMemo(() => {
    if (!liderancaId) return '';
    const lideranca = liderancas.find((l: any) => String(l.id) === liderancaId);
    return lideranca?.nome || '';
  }, [liderancaId, liderancas]);

  // Opcoes para os selects (com quantidade da agregacao)
  const liderancasOptions = useMemo(() => [
    { value: '', label: `Todas as liderancas (${totalGeralAgregacao.toLocaleString('pt-BR')})` },
    ...liderancas.map((l: any) => {
      const qtd = quantidadesPorLideranca[l.id] || 0;
      return {
        value: String(l.id),
        label: `${l.nome} (${qtd.toLocaleString('pt-BR')})`,
      };
    })
  ], [liderancas, quantidadesPorLideranca, totalGeralAgregacao]);

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
    setLiderancaId('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!liderancaId;

  // Colunas da tabela - LIDERANCAS
  const columnsLideranca: Column<RelatorioLiderancaItem>[] = [
    {
      key: 'nome',
      header: 'Lideranca',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar name={item.nome} size="md" />
          <div>
            <p className="font-medium text-slate-900">{item.nome}</p>
            <Badge variant="info" className="mt-1">
              {item.totalLiderados} liderado(s)
            </Badge>
          </div>
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
              className="h-full bg-violet-500 rounded-full transition-all duration-300"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {showingPeople ? `Liderados de "${liderancaSelecionadaNome}"` : 'Pessoas por Lideranca'}
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            {showingPeople
              ? `Lista de pessoas lideradas por "${liderancaSelecionadaNome}"`
              : 'Relatorio de cadastros agrupados por lideranca'}
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
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              {showingPeople ? (
                <User className="w-6 h-6 text-violet-600" />
              ) : (
                <UserCheck className="w-6 h-6 text-violet-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-violet-600">
                {showingPeople ? 'Pessoas Encontradas' : 'Total de Liderancas'}
              </p>
              <p className="text-2xl font-bold text-violet-900">{totalItems}</p>
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
                {showingPeople ? 'Total Liderados' : 'Total de Pessoas'}
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
                {showingPeople ? 'Pagina Atual' : 'Media por Lideranca'}
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
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchableSelect
              label="Lideranca"
              className="w-full sm:w-auto sm:min-w-[250px]"
              value={liderancaId}
              onChange={(value) => {
                setLiderancaId(value);
                setCurrentPage(1);
              }}
              options={liderancasOptions}
              placeholder="Selecione uma lideranca..."
            />
          </div>
        </Card>
      )}

      {/* Info de filtros */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {showingPeople
              ? `${totalItems} pessoa(s) liderada(s) por "${liderancaSelecionadaNome}"`
              : `${totalItems} lideranca(s) encontrada(s)${hasActiveFilters ? ' com os filtros aplicados' : ''}`}
          </p>
        </div>
      </Card>

      {/* Tabela - Condicional */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[600px] px-4 sm:px-0">
      {showingPeople ? (
        <DataTable
          columns={columnsPessoa}
          data={pessoaItems}
          keyExtractor={(item) => item.pessoaId}
          isLoading={isLoading}
          emptyMessage="Nenhuma pessoa encontrada"
          emptyDescription="Nao ha pessoas lideradas por esta lideranca"
          emptyIcon={<User className="w-12 h-12 text-slate-300" />}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      ) : (
        <DataTable
          columns={columnsLideranca}
          data={liderancaItems}
          keyExtractor={(item) => item.liderancaId}
          isLoading={isLoading}
          emptyMessage="Nenhum dado encontrado"
          emptyDescription="Nao ha pessoas vinculadas a liderancas"
          emptyIcon={<UserCheck className="w-12 h-12 text-slate-300" />}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}
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
