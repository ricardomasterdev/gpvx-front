import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Download,
  Users,
  BarChart3,
  Mail,
  Filter,
  X,
  Phone,
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
  RelatorioUsuarioItem,
  RelatorioPessoaItem,
} from '../../services/relatorios.service';
import { usuariosService } from '../../services/usuarios.service';
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

function isPessoaItem(item: RelatorioUsuarioItem | RelatorioPessoaItem): item is RelatorioPessoaItem {
  return (item as RelatorioPessoaItem).tipo === 'pessoa';
}

function isUsuarioItem(item: RelatorioUsuarioItem | RelatorioPessoaItem): item is RelatorioUsuarioItem {
  return (item as RelatorioUsuarioItem).tipo === 'usuario' || !(item as RelatorioPessoaItem).pessoaId;
}

// =====================================================
// Pagina Principal
// =====================================================

export const RelatorioPessoasPorUsuarioPage: React.FC = () => {
  const { gabinete } = useAuthStore();

  // Estado
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('quantidade');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [usuarioId, setUsuarioId] = useState<string>('');

  // Query para buscar usuarios
  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios-list'],
    queryFn: () => usuariosService.listar(),
  });

  const usuarios = usuariosData || [];

  // Query para buscar dados de agregacao (sempre sem filtro de usuario - para o dropdown)
  const { data: agregacaoData } = useQuery({
    queryKey: ['relatorio-pessoas-por-usuario-agregacao', gabinete?.id],
    queryFn: () => relatoriosService.pessoasPorUsuario({
      page: 1,
      perPage: 1000, // Busca todos para popular o dropdown
    }),
    enabled: !!gabinete?.id,
  });

  // Query para buscar dados (com filtro se selecionado)
  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['relatorio-pessoas-por-usuario', gabinete?.id, currentPage, pageSize, usuarioId],
    queryFn: () => relatoriosService.pessoasPorUsuario({
      page: currentPage,
      perPage: pageSize,
      usuarioId: usuarioId || undefined,
    }),
    enabled: !!gabinete?.id,
  });

  const items = relatorioData?.items || [];
  const totalItems = relatorioData?.total || 0;
  const totalGeral = relatorioData?.totalGeral || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Detecta se esta mostrando pessoas ou usuarios
  const showingPeople = usuarioId && items.length > 0 && isPessoaItem(items[0]);

  // Filtra items por tipo para tipagem correta
  const usuarioItems = useMemo(() => {
    if (showingPeople) return [];
    return items.filter(isUsuarioItem) as RelatorioUsuarioItem[];
  }, [items, showingPeople]);

  const pessoaItems = useMemo(() => {
    if (!showingPeople) return [];
    return items.filter(isPessoaItem) as RelatorioPessoaItem[];
  }, [items, showingPeople]);

  // Mapa de quantidades por usuario (da agregacao - sempre atualizado)
  const quantidadesPorUsuario = useMemo(() => {
    const mapa: Record<string, number> = {};
    const agregacaoItems = agregacaoData?.items || [];
    agregacaoItems.forEach((item: any) => {
      if (item.usuarioId) {
        mapa[item.usuarioId] = item.quantidade;
      }
    });
    return mapa;
  }, [agregacaoData]);

  // Total geral da agregacao (para o dropdown)
  const totalGeralAgregacao = agregacaoData?.totalGeral || 0;

  // Nome do usuario selecionado
  const usuarioSelecionadoNome = useMemo(() => {
    if (!usuarioId) return '';
    const usuario = usuarios.find((u: any) => String(u.id) === usuarioId);
    return usuario?.nome || '';
  }, [usuarioId, usuarios]);

  // Opcoes para os selects (com quantidade da agregacao)
  const usuariosOptions = useMemo(() => [
    { value: '', label: `Todos os usuarios (${totalGeralAgregacao.toLocaleString('pt-BR')})` },
    ...usuarios.map((u: any) => {
      const qtd = quantidadesPorUsuario[u.id] || 0;
      return {
        value: String(u.id),
        label: `${u.nome} (${qtd.toLocaleString('pt-BR')})`,
      };
    })
  ], [usuarios, quantidadesPorUsuario, totalGeralAgregacao]);

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
    setUsuarioId('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!usuarioId;

  // Colunas da tabela - USUARIOS
  const columnsUsuario: Column<RelatorioUsuarioItem>[] = [
    {
      key: 'nome',
      header: 'Usuario',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar name={item.nome} size="md" />
          <div>
            <p className="font-medium text-slate-900">{item.nome}</p>
            {item.email && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <Mail className="w-3 h-3" />
                {item.email}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'quantidade',
      header: 'Cadastros',
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
              className="h-full bg-cyan-500 rounded-full transition-all duration-300"
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
            <User className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-slate-900">
              {showingPeople ? `Cadastros de "${usuarioSelecionadoNome}"` : 'Pessoas por Usuario'}
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            {showingPeople
              ? `Lista de pessoas cadastradas por "${usuarioSelecionadoNome}"`
              : 'Relatorio de cadastros agrupados por usuario que cadastrou'}
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
        <Card className="bg-gradient-to-br from-cyan-50 to-sky-50 border-cyan-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
              <User className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-cyan-600">
                {showingPeople ? 'Pessoas Encontradas' : 'Total de Usuarios'}
              </p>
              <p className="text-2xl font-bold text-cyan-900">{totalItems}</p>
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
                {showingPeople ? 'Total do Usuario' : 'Total de Cadastros'}
              </p>
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
              <p className="text-sm text-emerald-600">
                {showingPeople ? 'Pagina Atual' : 'Media por Usuario'}
              </p>
              <p className="text-2xl font-bold text-emerald-900">
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
              label="Usuario"
              value={usuarioId}
              onChange={(value) => {
                setUsuarioId(value);
                setCurrentPage(1);
              }}
              options={usuariosOptions}
              placeholder="Selecione um usuario..."
            />
          </div>
        </Card>
      )}

      {/* Info de filtros */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {showingPeople
              ? `${totalItems} pessoa(s) cadastrada(s) por "${usuarioSelecionadoNome}"`
              : `${totalItems} usuario(s) encontrado(s)${hasActiveFilters ? ' com os filtros aplicados' : ''}`}
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
          emptyDescription="Nao ha pessoas cadastradas por este usuario"
          emptyIcon={<User className="w-12 h-12 text-slate-300" />}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      ) : (
        <DataTable
          columns={columnsUsuario}
          data={usuarioItems}
          keyExtractor={(item) => item.usuarioId}
          isLoading={isLoading}
          emptyMessage="Nenhum dado encontrado"
          emptyDescription="Nao ha cadastros registrados por usuarios"
          emptyIcon={<User className="w-12 h-12 text-slate-300" />}
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
