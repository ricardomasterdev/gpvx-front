import React, { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Save,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Crown,
  MessageCircle,
  Instagram,
  Facebook,
  FileText,
  Search,
  Plus,
  Tag,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input, Select, SearchableSelect, Textarea } from '../ui';
import { pessoasService, PessoaCreate, PessoaListItem, PessoaResponse } from '../../services/pessoas.service';
import { auxiliarService, EstadoSimples, MunicipioSimples, SetorSimples } from '../../services/auxiliar.service';
import { tagsService, TagListItem } from '../../services/tags.service';
import { Genero } from '../../types';
import { maskPhone, maskCPF, maskCEP, maskDate, dateToISO, dateFromISO, unmask, buscarCEP } from '../../utils/masks';

// =====================================================
// Tipos
// =====================================================

interface PessoaFormData {
  // Obrigatorios
  nome: string;
  whatsapp: string;
  estadoId: string;
  municipioId: string;
  setorId: string;
  genero: Genero;
  // Opcionais
  nomeSocial?: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  profissao?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  instagram?: string;
  facebook?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  observacoes?: string;
  liderancaId?: string;
  aceitaWhatsapp?: boolean;
  aceitaSms?: boolean;
  aceitaEmail?: boolean;
  tagIds?: string[];
}

interface PessoaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  pessoa?: PessoaListItem | null;
}

const GENERO_OPTIONS = [
  { value: Genero.NAO_INFORMADO, label: 'Nao Informado' },
  { value: Genero.MASCULINO, label: 'Masculino' },
  { value: Genero.FEMININO, label: 'Feminino' },
  { value: Genero.OUTRO, label: 'Outro' },
];

// =====================================================
// Componente
// =====================================================

