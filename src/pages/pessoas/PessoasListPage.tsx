import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  User,
  Tag,
  Search,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Button,
  Card,
  Badge,
  DataTable,
  Pagination,
  SearchFilter,
  Modal,
  ConfirmModal,
} from '../../components/ui';
import { PessoaFormModal } from '../../components/pessoas/PessoaFormModal';
import { WhatsAppSendMessageModal } from '../../components/whatsapp';
import type { Column } from '../../components/ui/DataTable';
import type { FilterConfig } from '../../components/ui/SearchFilter';
import { pessoasService, PessoaListItem } from '../../services/pessoas.service';
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
  pessoa: PessoaListItem;
  onEdit: (pessoa: PessoaListItem) => void;
  onToggleStatus: (pessoa: PessoaListItem) => void;
  onDelete: (pessoa: PessoaListItem) => void;
  onAddTag: (pessoa: PessoaListItem) => void;
  onWhatsAppClick: (pessoa: PessoaListItem) => void;
}

// Icone do WhatsApp
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const ActionButtons: React.FC<ActionButtonsProps> = ({
  pessoa,
  onEdit,
  onToggleStatus,
  onDelete,
  onAddTag,
  onWhatsAppClick,
}) => {
  const hasWhatsApp = pessoa.whatsapp || pessoa.celular;

  return (
    <div className="flex items-center gap-1">
      {/* Adicionar Tag */}
      <button
        onClick={() => onAddTag(pessoa)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-colors relative"
        title="Gerenciar Tags"
      >
        <Tag className="w-4 h-4" />
        <Plus className="w-2.5 h-2.5 absolute top-2 right-2 bg-purple-500 text-white rounded-full" />
      </button>

      {/* WhatsApp */}
      {hasWhatsApp && (
        <button
          onClick={() => onWhatsAppClick(pessoa)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#25D366] hover:text-[#128C7E] hover:bg-green-50 transition-colors"
          title="Enviar WhatsApp"
        >
          <WhatsAppIcon className="w-5 h-5" />
        </button>
      )}

      {/* Telefone */}
      {pessoa.celular && (
        <a
          href={`tel:${pessoa.celular}`}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          title="Ligar"
        >
          <Phone className="w-4 h-4" />
        </a>
      )}

      {/* Editar */}
      <button
        onClick={() => onEdit(pessoa)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Ativar/Desativar */}
      <button
        onClick={() => onToggleStatus(pessoa)}
        className={cn(
          'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors',
          pessoa.ativo
            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
            : 'text-green-500 hover:text-green-600 hover:bg-green-50'
        )}
        title={pessoa.ativo ? 'Desativar' : 'Ativar'}
      >
        {pessoa.ativo ? (
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

export const PessoasListPage: React.FC = () => {
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
  const [editingPessoa, setEditingPessoa] = useState<PessoaListItem | null>(null);

  // Estado do modal de tags
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [tagsModalPessoa, setTagsModalPessoa] = useState<PessoaListItem | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const MAX_TAGS_VISIBLE = 8;

  // Estado do modal de confirmacao
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pessoaToToggle, setPessoaToToggle] = useState<PessoaListItem | null>(null);

  // Estado do modal de WhatsApp
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppModalPessoa, setWhatsAppModalPessoa] = useState<PessoaListItem | null>(null);

  // Query para buscar pessoas
  const { data: pessoasData, isLoading } = useQuery({
    queryKey: ['pessoas', gabinete?.id, currentPage, pageSize, searchQuery, filters],
    queryFn: () => pessoasService.listar({
      page: currentPage,
      perPage: pageSize,
      search: searchQuery || undefined,
      ativo: filters.ativo,
    }),
    enabled: !!gabinete?.id,
  });

  const pessoas = pessoasData?.items || [];
  const totalItems = pessoasData?.total || 0;
  const totalPages = pessoasData?.pages || 1;

  // Query para buscar tags disponiveis
  const { data: tagsData, isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags-ativas'],
    queryFn: () => tagsService.listar({ ativo: true, perPage: 100 }),
    enabled: tagsModalOpen,
  });
  const tagsDisponiveis = tagsData?.items || [];

  // Mutation para ativar/desativar
  const toggleStatusMutation = useMutation({
    mutationFn: async (pessoa: PessoaListItem) => {
      if (pessoa.ativo) {
        return pessoasService.desativar(pessoa.id);
      } else {
        return pessoasService.ativar(pessoa.id);
      }
    },
    onSuccess: (_, pessoa) => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['gabinete-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['mapa-cadastros-cidades'] });
      queryClient.invalidateQueries({ queryKey: ['mapa-cadastros-setores'] });
      toast.success(
        pessoa.ativo
          ? `"${pessoa.nome}" desativado`
          : `"${pessoa.nome}" ativado`
      );
    },
    onError: () => {
      toast.error('Erro ao alterar status');
    },
  });

  // Mutation para excluir
  const deleteMutation = useMutation({
    mutationFn: (id: string) => pessoasService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['gabinete-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['mapa-cadastros-cidades'] });
      queryClient.invalidateQueries({ queryKey: ['mapa-cadastros-setores'] });
      toast.success('Pessoa removida com sucesso');
    },
    onError: () => {
      toast.error('Erro ao remover pessoa');
    },
  });

  // Mutation para salvar tags
  const saveTagsMutation = useMutation({
    mutationFn: ({ pessoaId, tagIds }: { pessoaId: string; tagIds: string[] }) =>
      pessoasService.atualizar(pessoaId, { tagIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['gabinete-dashboard'] });
      toast.success('Tags atualizadas com sucesso!');
      handleCloseTagsModal();
    },
    onError: () => {
      toast.error('Erro ao atualizar tags');
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
    setEditingPessoa(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (pessoa: PessoaListItem) => {
    setEditingPessoa(pessoa);
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setEditingPessoa(null);
  };

  // Handler para abrir modal de edicao pelo ID (usado quando WhatsApp duplicado)
  const handleEditPessoaById = useCallback(async (pessoaId: string) => {
    try {
      const pessoaData = await pessoasService.obter(pessoaId);
      // Converte PessoaResponse para PessoaListItem (campos basicos)
      const pessoaListItem: PessoaListItem = {
        id: pessoaData.id,
        nome: pessoaData.nome,
        genero: pessoaData.genero,
        cpf: pessoaData.cpf,
        celular: pessoaData.celular,
        whatsapp: pessoaData.whatsapp,
        email: pessoaData.email,
        estadoId: pessoaData.estadoId,
        municipioId: pessoaData.municipioId,
        setorId: pessoaData.setorId,
        bairro: pessoaData.bairro,
        totalDemandas: pessoaData.totalDemandas,
        ativo: pessoaData.ativo,
        tags: pessoaData.tags,
      };
      setEditingPessoa(pessoaListItem);
      setFormModalOpen(true);
    } catch (error) {
      toast.error('Erro ao carregar dados da pessoa');
    }
  }, []);

  const handleDelete = (pessoa: PessoaListItem) => {
    if (confirm(`Tem certeza que deseja remover "${pessoa.nome}"?`)) {
      deleteMutation.mutate(pessoa.id);
    }
  };

  // Handlers do modal de confirmacao (ativar/desativar)
  const handleToggleStatus = (pessoa: PessoaListItem) => {
    setPessoaToToggle(pessoa);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggle = () => {
    if (pessoaToToggle) {
      toggleStatusMutation.mutate(pessoaToToggle, {
        onSuccess: () => {
          setConfirmModalOpen(false);
          setPessoaToToggle(null);
        },
      });
    }
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setPessoaToToggle(null);
  };

  // Handlers do modal de tags
  const handleOpenTagsModal = (pessoa: PessoaListItem) => {
    setTagsModalPessoa(pessoa);
    setSelectedTags(pessoa.tags?.map(t => t.id) || []);
    setTagSearch('');
    setShowAllTags(false);
    setTagsModalOpen(true);
  };

  const handleCloseTagsModal = () => {
    setTagsModalOpen(false);
    setTagsModalPessoa(null);
    setSelectedTags([]);
    setTagSearch('');
    setShowAllTags(false);
  };

  const handleSaveTags = () => {
    if (tagsModalPessoa) {
      saveTagsMutation.mutate({
        pessoaId: tagsModalPessoa.id,
        tagIds: selectedTags,
      });
    }
  };

  // Handlers do modal de WhatsApp
  const handleOpenWhatsAppModal = useCallback((pessoa: PessoaListItem) => {
    setWhatsAppModalPessoa(pessoa);
    setWhatsAppModalOpen(true);
  }, []);

  const handleCloseWhatsAppModal = () => {
    setWhatsAppModalOpen(false);
    setWhatsAppModalPessoa(null);
  };

  // Colunas da tabela
  const columns: Column<PessoaListItem>[] = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (pessoa) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-gradient-to-br from-primary-400 to-emerald-500">
            {pessoa.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900">{pessoa.nome}</p>
            {pessoa.cpf && (
              <p className="text-xs text-slate-500">{pessoa.cpf}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      width: '120px',
      align: 'center',
      render: (pessoa) => (
        pessoa.tags && pessoa.tags.length > 0 ? (
          <div className="flex items-center justify-center gap-1.5">
            {pessoa.tags.map((tag) => (
              <div
                key={tag.id}
                className="group relative"
              >
                <div
                  className="w-6 h-6 rounded-full shadow-sm cursor-default transition-transform hover:scale-125 ring-2 ring-white flex items-center justify-center"
                  style={{ backgroundColor: tag.cor }}
                >
                  <Tag className="w-3 h-3 text-white" />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-max">
                  <p className="text-sm font-medium text-white">{tag.nome}</p>
                  {tag.descricao && (
                    <p className="text-xs text-slate-300 mt-0.5">{tag.descricao}</p>
                  )}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 text-sm">-</span>
        )
      ),
    },
    {
      key: 'contato',
      header: 'Contato',
      render: (pessoa) => (
        <div className="space-y-1">
          {pessoa.celular && (
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Phone className="w-3 h-3" />
              {pessoa.celular}
            </div>
          )}
          {pessoa.email && (
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Mail className="w-3 h-3" />
              <span className="truncate max-w-[180px]">{pessoa.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'localizacao',
      header: 'Localizacao',
      render: (pessoa) => (
        pessoa.municipioNome || pessoa.estadoSigla || pessoa.setorNome ? (
          <div className="space-y-1">
            {pessoa.municipioNome && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <MapPin className="w-3 h-3" />
                {pessoa.municipioNome}{pessoa.estadoSigla && ` - ${pessoa.estadoSigla}`}
              </div>
            )}
            {pessoa.setorNome && (
              <div className="text-xs text-slate-500">
                Setor: {pessoa.setorNome}
              </div>
            )}
          </div>
        ) : (
          <span className="text-slate-400 text-sm">-</span>
        )
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      align: 'center',
      render: (pessoa) => (
        <Badge variant={pessoa.ativo ? 'success' : 'default'}>
          {pessoa.ativo ? 'Ativo' : 'Inativo'}
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
            <Users className="w-6 h-6 text-primary-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Pessoas</h1>
          </div>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Gerencie as pessoas cadastradas no gabinete
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenNewModal}
          className="w-full sm:w-auto"
        >
          Nova Pessoa
        </Button>
      </div>

      {/* Filtros e busca */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchFilter
            placeholder="Buscar por nome, CPF, celular, email..."
            value={searchQuery}
            onSearch={handleSearch}
            filters={FILTERS}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            className="w-full sm:w-auto min-w-0 sm:max-w-md"
          />
          <p className="text-sm text-slate-500 sm:ml-auto">
            {totalItems} pessoa(s) encontrada(s)
          </p>
        </div>
      </Card>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={pessoas}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhuma pessoa encontrada"
        emptyDescription="Cadastre uma nova pessoa para comecar"
        emptyIcon={<Users className="w-12 h-12 text-slate-300" />}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        rowClassName={(pessoa) =>
          !pessoa.ativo ? 'bg-slate-50 opacity-75' : ''
        }
        actions={(pessoa) => (
          <ActionButtons
            pessoa={pessoa}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onAddTag={handleOpenTagsModal}
            onWhatsAppClick={handleOpenWhatsAppModal}
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
      <PessoaFormModal
        isOpen={formModalOpen}
        onClose={handleCloseFormModal}
        pessoa={editingPessoa}
        onEditPessoa={handleEditPessoaById}
      />

      {/* Modal de confirmacao ativar/desativar */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmToggle}
        title={pessoaToToggle?.ativo ? 'Desativar Pessoa' : 'Ativar Pessoa'}
        message={
          <>
            Tem certeza que deseja {pessoaToToggle?.ativo ? 'desativar' : 'ativar'}{' '}
            <strong className="text-slate-900">"{pessoaToToggle?.nome}"</strong>?
            {pessoaToToggle?.ativo && (
              <span className="text-sm text-slate-400 mt-2 block">
                A pessoa nao aparecera mais nas listagens ativas.
              </span>
            )}
          </>
        }
        confirmText={pessoaToToggle?.ativo ? 'Sim, Desativar' : 'Sim, Ativar'}
        cancelText="Cancelar"
        variant={pessoaToToggle?.ativo ? 'warning' : 'success'}
        isLoading={toggleStatusMutation.isPending}
      />

      {/* Modal de tags */}
      <Modal
        isOpen={tagsModalOpen}
        onClose={handleCloseTagsModal}
        title={`Tags - ${tagsModalPessoa?.nome || ''}`}
        size="md"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-slate-500">
              Selecione as tags para categorizar esta pessoa
            </p>
          </div>

          {/* Lista de tags */}
          {isLoadingTags ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-8">
              <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
              Carregando tags...
            </div>
          ) : tagsDisponiveis.length === 0 ? (
            <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-6 text-center">
              Nenhuma tag cadastrada. Cadastre tags no menu Tags.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tags selecionadas */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  {selectedTags.map(tagId => {
                    const tag = tagsDisponiveis.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-sm"
                        style={{ backgroundColor: tag.cor }}
                      >
                        {tag.nome}
                        <button
                          type="button"
                          onClick={() => setSelectedTags(prev => prev.filter(id => id !== tag.id))}
                          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Campo de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar tags..."
                  value={tagSearch}
                  onChange={(e) => {
                    setTagSearch(e.target.value);
                    setShowAllTags(true);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {tagSearch && (
                  <button
                    type="button"
                    onClick={() => setTagSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Grid de tags */}
              {(() => {
                const filteredTags = tagsDisponiveis.filter(tag =>
                  tag.nome.toLowerCase().includes(tagSearch.toLowerCase())
                );

                const tagsToShow = showAllTags || tagSearch
                  ? filteredTags
                  : filteredTags.slice(0, MAX_TAGS_VISIBLE);

                const hasMoreTags = !tagSearch && filteredTags.length > MAX_TAGS_VISIBLE;
                const remainingCount = filteredTags.length - MAX_TAGS_VISIBLE;

                return (
                  <>
                    {filteredTags.length === 0 ? (
                      <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-4 text-center">
                        Nenhuma tag encontrada para "{tagSearch}"
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                        {tagsToShow.map(tag => {
                          const isSelected = selectedTags.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedTags(prev => prev.filter(id => id !== tag.id));
                                } else {
                                  setSelectedTags(prev => [...prev, tag.id]);
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-left ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                                style={{ backgroundColor: tag.cor }}
                              >
                                <Tag className="w-3 h-3 text-white" />
                              </span>
                              <span className="text-sm font-medium text-slate-700 truncate flex-1">
                                {tag.nome}
                              </span>
                              {isSelected && (
                                <span className="text-purple-500">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {hasMoreTags && (
                      <button
                        type="button"
                        onClick={() => setShowAllTags(!showAllTags)}
                        className="w-full py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        {showAllTags
                          ? 'Mostrar menos'
                          : `Ver mais ${remainingCount} tag${remainingCount > 1 ? 's' : ''}`
                        }
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Botoes */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseTagsModal}
              disabled={saveTagsMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveTags}
              isLoading={saveTagsMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Salvar Tags
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de WhatsApp */}
      {whatsAppModalPessoa && (
        <WhatsAppSendMessageModal
          isOpen={whatsAppModalOpen}
          onClose={handleCloseWhatsAppModal}
          pessoa={{
            id: whatsAppModalPessoa.id,
            nome: whatsAppModalPessoa.nome,
            whatsapp: whatsAppModalPessoa.whatsapp,
            celular: whatsAppModalPessoa.celular,
          }}
        />
      )}
    </div>
  );
};
