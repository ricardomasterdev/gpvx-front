import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPinned,
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
  Badge,
  Avatar,
} from '../../components/ui';
import type { Column } from '../../components/ui/DataTable';
import {
  relatoriosService,
  RelatorioCidadeItem,
  RelatorioPessoaItem,
} from '../../services/relatorios.service';
import { auxiliarService } from '../../services/auxiliar.service';
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

function isPessoaItem(item: RelatorioCidadeItem | RelatorioPessoaItem): item is RelatorioPessoaItem {
  return (item as RelatorioPessoaItem).tipo === 'pessoa';
}

function isCidadeItem(item: RelatorioCidadeItem | RelatorioPessoaItem): item is RelatorioCidadeItem {
  return (item as RelatorioCidadeItem).tipo === 'cidade' || !(item as RelatorioPessoaItem).pessoaId;
}

// =====================================================
// Pagina Principal
// =====================================================

export const RelatorioPessoasPorCidadePage: React.FC = () => {
  const { gabinete } = useAuthStore();

  // Estado
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('quantidade');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [estadoId, setEstadoId] = useState<string>('');
  const [municipioId, setMunicipioId] = useState<string>('');

  // Query para buscar estados
  const { data: estados = [] } = useQuery({
    queryKey: ['estados'],
    queryFn: () => auxiliarService.listarEstados(),
  });

  // Query para buscar municipios (depende do estado)
  const { data: municipios = [] } = useQuery({
    queryKey: ['municipios', estadoId],
    queryFn: () => auxiliarService.listarMunicipios(
      estadoId ? parseInt(estadoId) : undefined,
      undefined,
      100
    ),
    enabled: !!estadoId,
  });

  // Query para buscar dados de agregacao (sempre sem filtro de municipio - para o dropdown)
  const { data: agregacaoData } = useQuery({
    queryKey: ['relatorio-pessoas-por-cidade-agregacao', gabinete?.id, estadoId],
    queryFn: () => relatoriosService.pessoasPorCidade({
      page: 1,
      perPage: 1000, // Busca todos para popular o dropdown
      estadoId: estadoId ? parseInt(estadoId) : undefined,
    }),
    enabled: !!gabinete?.id,
  });

  // Query para buscar dados do relatorio (com filtro se selecionado)
  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['relatorio-pessoas-por-cidade', gabinete?.id, currentPage, pageSize, estadoId, municipioId],
    queryFn: () => relatoriosService.pessoasPorCidade({
      page: currentPage,
      perPage: pageSize,
      estadoId: estadoId ? parseInt(estadoId) : undefined,
      municipioId: municipioId || undefined,
    }),
    enabled: !!gabinete?.id,
  });

  const items = relatorioData?.items || [];
  const totalItems = relatorioData?.total || 0;
  const totalGeral = relatorioData?.totalGeral || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Detecta se esta mostrando pessoas ou cidades
  // Mostra pessoas quando municipio esta selecionado (backend retorna pessoas quando municipio_id eh passado)
  const showingPeople = municipioId && items.length > 0 && isPessoaItem(items[0]);

  // Filtra items por tipo para tipagem correta
  const cidadeItems = useMemo(() => {
    if (showingPeople) return [];
    return items.filter(isCidadeItem) as RelatorioCidadeItem[];
  }, [items, showingPeople]);

  const pessoaItems = useMemo(() => {
    if (!showingPeople) return [];
    return items.filter(isPessoaItem) as RelatorioPessoaItem[];
  }, [items, showingPeople]);

  // Mapas de quantidades (da agregacao - sempre atualizado)
  const quantidadesPorEstado = useMemo(() => {
    const mapa: Record<string, number> = {};
    const agregacaoItems = agregacaoData?.items || [];
    agregacaoItems.forEach((item: any) => {
      if (item.estadoSigla) {
        const sigla = item.estadoSigla;
        mapa[sigla] = (mapa[sigla] || 0) + (item.quantidade || 0);
      }
    });
    return mapa;
  }, [agregacaoData]);

  const quantidadesPorMunicipio = useMemo(() => {
    const mapa: Record<string, number> = {};
    const agregacaoItems = agregacaoData?.items || [];
    agregacaoItems.forEach((item: any) => {
      if (item.municipioId) {
        mapa[item.municipioId] = item.quantidade || 0;
      }
    });
    return mapa;
  }, [agregacaoData]);

  // Total geral da agregacao (para o dropdown)
  const totalGeralAgregacao = agregacaoData?.totalGeral || 0;

  // Nome da cidade selecionada
  const cidadeSelecionadaNome = useMemo(() => {
    if (!municipioId) return '';
    const cidade = municipios.find((m: any) => String(m.id) === municipioId);
    return cidade?.nome || '';
  }, [municipioId, municipios]);

  // Opcoes para os selects (com quantidade da agregacao)
  const estadosOptions = useMemo(() => [
    { value: '', label: `Todos os estados (${totalGeralAgregacao.toLocaleString('pt-BR')})` },
    ...estados.map((e: any) => {
      const qtd = quantidadesPorEstado[e.sigla] || 0;
      return {
        value: String(e.id),
        label: `${e.sigla} - ${e.nome} (${qtd.toLocaleString('pt-BR')})`,
      };
    })
  ], [estados, quantidadesPorEstado, totalGeralAgregacao]);

  const municipiosOptions = useMemo(() => {
    // Calcula total do estado selecionado
    const estadoSelecionado = estados.find((e: any) => String(e.id) === estadoId);
    const totalEstado = estadoSelecionado?.sigla
      ? quantidadesPorEstado[estadoSelecionado.sigla] || 0
      : 0;
    return [
      { value: '', label: `Todas as cidades (${totalEstado.toLocaleString('pt-BR')})` },
      ...municipios.map((m: any) => {
        const qtd = quantidadesPorMunicipio[m.id] || 0;
        return {
          value: String(m.id),
          label: `${m.nome} (${qtd.toLocaleString('pt-BR')})`,
        };
      })
    ];
  }, [municipios, quantidadesPorMunicipio, estadoId, estados, quantidadesPorEstado]);

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
    setEstadoId('');
    setMunicipioId('');
    setCurrentPage(1);
  };

  const handleEstadoChange = (value: string) => {
    setEstadoId(value);
    setMunicipioId('');
    setCurrentPage(1);
  };

  const handleMunicipioChange = (value: string) => {
    setMunicipioId(value);
    setCurrentPage(1);
  };

  const hasActiveFilters = estadoId || municipioId;

  // Colunas da tabela - CIDADES
  const columnsCidade: Column<RelatorioCidadeItem>[] = [
    {
      key: 'nome',
      header: 'Cidade',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <MapPinned className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{item.nome}</p>
            <Badge variant="default" className="mt-1">{item.estadoSigla}</Badge>
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
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPinned className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-slate-900">
              {showingPeople ? `Pessoas em "${cidadeSelecionadaNome}"` : 'Pessoas por Cidade'}
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            {showingPeople
              ? `Lista de pessoas da cidade "${cidadeSelecionadaNome}"`
              : 'Relatorio de cadastros agrupados por cidade'}
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
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              {showingPeople ? (
                <User className="w-6 h-6 text-blue-600" />
              ) : (
                <MapPinned className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-blue-600">
                {showingPeople ? 'Pessoas Encontradas' : 'Total de Cidades'}
              </p>
              <p className="text-2xl font-bold text-blue-900">{totalItems}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-emerald-600">
                {showingPeople ? 'Total na Cidade' : 'Total de Pessoas'}
              </p>
              <p className="text-2xl font-bold text-emerald-900">{totalGeral.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">
                {showingPeople ? 'Pagina Atual' : 'Media por Cidade'}
              </p>
              <p className="text-2xl font-bold text-purple-900">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchableSelect
              label="Estado"
              value={estadoId}
              onChange={handleEstadoChange}
              options={estadosOptions}
              placeholder="Selecione um estado..."
            />
            <SearchableSelect
              label="Cidade"
              value={municipioId}
              onChange={handleMunicipioChange}
              options={municipiosOptions}
              placeholder="Selecione uma cidade..."
              disabled={!estadoId}
            />
          </div>
        </Card>
      )}

      {/* Info de filtros */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {showingPeople
              ? `${totalItems} pessoa(s) na cidade "${cidadeSelecionadaNome}"`
              : `${totalItems} cidade(s) encontrada(s)${hasActiveFilters ? ' com os filtros aplicados' : ''}`}
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
          emptyDescription="Nao ha pessoas nesta cidade"
          emptyIcon={<User className="w-12 h-12 text-slate-300" />}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      ) : (
        <DataTable
          columns={columnsCidade}
          data={cidadeItems}
          keyExtractor={(item) => item.municipioId}
          isLoading={isLoading}
          emptyMessage="Nenhum dado encontrado"
          emptyDescription="Nao ha pessoas cadastradas com endereco"
          emptyIcon={<MapPinned className="w-12 h-12 text-slate-300" />}
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
