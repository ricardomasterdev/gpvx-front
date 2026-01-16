import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Edit,
  Trash2,
  FileUp,
  Eye,
  Files,
  Upload,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { Modal, Button, Input, Select, SearchableSelect, Textarea } from '../ui';
import { pessoasService, PessoaCreate, PessoaListItem, PessoaResponse, WhatsAppVerificacao } from '../../services/pessoas.service';
import { auxiliarService, EstadoSimples, MunicipioSimples, SetorSimples } from '../../services/auxiliar.service';
import { setoresService, SetorListItem as SetorSubdivisao } from '../../services/setores.service';
import { tagsService, TagListItem } from '../../services/tags.service';
import { documentosService, Documento, DocumentoCreate, compromissosService, CompromissoSimples, CompromissoCreate } from '../../services/documentos.service';
import { demandasService, DemandaCreate, DemandaListItem, categoriasService, CategoriaListItem } from '../../services/demandas.service';
import { CategoriaFormModal } from '../demandas/CategoriaFormModal';
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
  setorSubdivisaoId?: string;
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
  onEditPessoa?: (pessoaId: string) => void;
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
  onEditPessoa,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!pessoa;

  const [activeTab, setActiveTab] = useState<'dados' | 'contato' | 'endereco' | 'outros' | 'documentos' | 'demandas'>('dados');
  // Estados para controle de criacao de setor
  const [novoSetor, setNovoSetor] = useState('');
  const [showNovoSetor, setShowNovoSetor] = useState(false);
  // Estado para busca de CEP
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  // Refs para controle de mudanca de estado/municipio/setor
  const prevEstadoRef = useRef<string>('');
  const prevMunicipioRef = useRef<string>('');
  const prevSetorRef = useRef<string>('');
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

  // Estados para verificacao de WhatsApp duplicado
  const [whatsappDuplicado, setWhatsappDuplicado] = useState<WhatsAppVerificacao | null>(null);
  const [verificandoWhatsapp, setVerificandoWhatsapp] = useState(false);
  const whatsappVerifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estados para documentos
  const [showDocumentoForm, setShowDocumentoForm] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<Documento | null>(null);
  const [documentoForm, setDocumentoForm] = useState({
    titulo: '',
    descricao: '',
    data_documento: format(new Date(), 'yyyy-MM-dd'),
    tipo_documento: '',
    observacoes: '',
    compromisso_id: '',
    arquivo_nome: '',
    arquivo_url: '',
  });
  const [showNovoCompromisso, setShowNovoCompromisso] = useState(false);
  const [novoCompromissoTitulo, setNovoCompromissoTitulo] = useState('');
  const [novoCompromissoData, setNovoCompromissoData] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Tipos de documento predefinidos
  const TIPOS_DOCUMENTO = [
    { value: '', label: 'Selecione um tipo...' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'oficio', label: 'Oficio' },
    { value: 'requerimento', label: 'Requerimento' },
    { value: 'declaracao', label: 'Declaracao' },
    { value: 'certidao', label: 'Certidao' },
    { value: 'comprovante', label: 'Comprovante' },
    { value: 'outros', label: 'Outros' },
  ];

  // Estados para demandas
  const [showDemandaForm, setShowDemandaForm] = useState(false);
  const [demandaForm, setDemandaForm] = useState({
    titulo: '',
    descricao: '',
    dataPrazo: '',
    prioridade: 'normal' as 'baixa' | 'normal' | 'alta' | 'urgente' | 'critica',
    categoriaId: '',
  });
  const [demandaErrors, setDemandaErrors] = useState({
    titulo: false,
    descricao: false,
    categoriaId: false,
    prioridade: false,
    dataPrazo: false,
  });
  const [tipoModalOpen, setTipoModalOpen] = useState(false);
  const [tipoSearch, setTipoSearch] = useState('');
  const [showTipoResults, setShowTipoResults] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<CategoriaListItem | null>(null);
  const tipoRef = useRef<HTMLDivElement>(null);

  // Prioridades de demanda
  const PRIORIDADES_DEMANDA = [
    { value: 'baixa', label: 'Baixa', cor: 'text-slate-500' },
    { value: 'normal', label: 'Normal', cor: 'text-blue-500' },
    { value: 'alta', label: 'Alta', cor: 'text-amber-500' },
    { value: 'urgente', label: 'Urgente', cor: 'text-orange-500' },
    { value: 'critica', label: 'Critica', cor: 'text-red-500' },
  ];

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
  const setorIdSelecionado = watch('setorId');

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

  // Buscar documentos da pessoa (apenas quando editando)
  const { data: documentosData, isLoading: isLoadingDocumentos, refetch: refetchDocumentos } = useQuery({
    queryKey: ['documentos-pessoa', pessoa?.id],
    queryFn: () => documentosService.listar({ pessoaId: pessoa!.id, perPage: 100 }),
    enabled: isOpen && isEditing && !!pessoa?.id,
  });
  const documentosPessoa = documentosData?.items || [];

  // Buscar compromissos da pessoa (apenas quando editando)
  const { data: compromissosData, refetch: refetchCompromissos } = useQuery({
    queryKey: ['compromissos-pessoa', pessoa?.id],
    queryFn: () => compromissosService.listarSimples(undefined, pessoa!.id),
    enabled: isOpen && isEditing && !!pessoa?.id,
  });
  const compromissosPessoa = compromissosData || [];

  // Buscar demandas da pessoa (apenas quando editando)
  const { data: demandasData, isLoading: isLoadingDemandas, refetch: refetchDemandas } = useQuery({
    queryKey: ['demandas-pessoa', pessoa?.id],
    queryFn: () => demandasService.listar({ pessoaId: pessoa!.id, perPage: 100 }),
    enabled: isOpen && isEditing && !!pessoa?.id,
  });
  const demandasPessoa = demandasData?.items || [];

  // Buscar categorias de demanda
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-demanda'],
    queryFn: () => categoriasService.listar(true),
    enabled: isOpen && isEditing,
  });
  const categorias = categoriasData || [];

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

  // Buscar subdivisoes do setor selecionado
  const { data: subsetores = [], isLoading: isLoadingSubsetores } = useQuery({
    queryKey: ['subsetores', setorIdSelecionado],
    queryFn: () => setoresService.listarSubsetores(setorIdSelecionado!),
    enabled: isOpen && !!setorIdSelecionado,
  });

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (liderancaRef.current && !liderancaRef.current.contains(event.target as Node)) {
        setShowLiderancaResults(false);
      }
      if (tipoRef.current && !tipoRef.current.contains(event.target as Node)) {
        setShowTipoResults(false);
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
        setorSubdivisaoId: '',
        genero: Genero.NAO_INFORMADO,
        aceitaWhatsapp: true,
        aceitaSms: true,
        aceitaEmail: true,
      });
      setSelectedTags([]);
      setActiveTab('dados');
      prevEstadoRef.current = '';
      prevMunicipioRef.current = '';
      prevSetorRef.current = '';
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
      prevSetorRef.current = pessoaCompleta.setorId || '';

      reset({
        nome: pessoaCompleta.nome,
        whatsapp: pessoaCompleta.whatsapp || '',
        estadoId: pessoaCompleta.estadoId ? String(pessoaCompleta.estadoId) : '',
        municipioId: pessoaCompleta.municipioId || '',
        setorId: pessoaCompleta.setorId || '',
        setorSubdivisaoId: pessoaCompleta.setorSubdivisaoId || '',
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
      setValue('setorSubdivisaoId', '');
    }
    prevEstadoRef.current = estadoIdSelecionado;
  }, [estadoIdSelecionado, setValue]);

  // Limpar setor quando trocar municipio (apenas se mudou de um valor para outro)
  useEffect(() => {
    if (prevMunicipioRef.current && prevMunicipioRef.current !== municipioIdSelecionado) {
      setValue('setorId', '');
      setValue('setorSubdivisaoId', '');
    }
    prevMunicipioRef.current = municipioIdSelecionado;
  }, [municipioIdSelecionado, setValue]);

  // Limpar subdivisao quando trocar setor (apenas se mudou de um valor para outro)
  useEffect(() => {
    if (prevSetorRef.current && prevSetorRef.current !== setorIdSelecionado) {
      setValue('setorSubdivisaoId', '');
    }
    prevSetorRef.current = setorIdSelecionado || '';
  }, [setorIdSelecionado, setValue]);

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
      await queryClient.invalidateQueries({ queryKey: ['mapa-cadastros-cidades'] });
      await queryClient.invalidateQueries({ queryKey: ['mapa-cadastros-setores'] });
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
      await queryClient.invalidateQueries({ queryKey: ['mapa-cadastros-cidades'] });
      await queryClient.invalidateQueries({ queryKey: ['mapa-cadastros-setores'] });
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

  // Mutation para criar documento
  const createDocumentoMutation = useMutation({
    mutationFn: (data: DocumentoCreate) => documentosService.criar(data),
    onSuccess: () => {
      toast.success('Documento cadastrado com sucesso!');
      refetchDocumentos();
      resetDocumentoForm();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao cadastrar documento';
      toast.error(message);
    },
  });

  // Mutation para atualizar documento
  const updateDocumentoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => documentosService.atualizar(id, data),
    onSuccess: () => {
      toast.success('Documento atualizado com sucesso!');
      refetchDocumentos();
      resetDocumentoForm();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar documento';
      toast.error(message);
    },
  });

  // Mutation para excluir documento
  const deleteDocumentoMutation = useMutation({
    mutationFn: (id: string) => documentosService.excluir(id),
    onSuccess: () => {
      toast.success('Documento excluido com sucesso!');
      refetchDocumentos();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao excluir documento';
      toast.error(message);
    },
  });

  // Mutation para criar compromisso
  const createCompromissoMutation = useMutation({
    mutationFn: (data: CompromissoCreate) => compromissosService.criar(data),
    onSuccess: (compromisso) => {
      toast.success('Compromisso criado com sucesso!');
      setDocumentoForm({ ...documentoForm, compromisso_id: compromisso.id });
      setShowNovoCompromisso(false);
      setNovoCompromissoTitulo('');
      refetchCompromissos();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar compromisso';
      toast.error(message);
    },
  });

  // Mutation para criar demanda
  const createDemandaMutation = useMutation({
    mutationFn: (data: DemandaCreate) => demandasService.criar(data),
    onSuccess: () => {
      toast.success('Demanda criada com sucesso!');
      refetchDemandas();
      resetDemandaForm();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar demanda';
      toast.error(message);
    },
  });

  const resetDocumentoForm = () => {
    setShowDocumentoForm(false);
    setEditingDocumento(null);
    setDocumentoForm({
      titulo: '',
      descricao: '',
      data_documento: format(new Date(), 'yyyy-MM-dd'),
      tipo_documento: '',
      observacoes: '',
      compromisso_id: '',
      arquivo_nome: '',
      arquivo_url: '',
    });
    setShowNovoCompromisso(false);
    setNovoCompromissoTitulo('');
  };

  const resetDemandaForm = () => {
    setShowDemandaForm(false);
    setDemandaForm({
      titulo: '',
      descricao: '',
      dataPrazo: '',
      prioridade: 'normal',
      categoriaId: '',
    });
    setDemandaErrors({
      titulo: false,
      descricao: false,
      categoriaId: false,
      prioridade: false,
      dataPrazo: false,
    });
    setTipoSearch('');
    setSelectedTipo(null);
    setShowTipoResults(false);
  };

  // Handler para salvar demanda
  const handleSaveDemanda = () => {
    const errors = {
      titulo: !demandaForm.titulo.trim(),
      descricao: !demandaForm.descricao.trim(),
      categoriaId: !demandaForm.categoriaId,
      prioridade: !demandaForm.prioridade,
      dataPrazo: !demandaForm.dataPrazo,
    };

    setDemandaErrors(errors);

    if (Object.values(errors).some(e => e)) {
      return;
    }

    createDemandaMutation.mutate({
      titulo: demandaForm.titulo.trim(),
      descricao: demandaForm.descricao.trim(),
      prioridade: demandaForm.prioridade,
      categoriaId: demandaForm.categoriaId,
      dataPrazo: demandaForm.dataPrazo,
      pessoaId: pessoa!.id,
    });
  };

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
    setWhatsappDuplicado(null);
    setVerificandoWhatsapp(false);
    if (whatsappVerifyTimeoutRef.current) {
      clearTimeout(whatsappVerifyTimeoutRef.current);
    }
    resetDocumentoForm();
    resetDemandaForm();
    prevEstadoRef.current = '';
    prevMunicipioRef.current = '';
    onClose();
  };

  // Handler para salvar documento
  const handleSaveDocumento = () => {
    if (!documentoForm.titulo.trim()) {
      toast.error('Titulo do documento e obrigatorio');
      return;
    }
    if (!documentoForm.data_documento) {
      toast.error('Data do documento e obrigatoria');
      return;
    }

    const data = {
      titulo: documentoForm.titulo.trim(),
      descricao: documentoForm.descricao.trim() || undefined,
      data_documento: documentoForm.data_documento,
      tipo_documento: documentoForm.tipo_documento || undefined,
      observacoes: documentoForm.observacoes.trim() || undefined,
      compromisso_id: documentoForm.compromisso_id || undefined,
      arquivo_nome: documentoForm.arquivo_nome || undefined,
      arquivo_url: documentoForm.arquivo_url || undefined,
    };

    if (editingDocumento) {
      updateDocumentoMutation.mutate({
        id: editingDocumento.id,
        data,
      });
    } else {
      createDocumentoMutation.mutate({
        ...data,
        pessoa_id: pessoa!.id,
      } as DocumentoCreate);
    }
  };

  // Handler para criar compromisso inline
  const handleCreateCompromisso = () => {
    if (!novoCompromissoTitulo.trim()) {
      toast.error('Titulo do compromisso e obrigatorio');
      return;
    }

    createCompromissoMutation.mutate({
      titulo: novoCompromissoTitulo.trim(),
      data_inicio: novoCompromissoData,
      pessoa_id: pessoa?.id,
    });
  };

  // Handler para editar documento
  const handleEditDocumento = (doc: Documento) => {
    setEditingDocumento(doc);
    setDocumentoForm({
      titulo: doc.titulo,
      descricao: doc.descricao || '',
      data_documento: doc.data_documento,
      tipo_documento: doc.tipo_documento || '',
      observacoes: doc.observacoes || '',
      compromisso_id: doc.compromisso_id || '',
      arquivo_nome: doc.arquivo_nome || '',
      arquivo_url: doc.arquivo_url || '',
    });
    setShowDocumentoForm(true);
  };

  // Handler para excluir documento
  const handleDeleteDocumento = (doc: Documento) => {
    if (confirm(`Tem certeza que deseja excluir o documento "${doc.titulo}"?`)) {
      deleteDocumentoMutation.mutate(doc.id);
    }
  };

  // Handler para salvar tags
  const handleSaveTags = () => {
    saveTagsMutation.mutate(selectedTags);
  };

  // Handler para pular etapa de tags
  const handleSkipTags = () => {
    handleClose();
  };

  // Funcao para verificar WhatsApp duplicado (com debounce)
  const verificarWhatsApp = useCallback(async (whatsapp: string) => {
    // Limpa timeout anterior
    if (whatsappVerifyTimeoutRef.current) {
      clearTimeout(whatsappVerifyTimeoutRef.current);
    }

    const whatsappLimpo = unmask(whatsapp);

    // Nao verifica se o numero esta incompleto
    if (whatsappLimpo.length < 10) {
      setWhatsappDuplicado(null);
      return;
    }

    // Debounce de 500ms
    whatsappVerifyTimeoutRef.current = setTimeout(async () => {
      setVerificandoWhatsapp(true);
      try {
        const resultado = await pessoasService.verificarWhatsApp(
          whatsapp,
          isEditing ? pessoa?.id : undefined
        );
        setWhatsappDuplicado(resultado);
      } catch (error) {
        console.error('Erro ao verificar WhatsApp:', error);
        setWhatsappDuplicado(null);
      } finally {
        setVerificandoWhatsapp(false);
      }
    }, 500);
  }, [isEditing, pessoa?.id]);

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
      setorSubdivisaoId: data.setorSubdivisaoId || undefined,
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
    // Aba de documentos apenas quando editando
    ...(isEditing ? [{ id: 'documentos', label: 'Documentos', icon: Files }] : []),
    // Aba de demandas apenas quando editando
    ...(isEditing ? [{ id: 'demandas', label: 'Demandas', icon: ClipboardList }] : []),
  ];

  const estadoOptions = estados.map((e) => ({ value: String(e.id), label: `${e.sigla} - ${e.nome}` }));
  const municipioOptions = municipios.map((m) => ({ value: m.id, label: m.nome }));
  const setorOptions = setores.map((s) => ({ value: s.id, label: s.nome }));
  const subsetorOptions = subsetores.map((s) => ({ value: s.id, label: s.nome }));

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
      <div className="flex flex-wrap border-b border-slate-200 mb-6 -mx-6 px-6 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                  <div>
                    <Input
                      label="WhatsApp *"
                      placeholder="(00) 00000-0000"
                      leftIcon={<MessageCircle className="w-4 h-4" />}
                      value={field.value}
                      onChange={(e) => {
                        const masked = maskPhone(e.target.value);
                        field.onChange(masked);
                        verificarWhatsApp(masked);
                      }}
                      error={errors.whatsapp?.message}
                      className={whatsappDuplicado?.existe ? 'border-red-500 focus:ring-red-500' : ''}
                      rightIcon={verificandoWhatsapp ? (
                        <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                      ) : undefined}
                    />
                    {whatsappDuplicado?.existe && whatsappDuplicado.pessoa && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          Este WhatsApp ja esta cadastrado para{' '}
                          <button
                            type="button"
                            onClick={() => {
                              if (onEditPessoa && whatsappDuplicado.pessoa) {
                                handleClose();
                                onEditPessoa(whatsappDuplicado.pessoa.id);
                              }
                            }}
                            className="font-semibold text-red-800 underline hover:text-red-900"
                          >
                            {whatsappDuplicado.pessoa.nome}
                          </button>
                        </p>
                      </div>
                    )}
                  </div>
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

              {/* Subdivisao do Setor (opcional) - destaque laranja quando disponivel */}
              {setorIdSelecionado && (isLoadingSubsetores || subsetorOptions.length > 0) && (
                <div className="md:col-span-2">
                  <div className={`rounded-lg p-4 ${subsetorOptions.length > 0 ? 'bg-orange-100 border-2 border-orange-500 shadow-md' : 'bg-gray-50'}`}>
                    {subsetorOptions.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-bold text-orange-700">
                          Este setor possui {subsetorOptions.length} subdivisao(oes) - selecione se desejar
                        </span>
                      </div>
                    )}
                    <Controller
                      name="setorSubdivisaoId"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          label="Subdivisao (opcional)"
                          options={subsetorOptions}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder={isLoadingSubsetores ? "Carregando subdivisoes..." : "Selecione uma subdivisao..."}
                          loading={isLoadingSubsetores}
                        />
                      )}
                    />
                  </div>
                </div>
              )}

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

        {/* Tab: Documentos (apenas quando editando) */}
        {activeTab === 'documentos' && isEditing && (
          <div className="space-y-4">
            {/* Header com botao de adicionar */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {documentosPessoa.length} documento(s) vinculado(s)
              </p>
              <Button
                type="button"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  resetDocumentoForm();
                  setShowDocumentoForm(true);
                }}
              >
                Novo Documento
              </Button>
            </div>

            {/* Formulario de documento (inline) */}
            {showDocumentoForm && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <h4 className="font-medium text-slate-900">
                  {editingDocumento ? 'Editar Documento' : 'Novo Documento'}
                </h4>

                {/* Titulo */}
                <Input
                  label="Titulo *"
                  placeholder="Digite o titulo do documento..."
                  leftIcon={<FileText className="w-4 h-4" />}
                  value={documentoForm.titulo}
                  onChange={(e) => setDocumentoForm({ ...documentoForm, titulo: e.target.value })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Data do Documento */}
                  <Input
                    label="Data do Documento *"
                    type="date"
                    leftIcon={<Calendar className="w-4 h-4" />}
                    value={documentoForm.data_documento}
                    onChange={(e) => setDocumentoForm({ ...documentoForm, data_documento: e.target.value })}
                  />

                  {/* Tipo de Documento */}
                  <SearchableSelect
                    label="Tipo de Documento"
                    value={documentoForm.tipo_documento}
                    onChange={(value) => setDocumentoForm({ ...documentoForm, tipo_documento: value })}
                    options={TIPOS_DOCUMENTO}
                    placeholder="Selecione um tipo..."
                  />
                </div>

                {/* Descricao */}
                <Textarea
                  label="Descricao"
                  placeholder="Descreva o documento..."
                  rows={2}
                  value={documentoForm.descricao}
                  onChange={(e) => setDocumentoForm({ ...documentoForm, descricao: e.target.value })}
                />

                {/* Compromisso Vinculado */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">
                      Compromisso Vinculado
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNovoCompromisso(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Novo Compromisso
                    </button>
                  </div>
                  <SearchableSelect
                    value={documentoForm.compromisso_id}
                    onChange={(value) => setDocumentoForm({ ...documentoForm, compromisso_id: value })}
                    options={[
                      { value: '', label: 'Nenhum compromisso' },
                      ...compromissosPessoa.map((c) => ({
                        value: c.id,
                        label: `${c.titulo} (${format(new Date(c.data_inicio), 'dd/MM/yyyy')})`,
                      }))
                    ]}
                    placeholder="Selecione um compromisso..."
                  />
                </div>

                {/* Novo Compromisso */}
                {showNovoCompromisso && (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-slate-900">Novo Compromisso</h5>
                      <button
                        type="button"
                        onClick={() => setShowNovoCompromisso(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Titulo *"
                        value={novoCompromissoTitulo}
                        onChange={(e) => setNovoCompromissoTitulo(e.target.value)}
                        placeholder="Titulo do compromisso..."
                      />
                      <Input
                        label="Data *"
                        type="date"
                        value={novoCompromissoData}
                        onChange={(e) => setNovoCompromissoData(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateCompromisso}
                        isLoading={createCompromissoMutation.isPending}
                      >
                        Criar Compromisso
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload de Arquivo */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Arquivo Digital
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors cursor-pointer relative">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      Arraste um arquivo ou clique para selecionar
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PDF, DOC, DOCX, JPG, PNG (max. 10MB)
                    </p>
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDocumentoForm({
                            ...documentoForm,
                            arquivo_nome: file.name,
                          });
                          toast.success(`Arquivo "${file.name}" selecionado`);
                        }
                      }}
                    />
                  </div>
                  {documentoForm.arquivo_nome && (
                    <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg">
                      <span className="text-sm text-slate-600">
                        Arquivo: <span className="font-medium">{documentoForm.arquivo_nome}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setDocumentoForm({ ...documentoForm, arquivo_nome: '', arquivo_url: '' })}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Observacoes */}
                <Textarea
                  label="Observacoes"
                  placeholder="Observacoes adicionais..."
                  rows={2}
                  value={documentoForm.observacoes}
                  onChange={(e) => setDocumentoForm({ ...documentoForm, observacoes: e.target.value })}
                />

                {/* Botoes */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={resetDocumentoForm}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    leftIcon={<Save className="w-4 h-4" />}
                    onClick={handleSaveDocumento}
                    isLoading={createDocumentoMutation.isPending || updateDocumentoMutation.isPending}
                  >
                    {editingDocumento ? 'Salvar Alteracoes' : 'Cadastrar Documento'}
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de documentos */}
            {isLoadingDocumentos ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : documentosPessoa.length === 0 ? (
              <div className="text-center py-8">
                <Files className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum documento cadastrado</p>
                <p className="text-sm text-slate-400">Clique em "Novo Documento" para adicionar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documentosPessoa.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.titulo}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {doc.tipo_documento && (
                            <span className="px-2 py-0.5 bg-slate-100 rounded">{doc.tipo_documento}</span>
                          )}
                          <span>{new Date(doc.data_documento).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.arquivo_url && (
                        <a
                          href={doc.arquivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Visualizar arquivo"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditDocumento(doc)}
                        className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocumento(doc)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Demandas (apenas quando editando) */}
        {activeTab === 'demandas' && isEditing && (
          <div className="space-y-4">
            {/* Header com botao de adicionar */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {demandasPessoa.length} demanda(s) vinculada(s)
              </p>
              <Button
                type="button"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  resetDemandaForm();
                  setShowDemandaForm(true);
                }}
              >
                Nova Demanda
              </Button>
            </div>

            {/* Formulario de demanda (inline) */}
            {showDemandaForm && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <h4 className="font-medium text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Nova Demanda
                </h4>

                {/* Titulo */}
                <div>
                  <Input
                    label="Titulo da Demanda *"
                    placeholder="Descreva brevemente a demanda..."
                    leftIcon={<FileText className="w-4 h-4" />}
                    value={demandaForm.titulo}
                    onChange={(e) => {
                      setDemandaForm({ ...demandaForm, titulo: e.target.value });
                      if (demandaErrors.titulo) setDemandaErrors({ ...demandaErrors, titulo: false });
                    }}
                    error={demandaErrors.titulo ? 'Campo obrigatorio' : undefined}
                  />
                </div>

                {/* Descricao */}
                <div>
                  <Textarea
                    label="Descricao *"
                    placeholder="Descreva detalhadamente a demanda..."
                    rows={4}
                    value={demandaForm.descricao}
                    onChange={(e) => {
                      setDemandaForm({ ...demandaForm, descricao: e.target.value });
                      if (demandaErrors.descricao) setDemandaErrors({ ...demandaErrors, descricao: false });
                    }}
                    error={demandaErrors.descricao ? 'Campo obrigatorio' : undefined}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de Demanda */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                        <Tag className="w-4 h-4" />
                        <span>Tipo de Demanda *</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTipoModalOpen(true)}
                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Novo Tipo
                      </button>
                    </div>
                    <div className="relative" ref={tipoRef}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar tipo de demanda..."
                          value={tipoSearch}
                          onChange={(e) => {
                            setTipoSearch(e.target.value);
                            setShowTipoResults(true);
                            if (demandaErrors.categoriaId) setDemandaErrors({ ...demandaErrors, categoriaId: false });
                            if (!e.target.value) {
                              setSelectedTipo(null);
                              setDemandaForm({ ...demandaForm, categoriaId: '' });
                            }
                          }}
                          onFocus={() => setShowTipoResults(true)}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
                            demandaErrors.categoriaId ? 'border-red-500' : 'border-slate-200'
                          }`}
                        />
                      </div>

                      {/* Resultados da busca */}
                      {showTipoResults && categorias.filter(c =>
                        c.nome.toLowerCase().includes(tipoSearch.toLowerCase())
                      ).length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 max-h-48 overflow-auto">
                          {categorias
                            .filter(c => c.nome.toLowerCase().includes(tipoSearch.toLowerCase()))
                            .map((categoria) => (
                              <button
                                key={categoria.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTipo(categoria);
                                  setTipoSearch(categoria.nome);
                                  setDemandaForm({ ...demandaForm, categoriaId: categoria.id });
                                  setShowTipoResults(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-primary-50 flex items-center gap-3"
                              >
                                <span
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: categoria.cor }}
                                />
                                <span className="font-medium text-slate-900 text-sm">{categoria.nome}</span>
                              </button>
                            ))}
                        </div>
                      )}

                      {/* Nenhum resultado */}
                      {showTipoResults && tipoSearch && categorias.filter(c =>
                        c.nome.toLowerCase().includes(tipoSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center text-slate-500 text-sm">
                          Nenhum tipo encontrado
                        </div>
                      )}
                    </div>
                    {selectedTipo && (
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedTipo.cor }}
                        />
                        <span className="text-sm text-slate-600">{selectedTipo.nome}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTipo(null);
                            setTipoSearch('');
                            setDemandaForm({ ...demandaForm, categoriaId: '' });
                          }}
                          className="text-xs text-slate-400 hover:text-red-500 ml-auto"
                        >
                          Limpar
                        </button>
                      </div>
                    )}
                    {demandaErrors.categoriaId && (
                      <p className="mt-1 text-xs text-red-500">Campo obrigatorio</p>
                    )}
                  </div>

                  {/* Prioridade */}
                  <div>
                    <div className="flex items-center gap-2 text-slate-700 font-medium text-sm mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Prioridade *</span>
                    </div>
                    <select
                      value={demandaForm.prioridade}
                      onChange={(e) => {
                        setDemandaForm({ ...demandaForm, prioridade: e.target.value as any });
                        if (demandaErrors.prioridade) setDemandaErrors({ ...demandaErrors, prioridade: false });
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
                        demandaErrors.prioridade ? 'border-red-500' : 'border-slate-200'
                      }`}
                    >
                      {PRIORIDADES_DEMANDA.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    {demandaErrors.prioridade && (
                      <p className="mt-1 text-xs text-red-500">Campo obrigatorio</p>
                    )}
                  </div>
                </div>

                {/* Data Prazo */}
                <div>
                  <div className="flex items-center gap-2 text-slate-700 font-medium text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Prazo *</span>
                  </div>
                  <Input
                    type="date"
                    value={demandaForm.dataPrazo}
                    onChange={(e) => {
                      setDemandaForm({ ...demandaForm, dataPrazo: e.target.value });
                      if (demandaErrors.dataPrazo) setDemandaErrors({ ...demandaErrors, dataPrazo: false });
                    }}
                    error={demandaErrors.dataPrazo ? 'Campo obrigatorio' : undefined}
                  />
                </div>

                {/* Botoes */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={resetDemandaForm}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    leftIcon={<Save className="w-4 h-4" />}
                    onClick={handleSaveDemanda}
                    isLoading={createDemandaMutation.isPending}
                  >
                    Criar Demanda
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de demandas */}
            {isLoadingDemandas ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : demandasPessoa.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma demanda cadastrada</p>
                <p className="text-sm text-slate-400">Clique em "Nova Demanda" para adicionar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {demandasPessoa.map((demanda) => {
                  const prioridadeInfo = PRIORIDADES_DEMANDA.find(p => p.value === demanda.prioridade);
                  return (
                    <div
                      key={demanda.id}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: demanda.categoriaCor ? `${demanda.categoriaCor}20` : '#f1f5f9' }}
                        >
                          <ClipboardList
                            className="w-5 h-5"
                            style={{ color: demanda.categoriaCor || '#64748b' }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{demanda.titulo}</p>
                            <span className={`text-xs font-medium ${prioridadeInfo?.cor || 'text-slate-500'}`}>
                              {prioridadeInfo?.label || demanda.prioridade}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="px-2 py-0.5 bg-slate-100 rounded">{demanda.numeroProtocolo}</span>
                            {demanda.categoriaNome && (
                              <span
                                className="px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: demanda.categoriaCor ? `${demanda.categoriaCor}20` : '#f1f5f9',
                                  color: demanda.categoriaCor || '#64748b'
                                }}
                              >
                                {demanda.categoriaNome}
                              </span>
                            )}
                            <span>{new Date(demanda.dataAbertura).toLocaleDateString('pt-BR')}</span>
                            {demanda.dataPrazo && (
                              <span className="text-amber-600">
                                Prazo: {new Date(demanda.dataPrazo).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          demanda.status === 'aberta' ? 'bg-blue-100 text-blue-700' :
                          demanda.status === 'em_andamento' ? 'bg-amber-100 text-amber-700' :
                          demanda.status === 'aguardando' ? 'bg-purple-100 text-purple-700' :
                          demanda.status === 'concluida' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {demanda.status === 'aberta' ? 'Aberta' :
                           demanda.status === 'em_andamento' ? 'Em Andamento' :
                           demanda.status === 'aguardando' ? 'Aguardando' :
                           demanda.status === 'concluida' ? 'Concluida' :
                           'Cancelada'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* Modal de Tipo de Demanda */}
      <CategoriaFormModal
        isOpen={tipoModalOpen}
        onClose={() => setTipoModalOpen(false)}
      />
    </Modal>
  );
};
