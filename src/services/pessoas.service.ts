import api from './api';
import type { Genero } from '../types';

// =====================================================
// Tipos para Pessoas
// =====================================================

export interface TagSimples {
  id: string;
  nome: string;
  cor: string;
  descricao?: string;
}

export interface PessoaListItem {
  id: string;
  nome: string;
  genero: Genero;
  cpf?: string;
  celular?: string;
  whatsapp?: string;
  email?: string;
  estadoId?: number;
  estadoNome?: string;
  estadoSigla?: string;
  municipioId?: string;
  municipioNome?: string;
  setorId?: string;
  setorNome?: string;
  setorSubdivisaoId?: string;
  setorSubdivisaoNome?: string;
  bairro?: string;
  totalDemandas: number;
  ativo: boolean;
  tags: TagSimples[];
}

export interface PessoaCreate {
  // Campos obrigatorios
  nome: string;
  whatsapp: string;
  estadoId: number;
  municipioId: string;
  setorId: string;
  setorSubdivisaoId?: string;
  genero: Genero;
  // Campos opcionais
  nomeSocial?: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  profissao?: string;
  escolaridade?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  instagram?: string;
  facebook?: string;
  observacoes?: string;
  liderancaId?: string;
  aceitaWhatsapp?: boolean;
  aceitaSms?: boolean;
  aceitaEmail?: boolean;
  tagIds?: string[];
}

export interface PessoaResponse {
  id: string;
  gabineteId: string;
  subgabineteId?: string;
  nome: string;
  genero: Genero;
  whatsapp: string;
  estadoId: number;
  municipioId: string;
  setorId: string;
  setorSubdivisaoId?: string;
  setorSubdivisaoNome?: string;
  nomeSocial?: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  profissao?: string;
  escolaridade?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  instagram?: string;
  facebook?: string;
  observacoes?: string;
  liderancaId?: string;
  liderancaNome?: string;
  aceitaWhatsapp: boolean;
  aceitaSms: boolean;
  aceitaEmail: boolean;
  totalDemandas: number;
  ativo: boolean;
  tags: TagSimples[];
}

export interface PessoaUpdate extends Partial<PessoaCreate> {
  ativo?: boolean;
}

export interface ListPessoasParams {
  page?: number;
  perPage?: number;
  search?: string;
  bairro?: string;
  municipioId?: string;
  estadoId?: string;
  setorId?: string;
  liderancaId?: string;
  ativo?: boolean;
}

