import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building,
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
import { WhatsAppSendMessageModal } from '../../components/whatsapp';
import type { Column } from '../../components/ui/DataTable';

// Icone do WhatsApp
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
import {
  relatoriosService,
  RelatorioSubgabineteItem,
  RelatorioPessoaItem,
} from '../../services/relatorios.service';
import { adminService } from '../../services/admin.service';
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

function isPessoaItem(item: RelatorioSubgabineteItem | RelatorioPessoaItem): item is RelatorioPessoaItem {
  return (item as RelatorioPessoaItem).tipo === 'pessoa';
}

function isSubgabineteItem(item: RelatorioSubgabineteItem | RelatorioPessoaItem): item is RelatorioSubgabineteItem {
  return (item as RelatorioSubgabineteItem).tipo === 'subgabinete' || !(item as RelatorioPessoaItem).pessoaId;
}

// =====================================================
// Pagina Principal
// =====================================================

export const RelatorioPessoasPorSubgabinetePage: React.FC = () => {
  const { gabinete } = useAuthStore();

  // Estado
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('quantidade');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(true);

  // Filtros
  const [subgabineteId, setSubgabineteId] = useState<string>('');

  // Estado do modal de WhatsApp
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppModalPessoa, setWhatsAppModalPessoa] = useState<RelatorioPessoaItem | null>(null);

  // Query para buscar subgabinetes
  const { data: subgabinetesData } = useQuery({
    queryKey: ['subgabinetes-list'],
    queryFn: () => adminService.listarSubgabinetes(),
  });

  const subgabinetes = subgabinetesData || [];

  // Query para buscar dados de agregacao (sempre sem filtro - para o dropdown)
  const { data: agregacaoData } = useQuery({
    queryKey: ['relatorio-pessoas-por-subgabinete-agregacao', gabinete?.id],
    queryFn: () => relatoriosService.pessoasPorSubgabinete({
      page: 1,
      perPage: 1000, // Busca todos para popular o dropdown
    }),
    enabled: !!gabinete?.id,
  });

  // Query para buscar dados (com filtro se selecionado)
  const { data: relatorioData, isLoading } = useQuery({
    queryKey: ['relatorio-pessoas-por-subgabinete', gabinete?.id, currentPage, pageSize, subgabineteId],
    queryFn: () => relatoriosService.pessoasPorSubgabinete({
      page: currentPage,
      perPage: pageSize,
      subgabineteId: subgabineteId || undefined,
    }),
    enabled: !!gabinete?.id,
  });

  const items = relatorioData?.items || [];
  const totalItems = relatorioData?.total || 0;
  const totalGeral = relatorioData?.totalGeral || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Detecta se esta mostrando pessoas ou subgabinetes
  const showingPeople = subgabineteId && items.length > 0 && isPessoaItem(items[0]);

  // Filtra items por tipo para tipagem correta
  const subgabineteItems = useMemo(() => {
    if (showingPeople) return [];
    return items.filter(isSubgabineteItem) as RelatorioSubgabineteItem[];
  }, [items, showingPeople]);

  const pessoaItems = useMemo(() => {
    if (!showingPeople) return [];
    return items.filter(isPessoaItem) as RelatorioPessoaItem[];
  }, [items, showingPeople]);

  // Mapa de quantidades por subgabinete (da agregacao - sempre atualizado)
  const quantidadesPorSubgabinete = useMemo(() => {
    const mapa: Record<string, number> = {};
    const agregacaoItems = agregacaoData?.items || [];
    agregacaoItems.forEach((item: any) => {
      if (item.subgabineteId) {
        mapa[item.subgabineteId] = item.quantidade;
      }
    });
    return mapa;
  }, [agregacaoData]);

  // Total geral da agregacao (para o dropdown)
  const totalGeralAgregacao = agregacaoData?.totalGeral || 0;

  // Nome do subgabinete selecionado
  const subgabineteSelecionadoNome = useMemo(() => {
    if (!subgabineteId) return '';
    const subgabinete = subgabinetes.find((s: any) => String(s.id) === subgabineteId);
    return subgabinete?.nome || '';
  }, [subgabineteId, subgabinetes]);

  // Opcoes para os selects (com quantidade da agregacao)
  const subgabinetesOptions = useMemo(() => [
    { value: '', label: `Todos os subgabinetes (${totalGeralAgregacao.toLocaleString('pt-BR')})` },
    ...subgabinetes.map((s: any) => {
      const qtd = quantidadesPorSubgabinete[s.id] || 0;
      return {
        value: String(s.id),
        label: `${s.nome} (${qtd.toLocaleString('pt-BR')})`,
      };
    })
  ], [subgabinetes, quantidadesPorSubgabinete, totalGeralAgregacao]);

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
    setSubgabineteId('');
    setCurrentPage(1);
  };

  // Handlers do modal de WhatsApp
  const handleOpenWhatsAppModal = useCallback((pessoa: RelatorioPessoaItem) => {
    setWhatsAppModalPessoa(pessoa);
    setWhatsAppModalOpen(true);
  }, []);

  const handleCloseWhatsAppModal = () => {
    setWhatsAppModalOpen(false);
    setWhatsAppModalPessoa(null);
  };

  const hasActiveFilters = !!subgabineteId;

  // Colunas da tabela - SUBGABINETES
  const columnsSubgabinete: Column<RelatorioSubgabineteItem>[] = [
    {
      key: 'nome',
      header: 'Subgabinete',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Building className="w-5 h-5 text-indigo-600" />
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
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
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
      width: '200px',
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
    {
      key: 'acoes',
      header: 'Acoes',
      width: '100px',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          {item.telefone && (
            <button
              onClick={() => handleOpenWhatsAppModal(item)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#25D366] hover:text-[#128C7E] hover:bg-green-50 transition-colors"
              title="Enviar WhatsApp"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </button>
          )}
          {item.telefone && (
            <a
              href={`tel:${item.telefone}`}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="Ligar"
            >
              <Phone className="w-4 h-4" />
            </a>
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
            <Building className="w-6 h-6 text-primary-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {showingPeople ? `Pessoas em "${subgabineteSelecionadoNome}"` : 'Pessoas por Subgabinete'}
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            {showingPeople
              ? `Lista de pessoas do subgabinete "${subgabineteSelecionadoNome}"`
              : 'Relatorio de cadastros agrupados por subgabinete'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              {showingPeople ? (
                <User className="w-6 h-6 text-indigo-600" />
              ) : (
                <Building className="w-6 h-6 text-indigo-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-indigo-600">
                {showingPeople ? 'Pessoas Encontradas' : 'Total de Subgabinetes'}
              </p>
              <p className="text-2xl font-bold text-indigo-900">{totalItems}</p>
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
                {showingPeople ? 'Total no Subgabinete' : 'Total de Pessoas'}
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
                {showingPeople ? 'Pagina Atual' : 'Media por Subgabinete'}
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
        <Card className="border-orange-200 bg-orange-50/50">
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
              label="Subgabinete"
              className="w-full sm:w-auto sm:min-w-[250px]"
              value={subgabineteId}
              onChange={(value) => {
                setSubgabineteId(value);
                setCurrentPage(1);
              }}
              options={subgabinetesOptions}
              placeholder="Selecione um subgabinete..."
            />
          </div>
        </Card>
      )}

      {/* Info de filtros */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {showingPeople
              ? `${totalItems} pessoa(s) no subgabinete "${subgabineteSelecionadoNome}"`
              : `${totalItems} subgabinete(s) encontrado(s)${hasActiveFilters ? ' com os filtros aplicados' : ''}`}
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
          emptyDescription="Nao ha pessoas neste subgabinete"
          emptyIcon={<User className="w-12 h-12 text-slate-300" />}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      ) : (
        <DataTable
          columns={columnsSubgabinete}
          data={subgabineteItems}
          keyExtractor={(item) => item.subgabineteId}
          isLoading={isLoading}
          emptyMessage="Nenhum dado encontrado"
          emptyDescription="Nao ha pessoas vinculadas a subgabinetes"
          emptyIcon={<Building className="w-12 h-12 text-slate-300" />}
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

      {/* Modal de WhatsApp */}
      {whatsAppModalPessoa && (
        <WhatsAppSendMessageModal
          isOpen={whatsAppModalOpen}
          onClose={handleCloseWhatsAppModal}
          pessoa={{
            id: whatsAppModalPessoa.pessoaId,
            nome: whatsAppModalPessoa.nome,
            whatsapp: whatsAppModalPessoa.telefone,
            celular: whatsAppModalPessoa.telefone,
          }}
        />
      )}
    </div>
  );
};
