import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Download,
  Users,
  BarChart3,
  Filter,
  X,
  Building2,
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
  RelatorioRegiaoItem,
  RelatorioPessoaItem,
} from '../../services/relatorios.service';
import { regioesService } from '../../services/regioes.service';
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

function isPessoaItem(item: RelatorioRegiaoItem | RelatorioPessoaItem): item is RelatorioPessoaItem {
  return (item as RelatorioPessoaItem).tipo === 'pessoa';
}

function isRegiaoItem(item: RelatorioRegiaoItem | RelatorioPessoaItem): item is RelatorioRegiaoItem {
  return (item as RelatorioRegiaoItem).tipo === 'regiao' || !(item as RelatorioPessoaItem).pessoaId;
}

// =====================================================
// Pagina Principal
// =====================================================

export const RelatorioPessoasPorRegiaoPage: React.FC = () => {
  const { gabinete } = useAuthStore();

  // Estado
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('quantidade');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [regiaoId, setRegiaoId] = useState<string>('');
  const [municipioId, setMunicipioId] = useState<string>('');

  // Query para buscar regioes
  const { data: regioesData } = useQuery({
    queryKey: ['regioes-list'],
    queryFn: () => regioesService.listar(),
  });

  const regioes = regioesData || [];

  // Query para buscar dados do relatorio
  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['relatorio-pessoas-por-regiao', gabinete?.id, currentPage, pageSize, regiaoId, municipioId],
    queryFn: () => relatoriosService.pessoasPorRegiao({
      page: currentPage,
      perPage: pageSize,
      regiaoId: regiaoId || undefined,
      municipioId: municipioId || undefined,
    }),
    enabled: !!gabinete?.id,
  });

  const items = relatorioData?.items || [];
  const totalItems = relatorioData?.total || 0;
  const totalGeral = relatorioData?.totalGeral || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Detecta se esta mostrando pessoas ou regioes
  const showingPeople = municipioId && items.length > 0 && isPessoaItem(items[0]);

  // Filtra items por tipo para tipagem correta
  const regiaoItems = useMemo(() => {
    if (showingPeople) return [];
    return items.filter(isRegiaoItem) as RelatorioRegiaoItem[];
  }, [items, showingPeople]);

  const pessoaItems = useMemo(() => {
    if (!showingPeople) return [];
    return items.filter(isPessoaItem) as RelatorioPessoaItem[];
  }, [items, showingPeople]);

  // Mapa de quantidades por regiao (do relatorio)
  const quantidadesPorRegiao = useMemo(() => {
    const mapa: Record<string, number> = {};
    regiaoItems.forEach((item) => {
      mapa[item.regiaoId] = item.quantidade;
    });
    return mapa;
  }, [regiaoItems]);

  // Cidades da regiao selecionada
  const cidadesDaRegiao = useMemo(() => {
    if (!regiaoId) return [];
    const regiaoSelecionada = regiaoItems.find(item => item.regiaoId === regiaoId);
    return regiaoSelecionada?.cidades || [];
  }, [regiaoId, regiaoItems]);

  // Opcoes para os selects (com quantidade)
  const regioesOptions = useMemo(() => [
    { value: '', label: `Todas as regioes (${totalGeral.toLocaleString('pt-BR')})` },
    ...regioes.map((r: any) => {
      const qtd = quantidadesPorRegiao[r.id] || 0;
      return {
        value: String(r.id),
        label: `${r.nome} (${qtd.toLocaleString('pt-BR')})`,
      };
    })
  ], [regioes, quantidadesPorRegiao, totalGeral]);

  // Opcoes de cidades (aparecem quando uma regiao e selecionada)
  const cidadesOptions = useMemo(() => {
    if (!regiaoId) return [];

    // Total da regiao selecionada
    const totalRegiao = quantidadesPorRegiao[regiaoId] || 0;

    return [
      { value: '', label: `Todas as cidades (${totalRegiao.toLocaleString('pt-BR')})` },
      ...cidadesDaRegiao.map((c) => ({
        value: String(c.municipioId),
        label: `${c.nome} (${c.quantidade.toLocaleString('pt-BR')})`,
      }))
    ];
  }, [regiaoId, cidadesDaRegiao, quantidadesPorRegiao]);

  // Nome da cidade selecionada
  const cidadeSelecionadaNome = useMemo(() => {
    if (!municipioId) return '';
    const cidade = cidadesDaRegiao.find(c => c.municipioId === municipioId);
    return cidade?.nome || '';
  }, [municipioId, cidadesDaRegiao]);

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
    setRegiaoId('');
    setMunicipioId('');
    setCurrentPage(1);
  };

  const handleRegiaoChange = (value: string) => {
    setRegiaoId(value);
    setMunicipioId('');
    setCurrentPage(1);
  };

  const handleMunicipioChange = (value: string) => {
    setMunicipioId(value);
    setCurrentPage(1);
  };

  const hasActiveFilters = !!regiaoId || !!municipioId;

  // Colunas da tabela - REGIOES
  const columnsRegiao: Column<RelatorioRegiaoItem>[] = [
    {
      key: 'nome',
      header: 'Regiao',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{item.nome}</p>
            {item.cidades && item.cidades.length > 0 && (
              <p className="text-xs text-slate-500">{item.cidades.length} cidade(s)</p>
            )}
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
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
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
            <MapPin className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-slate-900">
              {showingPeople ? `Pessoas em ${cidadeSelecionadaNome}` : 'Pessoas por Regiao'}
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            {showingPeople
              ? `Lista de pessoas cadastradas na cidade de ${cidadeSelecionadaNome}`
              : 'Relatorio de cadastros agrupados por regiao (composta por cidades)'}
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
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              {showingPeople ? (
                <User className="w-6 h-6 text-emerald-600" />
              ) : (
                <MapPin className="w-6 h-6 text-emerald-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-emerald-600">
                {showingPeople ? 'Pessoas Encontradas' : 'Total de Regioes'}
              </p>
              <p className="text-2xl font-bold text-emerald-900">{totalItems}</p>
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
                {showingPeople ? 'Total na Cidade' : 'Total de Pessoas'}
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
                {showingPeople ? 'Pagina Atual' : 'Media por Regiao'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchableSelect
              label="Regiao"
              value={regiaoId}
              onChange={handleRegiaoChange}
              options={regioesOptions}
              placeholder="Selecione uma regiao..."
            />
            <SearchableSelect
              label="Cidade"
              value={municipioId}
              onChange={handleMunicipioChange}
              options={cidadesOptions}
              placeholder="Selecione uma cidade..."
              disabled={!regiaoId}
            />
          </div>
          {regiaoId && cidadesDaRegiao.length > 0 && !municipioId && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Cidades da regiao selecionada (clique para ver pessoas)
              </h4>
              <div className="flex flex-wrap gap-2">
                {cidadesDaRegiao.slice(0, 10).map((cidade) => (
                  <button
                    key={cidade.municipioId}
                    onClick={() => handleMunicipioChange(cidade.municipioId)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                      municipioId === cidade.municipioId
                        ? "bg-primary-100 border-primary-300 text-primary-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {cidade.nome} ({cidade.quantidade.toLocaleString('pt-BR')})
                  </button>
                ))}
                {cidadesDaRegiao.length > 10 && (
                  <span className="px-3 py-1.5 text-sm text-slate-500">
                    +{cidadesDaRegiao.length - 10} mais...
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Info de filtros */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {showingPeople
              ? `${totalItems} pessoa(s) encontrada(s) em ${cidadeSelecionadaNome}`
              : `${totalItems} regiao(oes) encontrada(s)${hasActiveFilters ? ' com os filtros aplicados' : ''}`}
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
          emptyDescription="Nao ha pessoas cadastradas nesta cidade"
          emptyIcon={<User className="w-12 h-12 text-slate-300" />}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      ) : (
        <DataTable
          columns={columnsRegiao}
          data={regiaoItems}
          keyExtractor={(item) => item.regiaoId}
          isLoading={isLoading}
          emptyMessage="Nenhum dado encontrado"
          emptyDescription="Nao ha pessoas cadastradas em regioes"
          emptyIcon={<MapPin className="w-12 h-12 text-slate-300" />}
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