export interface PaginatedPessoasResponse {
  items: PessoaListItem[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

// =====================================================
// Funcoes de mapeamento (snake_case -> camelCase)
// =====================================================

function mapTagFromApi(data: any): TagSimples {
  return {
    id: data.id,
    nome: data.nome,
    cor: data.cor || '#6B7280',
    descricao: data.descricao,
  };
}

function mapPessoaListFromApi(data: any): PessoaListItem {
  return {
    id: data.id,
    nome: data.nome,
    genero: data.genero,
    cpf: data.cpf,
    celular: data.celular,
    whatsapp: data.whatsapp,
    email: data.email,
    estadoId: data.estado_id,
    estadoNome: data.estado_nome,
    estadoSigla: data.estado_sigla,
    municipioId: data.municipio_id,
    municipioNome: data.municipio_nome,
    setorId: data.setor_id,
    setorNome: data.setor_nome,
    setorSubdivisaoId: data.setor_subdivisao_id,
    setorSubdivisaoNome: data.setor_subdivisao_nome,
    bairro: data.bairro,
    totalDemandas: data.total_demandas || 0,
    ativo: data.ativo,
    tags: (data.tags || []).map(mapTagFromApi),
  };
}

function mapPessoaResponseFromApi(data: any): PessoaResponse {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    subgabineteId: data.subgabinete_id,
    nome: data.nome,
    genero: data.genero,
    whatsapp: data.whatsapp,
    estadoId: data.estado_id,
    municipioId: data.municipio_id,
    setorId: data.setor_id,
    setorSubdivisaoId: data.setor_subdivisao_id,
    setorSubdivisaoNome: data.setor_subdivisao_nome,
    nomeSocial: data.nome_social,
    cpf: data.cpf,
    rg: data.rg,
    dataNascimento: data.data_nascimento,
    profissao: data.profissao,
    escolaridade: data.escolaridade,
    cep: data.cep,
    logradouro: data.logradouro,
    numero: data.numero,
    complemento: data.complemento,
    bairro: data.bairro,
    email: data.email,
    telefone: data.telefone,
    celular: data.celular,
    instagram: data.instagram,
    facebook: data.facebook,
    observacoes: data.observacoes,
    liderancaId: data.lideranca_id,
    liderancaNome: data.lideranca_nome,
    aceitaWhatsapp: data.aceita_whatsapp ?? true,
    aceitaSms: data.aceita_sms ?? true,
    aceitaEmail: data.aceita_email ?? true,
    totalDemandas: data.total_demandas || 0,
    ativo: data.ativo ?? true,
    tags: (data.tags || []).map(mapTagFromApi),
  };
}

function mapPessoaToApi(data: PessoaCreate | PessoaUpdate): any {
  const result: any = {};

  // Campos obrigatorios
  if (data.nome !== undefined) result.nome = data.nome;
  if (data.whatsapp !== undefined) result.whatsapp = data.whatsapp;
  if (data.estadoId !== undefined) result.estado_id = data.estadoId;
  if (data.municipioId !== undefined) result.municipio_id = data.municipioId;
  if (data.setorId !== undefined) result.setor_id = data.setorId;
  if (data.setorSubdivisaoId !== undefined) result.setor_subdivisao_id = data.setorSubdivisaoId || null;
  if (data.genero !== undefined) result.genero = data.genero;

  // Campos opcionais
  if (data.nomeSocial !== undefined) result.nome_social = data.nomeSocial || null;
  if (data.cpf !== undefined) result.cpf = data.cpf || null;
  if (data.rg !== undefined) result.rg = data.rg || null;
  if (data.dataNascimento !== undefined) result.data_nascimento = data.dataNascimento || null;
  if (data.profissao !== undefined) result.profissao = data.profissao || null;
  if (data.escolaridade !== undefined) result.escolaridade = data.escolaridade || null;
  if (data.cep !== undefined) result.cep = data.cep || null;
  if (data.logradouro !== undefined) result.logradouro = data.logradouro || null;
  if (data.numero !== undefined) result.numero = data.numero || null;
  if (data.complemento !== undefined) result.complemento = data.complemento || null;
  if (data.bairro !== undefined) result.bairro = data.bairro || null;
  if (data.email !== undefined) result.email = data.email || null;
  if (data.telefone !== undefined) result.telefone = data.telefone || null;
  if (data.celular !== undefined) result.celular = data.celular || null;
  if (data.instagram !== undefined) result.instagram = data.instagram || null;
  if (data.facebook !== undefined) result.facebook = data.facebook || null;
  if (data.observacoes !== undefined) result.observacoes = data.observacoes || null;
  if (data.liderancaId !== undefined) result.lideranca_id = data.liderancaId || null;
  if (data.aceitaWhatsapp !== undefined) result.aceita_whatsapp = data.aceitaWhatsapp;
  if (data.aceitaSms !== undefined) result.aceita_sms = data.aceitaSms;
  if (data.aceitaEmail !== undefined) result.aceita_email = data.aceitaEmail;
  if ('ativo' in data && data.ativo !== undefined) result.ativo = data.ativo;
  if (data.tagIds !== undefined) result.tag_ids = data.tagIds;

  return result;
}

// =====================================================
// Pessoas Service
// =====================================================

export interface WhatsAppVerificacao {
  existe: boolean;
  pessoa: {
    id: string;
    nome: string;
  } | null;
}

export const pessoasService = {
  /**
   * Verifica se um WhatsApp ja esta cadastrado
   */
  async verificarWhatsApp(whatsapp: string, excluirId?: string): Promise<WhatsAppVerificacao> {
    const queryParams = new URLSearchParams();
    queryParams.append('whatsapp', whatsapp);
    if (excluirId) queryParams.append('excluir_id', excluirId);

    const { data } = await api.get<WhatsAppVerificacao>(`/pessoas/verificar-whatsapp?${queryParams.toString()}`);
    return data;
  },

  async listar(params: ListPessoasParams = {}): Promise<PaginatedPessoasResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.bairro) queryParams.append('bairro', params.bairro);
    if (params.municipioId) queryParams.append('municipio_id', params.municipioId);
    if (params.estadoId) queryParams.append('estado_id', params.estadoId);
    if (params.setorId) queryParams.append('setor_id', params.setorId);
    if (params.liderancaId) queryParams.append('lideranca_id', params.liderancaId);
    if (params.ativo !== undefined) queryParams.append('ativo', String(params.ativo));

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/pessoas${query ? `?${query}` : ''}`);

    return {
      items: data.items.map(mapPessoaListFromApi),
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      pages: data.pages,
    };
  },

  async obter(id: string): Promise<PessoaResponse> {
    const { data } = await api.get<any>(`/pessoas/${id}`);
    return mapPessoaResponseFromApi(data);
  },

  async criar(pessoa: PessoaCreate): Promise<PessoaResponse> {
    const { data } = await api.post<any>('/pessoas', mapPessoaToApi(pessoa));
    return mapPessoaResponseFromApi(data);
  },

  async atualizar(id: string, pessoa: PessoaUpdate): Promise<PessoaResponse> {
    const { data } = await api.put<any>(`/pessoas/${id}`, mapPessoaToApi(pessoa));
    return mapPessoaResponseFromApi(data);
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/pessoas/${id}`);
  },

  async ativar(id: string): Promise<PessoaResponse> {
    return this.atualizar(id, { ativo: true });
  },

  async desativar(id: string): Promise<PessoaResponse> {
    return this.atualizar(id, { ativo: false });
  },

  async buscarLiderancas(): Promise<PessoaListItem[]> {
    const { data } = await api.get<any>('/pessoas', {
      params: { per_page: 100 },
    });
    return data.items.map(mapPessoaListFromApi);
  },

  async listarSimples(search?: string): Promise<{ id: string; nome: string }[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('per_page', '100');
    if (search) queryParams.append('search', search);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/pessoas${query ? `?${query}` : ''}`);

    return data.items.map((p: any) => ({
      id: p.id,
      nome: p.nome,
    }));
  },
};