export const PessoaFormModal: React.FC<PessoaFormModalProps> = ({
  isOpen,
  onClose,
  pessoa,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!pessoa;

  const [activeTab, setActiveTab] = useState<'dados' | 'contato' | 'endereco' | 'outros'>('dados');
  // Estados para controle de criacao de setor
  const [novoSetor, setNovoSetor] = useState('');
  const [showNovoSetor, setShowNovoSetor] = useState(false);
  // Estado para busca de CEP
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  // Refs para controle de mudanca de estado/municipio
  const prevEstadoRef = useRef<string>('');
  const prevMunicipioRef = useRef<string>('');
  // Estados para fluxo de tags apos salvar
  const [showTagsStep, setShowTagsStep] = useState(false);
  const [savedPessoaId, setSavedPessoaId] = useState<string | null>(null);
  // Estados para busca e paginacao de tags
  const [tagSearch, setTagSearch] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const MAX_TAGS_VISIBLE = 8;

  // Estados para busca de lideranca
  const [liderancaSearch, setLiderancaSearch] = useState('');
  const [showLiderancaResults, setShowLiderancaResults] = useState(false);
  const [selectedLideranca, setSelectedLideranca] = useState<{ id: string; nome: string } | null>(null);
  const liderancaRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<PessoaFormData>({
    defaultValues: {
      nome: '',
      whatsapp: '',
      estadoId: '',
      municipioId: '',
      setorId: '',
      genero: Genero.NAO_INFORMADO,
      aceitaWhatsapp: true,
      aceitaSms: true,
      aceitaEmail: true,
    },
  });

  const estadoIdSelecionado = watch('estadoId');
  const municipioIdSelecionado = watch('municipioId');

  // Buscar dados completos da pessoa quando editar
  const { data: pessoaCompleta, isLoading: isLoadingPessoa } = useQuery({
    queryKey: ['pessoa', pessoa?.id],
    queryFn: () => pessoasService.obter(pessoa!.id),
    enabled: isOpen && isEditing && !!pessoa?.id,
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0, // Nao cachear (antigo cacheTime)
  });

  // Buscar pessoas para lideranca (autocomplete)
  const { data: liderancasData } = useQuery({
    queryKey: ['pessoas-lideranca', liderancaSearch],
    queryFn: () => pessoasService.listar({ search: liderancaSearch, perPage: 10, ativo: true }),
    enabled: isOpen && liderancaSearch.length >= 2,
  });
  const liderancasPesquisa = liderancasData?.items || [];

  // Buscar tags disponiveis
  const { data: tagsData, isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags-ativas'],
    queryFn: () => tagsService.listar({ ativo: true, perPage: 100 }),
    enabled: isOpen,
  });
  const tagsDisponiveis = tagsData?.items || [];

  // Estado para tags selecionadas
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Buscar estados (todos - filtragem feita no componente)
  const { data: estados = [], isLoading: isLoadingEstados } = useQuery({
    queryKey: ['estados'],
    queryFn: () => auxiliarService.listarEstados(),
    enabled: isOpen,
  });

  // Buscar municipios do estado selecionado
  const { data: municipios = [], isLoading: isLoadingMunicipios } = useQuery({
    queryKey: ['municipios', estadoIdSelecionado],
    queryFn: () => auxiliarService.listarMunicipios(estadoIdSelecionado ? Number(estadoIdSelecionado) : undefined, undefined, 1000),
    enabled: isOpen && !!estadoIdSelecionado,
  });

  // Buscar setores do municipio selecionado
  const { data: setores = [], isLoading: isLoadingSetores } = useQuery({
    queryKey: ['setores', municipioIdSelecionado],
    queryFn: () => auxiliarService.listarSetores(municipioIdSelecionado),
    enabled: isOpen && !!municipioIdSelecionado,
  });

  // Fechar dropdown de lideranca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (liderancaRef.current && !liderancaRef.current.contains(event.target as Node)) {
        setShowLiderancaResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resetar form quando modal abre para nova pessoa
  useEffect(() => {
    if (isOpen && !isEditing) {
      reset({
        nome: '',
        whatsapp: '',
        estadoId: '',
        municipioId: '',
        setorId: '',
        genero: Genero.NAO_INFORMADO,
        aceitaWhatsapp: true,
        aceitaSms: true,
        aceitaEmail: true,
      });
      setSelectedTags([]);
      setActiveTab('dados');
      prevEstadoRef.current = '';
      prevMunicipioRef.current = '';
      setLiderancaSearch('');
      setSelectedLideranca(null);
    }
  }, [isOpen, isEditing, reset]);

  // Preencher form quando editar e dados carregarem
  useEffect(() => {
    if (isOpen && isEditing && pessoaCompleta) {
      // Desabilitar temporariamente os refs para evitar limpar campos
      prevEstadoRef.current = pessoaCompleta.estadoId ? String(pessoaCompleta.estadoId) : '';
      prevMunicipioRef.current = pessoaCompleta.municipioId || '';

      reset({
        nome: pessoaCompleta.nome,
        whatsapp: pessoaCompleta.whatsapp || '',
        estadoId: pessoaCompleta.estadoId ? String(pessoaCompleta.estadoId) : '',
        municipioId: pessoaCompleta.municipioId || '',
        setorId: pessoaCompleta.setorId || '',
        genero: pessoaCompleta.genero || Genero.NAO_INFORMADO,
        nomeSocial: pessoaCompleta.nomeSocial || '',
        cpf: pessoaCompleta.cpf || '',
        rg: pessoaCompleta.rg || '',
        dataNascimento: dateFromISO(pessoaCompleta.dataNascimento || ''),
        profissao: pessoaCompleta.profissao || '',
        email: pessoaCompleta.email || '',
        telefone: pessoaCompleta.telefone || '',
        celular: pessoaCompleta.celular || '',
        instagram: pessoaCompleta.instagram || '',
        facebook: pessoaCompleta.facebook || '',
        cep: pessoaCompleta.cep || '',
        logradouro: pessoaCompleta.logradouro || '',
        numero: pessoaCompleta.numero || '',
        complemento: pessoaCompleta.complemento || '',
        bairro: pessoaCompleta.bairro || '',
        observacoes: pessoaCompleta.observacoes || '',
        liderancaId: pessoaCompleta.liderancaId || '',
        aceitaWhatsapp: pessoaCompleta.aceitaWhatsapp,
        aceitaSms: pessoaCompleta.aceitaSms,
        aceitaEmail: pessoaCompleta.aceitaEmail,
      });
      // Preencher tags selecionadas
      setSelectedTags(pessoaCompleta.tags?.map(t => t.id) || []);
      // Preencher lideranca se existir
      if (pessoaCompleta.liderancaId && pessoaCompleta.liderancaNome) {
        setSelectedLideranca({ id: pessoaCompleta.liderancaId, nome: pessoaCompleta.liderancaNome });
        setLiderancaSearch(pessoaCompleta.liderancaNome);
      } else {
        setSelectedLideranca(null);
        setLiderancaSearch('');
      }
      setActiveTab('dados');
    }
  }, [isOpen, isEditing, pessoaCompleta, reset]);

  // Limpar municipio quando trocar estado (apenas se mudou de um valor para outro)
  useEffect(() => {
    if (prevEstadoRef.current && prevEstadoRef.current !== estadoIdSelecionado) {
      setValue('municipioId', '');
      setValue('setorId', '');
    }
    prevEstadoRef.current = estadoIdSelecionado;
  }, [estadoIdSelecionado, setValue]);

  // Limpar setor quando trocar municipio (apenas se mudou de um valor para outro)
  useEffect(() => {
    if (prevMunicipioRef.current && prevMunicipioRef.current !== municipioIdSelecionado) {
      setValue('setorId', '');
    }
    prevMunicipioRef.current = municipioIdSelecionado;
  }, [municipioIdSelecionado, setValue]);

  // Mutation para criar setor
  const criarSetorMutation = useMutation({
    mutationFn: (nome: string) => auxiliarService.criarSetor(municipioIdSelecionado, { nome }),
    onSuccess: (setor) => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      setValue('setorId', setor.id);
      setNovoSetor('');
      setShowNovoSetor(false);
      toast.success('Setor criado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar setor';
      toast.error(message);
    },
  });

  // Mutation para criar pessoa
  const createMutation = useMutation({
    mutationFn: (data: PessoaCreate) => pessoasService.criar(data),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['pessoas'], refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: ['gabinete-dashboard'] });
      toast.success('Pessoa cadastrada com sucesso!');
      // Mostra a etapa de tags
      setSavedPessoaId(response.id);
      setShowTagsStep(true);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao cadastrar pessoa';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: PessoaCreate) =>
      pessoasService.atualizar(pessoa!.id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pessoas'], refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: ['pessoa', pessoa?.id] });
      await queryClient.invalidateQueries({ queryKey: ['gabinete-dashboard'] });
      toast.success('Pessoa atualizada com sucesso!');
      // Mostra a etapa de tags
      setSavedPessoaId(pessoa!.id);
      setShowTagsStep(true);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar pessoa';
      toast.error(message);
    },
  });

  // Mutation para salvar tags
  const saveTagsMutation = useMutation({
    mutationFn: (tagIds: string[]) =>
      pessoasService.atualizar(savedPessoaId!, { tagIds }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pessoas'], refetchType: 'all' });
      if (selectedTags.length > 0) {
        toast.success('Tags vinculadas com sucesso!');
      }
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao vincular tags';
      toast.error(message);
    },
  });

  const handleClose = () => {
    reset();
    setActiveTab('dados');
    setShowNovoSetor(false);
    setNovoSetor('');
    setSelectedTags([]);
    setShowTagsStep(false);
    setSavedPessoaId(null);
    setTagSearch('');
    setShowAllTags(false);
    setLiderancaSearch('');
    setSelectedLideranca(null);
    setShowLiderancaResults(false);
    prevEstadoRef.current = '';
    prevMunicipioRef.current = '';
    onClose();
  };

  // Handler para salvar tags
  const handleSaveTags = () => {
    saveTagsMutation.mutate(selectedTags);
  };

  // Handler para pular etapa de tags
  const handleSkipTags = () => {
    handleClose();
  };

  // Funcao para buscar CEP e preencher endereco
  const handleCEPChange = async (cepValue: string) => {
    const maskedCEP = maskCEP(cepValue);
    setValue('cep', maskedCEP);

    const cepLimpo = unmask(maskedCEP);
    if (cepLimpo.length !== 8) return;

    setBuscandoCEP(true);
    try {
      const dados = await buscarCEP(cepLimpo);
      if (!dados) {
        toast.error('CEP nao encontrado');
        return;
      }

      // Preenche os campos de endereco
      setValue('logradouro', dados.logradouro || '');
      setValue('complemento', dados.complemento || '');
      setValue('bairro', dados.bairro || '');

      // Busca o estado pela sigla (UF)
      const estadoEncontrado = estados.find(e => e.sigla === dados.uf);
      if (estadoEncontrado) {
        setValue('estadoId', String(estadoEncontrado.id));

        // Busca os municipios do estado para encontrar a cidade
        const municipiosDoEstado = await auxiliarService.listarMunicipios(estadoEncontrado.id, undefined, 10000);
        const municipioEncontrado = municipiosDoEstado.find(
          m => m.nome.toLowerCase() === dados.localidade.toLowerCase()
        );

        if (municipioEncontrado) {
          setValue('municipioId', municipioEncontrado.id);

          // Busca os setores do municipio para encontrar o bairro
          const setoresDoMunicipio = await auxiliarService.listarSetores(municipioEncontrado.id);
          const setorEncontrado = setoresDoMunicipio.find(
            s => s.nome.toLowerCase() === dados.bairro.toLowerCase()
          );

          if (setorEncontrado) {
            setValue('setorId', setorEncontrado.id);
            toast.success('Endereco preenchido automaticamente!');
          } else if (dados.bairro) {
            // Setor nao existe, oferece criar
            setNovoSetor(dados.bairro);
            setShowNovoSetor(true);
            toast.success('Endereco preenchido! Setor/Bairro nao encontrado, criando novo...');
            // Invalida queries para pegar setores atualizados
            queryClient.invalidateQueries({ queryKey: ['setores', municipioEncontrado.id] });
          } else {
            toast.success('Endereco preenchido automaticamente!');
          }
        } else {
          toast.success('Endereco parcialmente preenchido. Municipio nao encontrado.');
        }
      } else {
        toast.success('Endereco parcialmente preenchido. Estado nao encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setBuscandoCEP(false);
    }
  };

  const onSubmit = (data: PessoaFormData) => {
    const payload: PessoaCreate = {
      nome: data.nome,
      whatsapp: data.whatsapp,
      estadoId: Number(data.estadoId),
      municipioId: data.municipioId,
      setorId: data.setorId,
      genero: data.genero,
      nomeSocial: data.nomeSocial || undefined,
      cpf: data.cpf || undefined,
      rg: data.rg || undefined,
      dataNascimento: dateToISO(data.dataNascimento || '') || undefined,
      profissao: data.profissao || undefined,
      email: data.email || undefined,
      telefone: data.telefone || undefined,
      celular: data.celular || undefined,
      instagram: data.instagram || undefined,
      facebook: data.facebook || undefined,
      cep: data.cep || undefined,
      logradouro: data.logradouro || undefined,
      numero: data.numero || undefined,
      complemento: data.complemento || undefined,
      bairro: data.bairro || undefined,
      observacoes: data.observacoes || undefined,
      liderancaId: data.liderancaId || undefined,
      aceitaWhatsapp: data.aceitaWhatsapp,
      aceitaSms: data.aceitaSms,
      aceitaEmail: data.aceitaEmail,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || saveTagsMutation.isPending;

  const tabs = [
    { id: 'dados', label: 'Dados Pessoais', icon: User },
    { id: 'contato', label: 'Contato', icon: Phone },
    { id: 'endereco', label: 'Endereco', icon: MapPin },
    { id: 'outros', label: 'Outros', icon: FileText },
  ];

  const estadoOptions = estados.map((e) => ({ value: String(e.id), label: `${e.sigla} - ${e.nome}` }));
  const municipioOptions = municipios.map((m) => ({ value: m.id, label: m.nome }));
  const setorOptions = setores.map((s) => ({ value: s.id, label: s.nome }));

  // Handler para selecionar lideranca
  const handleSelectLideranca = (pessoa: PessoaListItem) => {
    setSelectedLideranca({ id: pessoa.id, nome: pessoa.nome });
    setLiderancaSearch(pessoa.nome);
    setValue('liderancaId', pessoa.id);
    setShowLiderancaResults(false);
  };

  // Handler para limpar lideranca
  const handleClearLideranca = () => {
    setSelectedLideranca(null);
    setLiderancaSearch('');
    setValue('liderancaId', '');
  };

  // Mostrar loading enquanto carrega dados da pessoa
  if (isEditing && isLoadingPessoa) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Editar Pessoa"
        size="lg"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full mb-4" />
          <p className="text-slate-500">Carregando dados...</p>
        </div>
      </Modal>
    );
  }

  // Tela de selecao de tags (apos salvar)
  if (showTagsStep) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Vincular Tags"
        size="md"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              Deseja vincular tags a este cadastro?
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Selecione as tags para categorizar esta pessoa
            </p>
          </div>

          {/* Lista de tags */}
          {isLoadingTags ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-8">
              <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
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
                <div className="flex flex-wrap gap-2 p-3 bg-primary-50 rounded-lg border border-primary-100">
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
                    setShowAllTags(true); // Mostra todas ao buscar
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                // Filtra tags pela busca
                const filteredTags = tagsDisponiveis.filter(tag =>
                  tag.nome.toLowerCase().includes(tagSearch.toLowerCase())
                );

                // Determina quantas tags mostrar
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
                                  ? 'border-primary-500 bg-primary-50'
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
                                <span className="text-primary-500">
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

                    {/* Botao para mostrar mais/menos */}
                    {hasMoreTags && (
                      <button
                        type="button"
                        onClick={() => setShowAllTags(!showAllTags)}
                        className="w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
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
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkipTags}
              disabled={isLoading}
            >
              {selectedTags.length === 0 ? 'Nao vincular tags' : 'Cancelar'}
            </Button>
            <Button
              type="button"
              onClick={handleSaveTags}
              isLoading={saveTagsMutation.isPending}
            >
              {selectedTags.length > 0
                ? `Salvar ${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''}`
                : 'Concluir sem tags'
              }
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Pessoa' : 'Nova Pessoa'}
      size="lg"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 -mx-6 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab: Dados Pessoais */}
        {activeTab === 'dados' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nome Completo *"
                  placeholder="Nome da pessoa"
                  {...register('nome', {
                    required: 'Nome e obrigatorio',
                    maxLength: { value: 200, message: 'Maximo 200 caracteres' },
                  })}
                  error={errors.nome?.message}
                />
              </div>

              <Controller
                name="whatsapp"
                control={control}
                rules={{
                  required: 'WhatsApp e obrigatorio',
                  minLength: { value: 15, message: 'WhatsApp incompleto' }
                }}
                render={({ field }) => (
                  <Input
                    label="WhatsApp *"
                    placeholder="(00) 00000-0000"
                    leftIcon={<MessageCircle className="w-4 h-4" />}
                    value={field.value}
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    error={errors.whatsapp?.message}
                  />
                )}
              />

              <Controller
                name="genero"
                control={control}
                rules={{ required: 'Genero e obrigatorio' }}
                render={({ field }) => (
                  <Select
                    label="Genero *"
                    options={GENERO_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.genero?.message}
                  />
                )}
              />

              <Controller
                name="estadoId"
                control={control}
                rules={{ required: 'Estado e obrigatorio' }}
                render={({ field }) => (
                  <SearchableSelect
                    label="Estado *"
                    options={estadoOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Buscar estado..."
                    loading={isLoadingEstados}
                    error={errors.estadoId?.message}
                  />
                )}
              />

              <Controller
                name="municipioId"
                control={control}
                rules={{ required: 'Municipio e obrigatorio' }}
                render={({ field }) => (
                  <SearchableSelect
                    label="Municipio *"
                    options={municipioOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={estadoIdSelecionado ? 'Buscar municipio...' : 'Selecione o estado primeiro'}
                    disabled={!estadoIdSelecionado}
                    loading={isLoadingMunicipios}
                    error={errors.municipioId?.message}
                  />
                )}
              />

              <div className="md:col-span-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Controller
                      name="setorId"
                      control={control}
                      rules={{ required: 'Setor e obrigatorio' }}
                      render={({ field }) => (
                        <SearchableSelect
                          label="Setor/Bairro *"
                          options={setorOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={municipioIdSelecionado ? 'Buscar setor/bairro...' : 'Selecione o municipio primeiro'}
                          disabled={!municipioIdSelecionado}
                          loading={isLoadingSetores}
                          error={errors.setorId?.message}
                        />
                      )}
                    />
                  </div>
                  {municipioIdSelecionado && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowNovoSetor(!showNovoSetor)}
                      title="Adicionar novo setor"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {showNovoSetor && municipioIdSelecionado && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Digite o nome do setor/bairro"
                        value={novoSetor}
                        onChange={(e) => setNovoSetor(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => novoSetor && criarSetorMutation.mutate(novoSetor)}
                        isLoading={criarSetorMutation.isPending}
                        disabled={!novoSetor.trim()}
                      >
                        Criar
                      </Button>
                    </div>
                    {/* Sugestoes de setores existentes */}
                    {novoSetor.length >= 2 && setores.filter(s =>
                      s.nome.toLowerCase().includes(novoSetor.toLowerCase())
                    ).length > 0 && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700 font-medium mb-1">
                          Setores semelhantes ja cadastrados:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {setores
                            .filter(s => s.nome.toLowerCase().includes(novoSetor.toLowerCase()))
                            .slice(0, 5)
                            .map(s => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setValue('setorId', s.id);
                                  setNovoSetor('');
                                  setShowNovoSetor(false);
                                }}
                                className="text-xs px-2 py-1 bg-white border border-amber-300 rounded hover:bg-amber-100 transition-colors"
                              >
                                {s.nome}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Input
                label="Nome Social"
                placeholder="Nome social (se houver)"
                {...register('nomeSocial')}
              />

              <Controller
                name="cpf"
                control={control}
                render={({ field }) => (
                  <Input
                    label="CPF"
                    placeholder="000.000.000-00"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(maskCPF(e.target.value))}
                  />
                )}
              />

              <Input
                label="RG"
                placeholder="Numero do RG"
                {...register('rg')}
              />

              <Controller
                name="dataNascimento"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Data de Nascimento"
                    placeholder="DD/MM/AAAA"
                    leftIcon={<Calendar className="w-4 h-4" />}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(maskDate(e.target.value))}
                    maxLength={10}
                  />
                )}
              />

              <Input
                label="Profissao"
                placeholder="Profissao"
                {...register('profissao')}
              />

              {/* Lideranca - Campo de busca */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span>Lideranca</span>
                  </div>
                </label>
                <div className="relative" ref={liderancaRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar lideranca..."
                      value={liderancaSearch}
                      onChange={(e) => {
                        setLiderancaSearch(e.target.value);
                        setShowLiderancaResults(true);
                        if (!e.target.value) {
                          setSelectedLideranca(null);
                          setValue('liderancaId', '');
                        }
                      }}
                      onFocus={() => setShowLiderancaResults(true)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {selectedLideranca && (
                      <button
                        type="button"
                        onClick={handleClearLideranca}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Resultados da busca */}
                  {showLiderancaResults && liderancaSearch.length >= 2 && liderancasPesquisa.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 max-h-48 overflow-auto">
                      {liderancasPesquisa.map((pessoa) => (
                        <button
                          key={pessoa.id}
                          type="button"
                          onClick={() => handleSelectLideranca(pessoa)}
                          className="w-full px-4 py-3 text-left hover:bg-primary-50 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium">
                            {pessoa.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{pessoa.nome}</p>
                            <p className="text-xs text-slate-500">
                              {pessoa.municipioNome || pessoa.whatsapp || '-'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Nenhum resultado */}
                  {showLiderancaResults && liderancaSearch.length >= 2 && liderancasPesquisa.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center text-slate-500 text-sm">
                      Nenhuma pessoa encontrada
                    </div>
                  )}

                  {/* Dica */}
                  {!selectedLideranca && liderancaSearch.length < 2 && (
                    <p className="mt-1 text-xs text-slate-500">
                      Digite pelo menos 2 caracteres para buscar
                    </p>
                  )}
                </div>
                {selectedLideranca && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700 font-medium">{selectedLideranca.nome}</span>
                  </div>
                )}
                <input type="hidden" {...register('liderancaId')} />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Contato */}
        {activeTab === 'contato' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="telefone"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Telefone"
                    placeholder="(00) 0000-0000"
                    leftIcon={<Phone className="w-4 h-4" />}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                  />
                )}
              />

              <Controller
                name="celular"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Celular"
                    placeholder="(00) 00000-0000"
                    leftIcon={<Phone className="w-4 h-4" />}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                  />
                )}
              />

              <Input
                label="E-mail"
                type="email"
                placeholder="email@exemplo.com"
                leftIcon={<Mail className="w-4 h-4" />}
                {...register('email')}
              />

              <Input
                label="Instagram"
                placeholder="@usuario"
                leftIcon={<Instagram className="w-4 h-4" />}
                {...register('instagram')}
              />

              <Input
                label="Facebook"
                placeholder="usuario.facebook"
                leftIcon={<Facebook className="w-4 h-4" />}
                {...register('facebook')}
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-3">Preferencias de Comunicacao</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    {...register('aceitaWhatsapp')}
                  />
                  <span className="text-sm text-slate-600">WhatsApp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    {...register('aceitaSms')}
                  />
                  <span className="text-sm text-slate-600">SMS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    {...register('aceitaEmail')}
                  />
                  <span className="text-sm text-slate-600">E-mail</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Endereco */}
        {activeTab === 'endereco' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Controller
                name="cep"
                control={control}
                render={({ field }) => (
                  <Input
                    label="CEP"
                    placeholder="00000-000"
                    value={field.value || ''}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    disabled={buscandoCEP}
                    rightIcon={buscandoCEP ? (
                      <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                    ) : undefined}
                  />
                )}
              />

              <div className="md:col-span-2">
                <Input
                  label="Logradouro"
                  placeholder="Rua, Avenida, etc."
                  {...register('logradouro')}
                />
              </div>

              <Input
                label="Numero"
                placeholder="123"
                {...register('numero')}
              />

              <div className="md:col-span-2">
                <Input
                  label="Complemento"
                  placeholder="Apto, Bloco, etc."
                  {...register('complemento')}
                />
              </div>

              <div className="md:col-span-3">
                <Input
                  label="Bairro"
                  placeholder="Bairro"
                  {...register('bairro')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Outros */}
        {activeTab === 'outros' && (
          <div className="space-y-4">
            <Textarea
              label="Observacoes"
              placeholder="Observacoes, anotacoes, informacoes adicionais..."
              rows={6}
              {...register('observacoes')}
            />
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
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
