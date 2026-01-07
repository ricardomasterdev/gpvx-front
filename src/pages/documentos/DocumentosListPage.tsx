import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  Filter,
  X,
  Calendar,
  User,
  Link as LinkIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Button,
  Card,
  DataTable,
  Pagination,
  SearchableSelect,
  Badge,
  ActionMenu,
} from '../../components/ui';
import type { Column } from '../../components/ui/DataTable';
import { documentosService, Documento } from '../../services/documentos.service';
import { pessoasService } from '../../services/pessoas.service';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';
import { toast } from 'react-hot-toast';
import { DocumentoFormModal } from '../../components/documentos/DocumentoFormModal';
import { DocumentoViewModal } from '../../components/documentos/DocumentoViewModal';

// =====================================================
// Configuracoes
// =====================================================

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

// =====================================================
// Pagina Principal
// =====================================================

export const DocumentosListPage: React.FC = () => {
  const { gabinete } = useAuthStore();
  const queryClient = useQueryClient();

  // Estado
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('data_documento');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Modais
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null);

  // Filtros
  const [pessoaId, setPessoaId] = useState<string>('');
  const [tipoDocumento, setTipoDocumento] = useState<string>('');

  // Query para buscar pessoas
  const { data: pessoasData } = useQuery({
    queryKey: ['pessoas-simples'],
    queryFn: () => pessoasService.listarSimples(),
  });

  const pessoas = pessoasData || [];

  // Query para buscar documentos
  const { data: documentosData, isLoading } = useQuery({
    queryKey: ['documentos', gabinete?.id, currentPage, pageSize, pessoaId, tipoDocumento],
    queryFn: () => documentosService.listar({
      page: currentPage,
      perPage: pageSize,
      pessoaId: pessoaId || undefined,
      tipoDocumento: tipoDocumento || undefined,
    }),
    enabled: !!gabinete?.id,
  });

  const items = documentosData?.items || [];
  const totalItems = documentosData?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Mutation para excluir
  const deleteMutation = useMutation({
    mutationFn: documentosService.excluir,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast.success('Documento excluido com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir documento');
    },
  });

  // Opcoes para os selects
  const pessoasOptions = useMemo(() => [
    { value: '', label: 'Todas as pessoas' },
    ...pessoas.map((p: any) => ({
      value: String(p.id),
      label: p.nome,
    }))
  ], [pessoas]);

  const tiposOptions = [
    { value: '', label: 'Todos os tipos' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'oficio', label: 'Oficio' },
    { value: 'requerimento', label: 'Requerimento' },
    { value: 'declaracao', label: 'Declaracao' },
    { value: 'certidao', label: 'Certidao' },
    { value: 'comprovante', label: 'Comprovante' },
    { value: 'outros', label: 'Outros' },
  ];

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

  const handleClearFilters = () => {
    setPessoaId('');
    setTipoDocumento('');
    setCurrentPage(1);
  };

  const handleNew = () => {
    setSelectedDocumento(null);
    setShowFormModal(true);
  };

  const handleEdit = (documento: Documento) => {
    setSelectedDocumento(documento);
    setShowFormModal(true);
  };

  const handleView = (documento: Documento) => {
    setSelectedDocumento(documento);
    setShowViewModal(true);
  };

  const handleDelete = async (documento: Documento) => {
    if (window.confirm(`Deseja realmente excluir o documento "${documento.titulo}"?`)) {
      deleteMutation.mutate(documento.id);
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setSelectedDocumento(null);
    queryClient.invalidateQueries({ queryKey: ['documentos'] });
  };

  const hasActiveFilters = pessoaId || tipoDocumento;

  // Colunas da tabela
  const columns: Column<Documento>[] = [
    {
      key: 'titulo',
      header: 'Documento',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{item.titulo}</p>
            {item.tipo_documento && (
              <Badge variant="default" className="mt-1">{item.tipo_documento}</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'pessoa_nome',
      header: 'Pessoa',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700">{item.pessoa_nome}</span>
        </div>
      ),
    },
    {
      key: 'data_documento',
      header: 'Data',
      sortable: true,
      width: '150px',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700">
            {format(new Date(item.data_documento), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </div>
      ),
    },
    {
      key: 'compromisso_titulo',
      header: 'Compromisso',
      render: (item) => item.compromisso_titulo ? (
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700 text-sm">{item.compromisso_titulo}</span>
        </div>
      ) : (
        <span className="text-slate-400">-</span>
      ),
    },
    {
      key: 'arquivo_nome',
      header: 'Arquivo',
      render: (item) => item.arquivo_nome ? (
        <Badge variant="success">
          <Download className="w-3 h-3 mr-1" />
          Anexado
        </Badge>
      ) : (
        <Badge variant="default">Sem arquivo</Badge>
      ),
    },
    {
      key: 'acoes',
      header: 'Acoes',
      width: '100px',
      align: 'center',
      render: (item) => (
        <ActionMenu
          items={[
            {
              label: 'Visualizar',
              icon: <Eye className="w-4 h-4" />,
              onClick: () => handleView(item),
            },
            {
              label: 'Editar',
              icon: <Pencil className="w-4 h-4" />,
              onClick: () => handleEdit(item),
            },
            {
              label: 'Excluir',
              icon: <Trash2 className="w-4 h-4" />,
              onClick: () => handleDelete(item),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Gestao de documentos vinculados a pessoas
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
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleNew}
          >
            Novo Documento
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Total de Documentos</p>
              <p className="text-2xl font-bold text-blue-900">{totalItems}</p>
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
              label="Pessoa"
              value={pessoaId}
              onChange={(value) => {
                setPessoaId(value);
                setCurrentPage(1);
              }}
              options={pessoasOptions}
              placeholder="Selecione uma pessoa..."
            />
            <SearchableSelect
              label="Tipo de Documento"
              value={tipoDocumento}
              onChange={(value) => {
                setTipoDocumento(value);
                setCurrentPage(1);
              }}
              options={tiposOptions}
              placeholder="Selecione um tipo..."
            />
          </div>
        </Card>
      )}

      {/* Info de filtros */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {totalItems} documento(s) encontrado(s)
            {hasActiveFilters && ' com os filtros aplicados'}
          </p>
        </div>
      </Card>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhum documento encontrado"
        emptyDescription="Clique em 'Novo Documento' para cadastrar"
        emptyIcon={<FileText className="w-12 h-12 text-slate-300" />}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
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

      {/* Modais */}
      {showFormModal && (
        <DocumentoFormModal
          documento={selectedDocumento}
          onClose={() => {
            setShowFormModal(false);
            setSelectedDocumento(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {showViewModal && selectedDocumento && (
        <DocumentoViewModal
          documento={selectedDocumento}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDocumento(null);
          }}
        />
      )}
    </div>
  );
};
