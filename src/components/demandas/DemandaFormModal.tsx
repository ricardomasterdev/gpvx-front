import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  User,
  Tag,
  AlertTriangle,
  Calendar,
  Save,
  Plus,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input, Select, Textarea, DateInput } from '../ui';
import { CategoriaFormModal } from './CategoriaFormModal';
import {
  demandasService,
  categoriasService,
  DemandaCreate,
  DemandaListItem,
  PrioridadeDemanda,
  CategoriaListItem,
} from '../../services/demandas.service';
import { pessoasService, PessoaListItem } from '../../services/pessoas.service';

// =====================================================
// Tipos
// =====================================================

interface DemandaFormData {
  titulo: string;
  descricao: string;
  categoriaId: string;
  prioridade: PrioridadeDemanda;
  pessoaId: string;
  dataPrazo: string;
}

interface DemandaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  demanda?: DemandaListItem | null;
}

const PRIORIDADE_OPTIONS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'critica', label: 'Critica' },
];

// =====================================================
// Componente
// =====================================================

export const DemandaFormModal: React.FC<DemandaFormModalProps> = ({
  isOpen,
  onClose,
  demanda,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!demanda;

  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false);
  const [categoriaSearch, setCategoriaSearch] = useState('');
  const [showCategoriaResults, setShowCategoriaResults] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaListItem | null>(null);
  const [pessoaSearch, setPessoaSearch] = useState('');
  const [showPessoaResults, setShowPessoaResults] = useState(false);
  const [selectedPessoa, setSelectedPessoa] = useState<PessoaListItem | null>(null);

  const categoriaRef = useRef<HTMLDivElement>(null);
  const pessoaRef = useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriaRef.current && !categoriaRef.current.contains(event.target as Node)) {
        setShowCategoriaResults(false);
      }
      if (pessoaRef.current && !pessoaRef.current.contains(event.target as Node)) {
        setShowPessoaResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DemandaFormData>({
    defaultValues: {
      titulo: '',
      descricao: '',
      categoriaId: '',
      prioridade: 'normal',
      pessoaId: '',
      dataPrazo: '',
    },
  });

  const prioridadeValue = watch('prioridade');

  // Buscar categorias
  const { data: categorias = [], isLoading: isLoadingCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriasService.listar(),
    enabled: isOpen,
  });

  // Buscar pessoas para autocomplete
  const { data: pessoasData } = useQuery({
    queryKey: ['pessoas-search', pessoaSearch],
    queryFn: () => pessoasService.listar({ search: pessoaSearch, perPage: 10 }),
    enabled: isOpen && pessoaSearch.length >= 2,
  });

  const pessoas = pessoasData?.items || [];

  // Filtrar categorias baseado na busca
  const filteredCategorias = categorias.filter((cat) =>
    cat.nome.toLowerCase().includes(categoriaSearch.toLowerCase())
  );

  // Preencher form quando editar
  useEffect(() => {
    if (demanda) {
      reset({
        titulo: demanda.titulo,
        descricao: '',
        categoriaId: demanda.categoriaId || '',
        prioridade: demanda.prioridade || 'normal',
        pessoaId: demanda.pessoaId || '',
        dataPrazo: demanda.dataPrazo || '',
      });
      if (demanda.pessoaNome) {
        setPessoaSearch(demanda.pessoaNome);
      }
      if (demanda.categoriaNome) {
        setCategoriaSearch(demanda.categoriaNome);
        const cat = categorias.find(c => c.id === demanda.categoriaId);
        if (cat) setSelectedCategoria(cat);
      }
    } else {
      reset({
        titulo: '',
        descricao: '',
        categoriaId: '',
        prioridade: 'normal',
        pessoaId: '',
        dataPrazo: '',
      });
      setPessoaSearch('');
      setSelectedPessoa(null);
      setCategoriaSearch('');
      setSelectedCategoria(null);
    }
  }, [demanda, reset, isOpen, categorias]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: DemandaCreate) => demandasService.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandas'] });
      toast.success('Demanda criada com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar demanda';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: any) => demandasService.atualizar(demanda!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandas'] });
      toast.success('Demanda atualizada com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar demanda';
      toast.error(message);
    },
  });

  const handleClose = () => {
    reset();
    setPessoaSearch('');
    setSelectedPessoa(null);
    setShowPessoaResults(false);
    setCategoriaSearch('');
    setSelectedCategoria(null);
    setShowCategoriaResults(false);
    onClose();
  };

  const handleSelectCategoria = (categoria: CategoriaListItem) => {
    setSelectedCategoria(categoria);
    setCategoriaSearch(categoria.nome);
    setValue('categoriaId', categoria.id);
    setShowCategoriaResults(false);
  };

  const handleSelectPessoa = (pessoa: PessoaListItem) => {
    setSelectedPessoa(pessoa);
    setPessoaSearch(pessoa.nome);
    setValue('pessoaId', pessoa.id, { shouldValidate: true });
    setShowPessoaResults(false);
  };

  const onSubmit = (data: DemandaFormData) => {
    if (!data.pessoaId) {
      toast.error('Selecione uma pessoa cadastrada');
      return;
    }

    const payload: DemandaCreate = {
      titulo: data.titulo,
      descricao: data.descricao,
      categoriaId: data.categoriaId || undefined,
      prioridade: data.prioridade,
      pessoaId: data.pessoaId,
      dataPrazo: data.dataPrazo || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const prioridadeOptions = [
    { value: '', label: 'Selecione a prioridade' },
    ...PRIORIDADE_OPTIONS,
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isEditing ? 'Editar Demanda' : 'Nova Demanda'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Titulo */}
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <FileText className="w-4 h-4" />
              <span>Titulo da Demanda *</span>
            </div>
            <Input
              placeholder="Descreva brevemente a demanda"
              {...register('titulo', {
                required: 'Campo obrigatorio',
                maxLength: { value: 300, message: 'Maximo 300 caracteres' },
              })}
              error={errors.titulo?.message}
            />
          </div>

          {/* Descricao */}
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <FileText className="w-4 h-4" />
              <span>Descricao *</span>
            </div>
            <Textarea
              placeholder="Descreva detalhadamente a demanda..."
              rows={4}
              {...register('descricao', {
                required: 'Campo obrigatorio',
              })}
              error={errors.descricao?.message}
            />
          </div>

          {/* Grid de campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo/Categoria */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Tag className="w-4 h-4" />
                  <span>Tipo de Demanda</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCategoriaModalOpen(true)}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Novo Tipo
                </button>
              </div>
              <div className="relative" ref={categoriaRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar tipo de demanda..."
                    value={categoriaSearch}
                    onChange={(e) => {
                      setCategoriaSearch(e.target.value);
                      setShowCategoriaResults(true);
                      if (!e.target.value) {
                        setSelectedCategoria(null);
                        setValue('categoriaId', '');
                      }
                    }}
                    onFocus={() => setShowCategoriaResults(true)}
                    disabled={isLoadingCategorias}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50"
                  />
                </div>

                {/* Resultados da busca */}
                {showCategoriaResults && filteredCategorias.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 max-h-48 overflow-auto">
                    {filteredCategorias.map((categoria) => (
                      <button
                        key={categoria.id}
                        type="button"
                        onClick={() => handleSelectCategoria(categoria)}
                        className="w-full px-4 py-3 text-left hover:bg-primary-50 flex items-center gap-3"
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: categoria.cor }}
                        />
                        <span className="font-medium text-slate-900">{categoria.nome}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Nenhum resultado */}
                {showCategoriaResults && categoriaSearch && filteredCategorias.length === 0 && !isLoadingCategorias && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center text-slate-500 text-sm">
                    Nenhum tipo encontrado
                  </div>
                )}
              </div>
              {selectedCategoria && (
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedCategoria.cor }}
                  />
                  <span className="text-sm text-slate-600">{selectedCategoria.nome}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoria(null);
                      setCategoriaSearch('');
                      setValue('categoriaId', '');
                    }}
                    className="text-xs text-slate-400 hover:text-red-500 ml-auto"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>

            {/* Prioridade */}
            <div>
              <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Prioridade</span>
              </div>
              <Select
                options={prioridadeOptions}
                value={prioridadeValue}
                onChange={(value) => setValue('prioridade', value as PrioridadeDemanda)}
              />
            </div>

            {/* Solicitante (Pessoa) - Obrigatorio */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
                <User className="w-4 h-4" />
                <span>Solicitante *</span>
              </div>
              <div className="relative" ref={pessoaRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar pessoa cadastrada..."
                    value={pessoaSearch}
                    onChange={(e) => {
                      setPessoaSearch(e.target.value);
                      setShowPessoaResults(true);
                      if (!e.target.value) {
                        setSelectedPessoa(null);
                        setValue('pessoaId', '');
                      }
                    }}
                    onFocus={() => setShowPessoaResults(true)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      !selectedPessoa && errors.pessoaId ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                </div>

                {/* Resultados da busca */}
                {showPessoaResults && pessoas.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 max-h-48 overflow-auto">
                    {pessoas.map((pessoa) => (
                      <button
                        key={pessoa.id}
                        type="button"
                        onClick={() => handleSelectPessoa(pessoa)}
                        className="w-full px-4 py-3 text-left hover:bg-primary-50 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                          {pessoa.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{pessoa.nome}</p>
                          <p className="text-xs text-slate-500">
                            {pessoa.whatsapp || pessoa.email || '-'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!selectedPessoa && (
                <p className="mt-1 text-xs text-slate-500">
                  Digite pelo menos 2 caracteres para buscar
                </p>
              )}
              <input type="hidden" {...register('pessoaId', { required: 'Campo obrigatorio' })} />
              {errors.pessoaId && !selectedPessoa && (
                <p className="mt-1 text-xs text-red-500">{errors.pessoaId.message}</p>
              )}
            </div>

            {/* Data Prazo */}
            <div>
              <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
                <Calendar className="w-4 h-4" />
                <span>Prazo</span>
              </div>
              <DateInput
                value={watch('dataPrazo')}
                onChange={(value) => setValue('dataPrazo', value)}
              />
            </div>
          </div>

          {/* Pessoa selecionada */}
          {selectedPessoa && (
            <div className="bg-primary-50 rounded-xl p-4">
              <p className="text-sm text-primary-700">
                <strong>Solicitante vinculado:</strong> {selectedPessoa.nome}
                {selectedPessoa.whatsapp && ` - ${selectedPessoa.whatsapp}`}
              </p>
            </div>
          )}

          {/* Botoes */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isEditing ? 'Salvar' : 'Criar Demanda'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Categoria */}
      <CategoriaFormModal
        isOpen={categoriaModalOpen}
        onClose={() => setCategoriaModalOpen(false)}
      />
    </>
  );
};
