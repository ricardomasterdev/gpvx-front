import api from './api';

// =====================================================
// Tipos para Demandas
// =====================================================

export type StatusDemanda = 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';
export type PrioridadeDemanda = 'baixa' | 'normal' | 'alta' | 'urgente' | 'critica';

export interface DemandaListItem {
  id: string;
  numeroProtocolo: string;
  titulo: string;
  status: StatusDemanda;
  prioridade: PrioridadeDemanda;
  nomeSolicitante?: string;
  pessoaId?: string;
  pessoaNome?: string;
  categoriaId?: string;
  categoriaNome?: string;
  categoriaCor?: string;
  dataAbertura: string;
  dataPrazo?: string;
  diasAberto: number;
}

export interface DemandaCreate {
  titulo: string;
  descricao: string;
  categoriaId?: string;
  prioridade?: PrioridadeDemanda;
  pessoaId?: string;
  nomeSolicitante?: string;
  contatoSolicitante?: string;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  cidadeId?: number;
  orgaoDestino?: string;
  dataPrazo?: string;
  responsavelId?: string;
}

export interface DemandaUpdate {
  titulo?: string;
  descricao?: string;
  categoriaId?: string;
  status?: StatusDemanda;
  prioridade?: PrioridadeDemanda;
  responsavelId?: string;
  orgaoDestino?: string;
  numeroOficio?: string;
  dataEncaminhamento?: string;
  dataPrazo?: string;
  parecer?: string;
}

export interface DemandaResponse {
  id: string;
  gabineteId: string;
  numeroProtocolo: string;
  titulo: string;
  descricao: string;
  status: StatusDemanda;
  prioridade: PrioridadeDemanda;
  categoriaId?: string;
  pessoaId?: string;
  nomeSolicitante?: string;
  contatoSolicitante?: string;
  dataAbertura: string;
  dataPrazo?: string;
  dataConclusao?: string;
  orgaoDestino?: string;
  numeroOficio?: string;
  dataEncaminhamento?: string;
  parecer?: string;
}

export interface CategoriaListItem {
  id: string;
  gabineteId: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone?: string;
  slaDias: number;
  ordem: number;
  ativo: boolean;
}

export interface CategoriaCreate {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  slaDias?: number;
}

export interface ListDemandasParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: StatusDemanda;
  prioridade?: PrioridadeDemanda;
  categoriaId?: string;
  pessoaId?: string;
  dataInicio?: string;
  dataFim?: string;
  atrasadas?: boolean;
}

export interface PaginatedDemandasResponse {
  items: DemandaListItem[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

// =====================================================
// Funcoes de mapeamento (snake_case -> camelCase)
// =====================================================

function mapDemandaListFromApi(data: any): DemandaListItem {
  return {
    id: data.id,
    numeroProtocolo: data.numero_protocolo,
    titulo: data.titulo,
    status: data.status,
    prioridade: data.prioridade,
    nomeSolicitante: data.nome_solicitante,
    pessoaId: data.pessoa_id,
    pessoaNome: data.pessoa_nome,
    categoriaId: data.categoria_id,
    categoriaNome: data.categoria_nome,
    categoriaCor: data.categoria_cor,
    dataAbertura: data.data_abertura,
    dataPrazo: data.data_prazo,
    diasAberto: data.dias_aberto || 0,
  };
}

function mapDemandaResponseFromApi(data: any): DemandaResponse {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    numeroProtocolo: data.numero_protocolo,
    titulo: data.titulo,
    descricao: data.descricao,
    status: data.status,
    prioridade: data.prioridade,
    categoriaId: data.categoria_id,
    pessoaId: data.pessoa_id,
    nomeSolicitante: data.nome_solicitante,
    contatoSolicitante: data.contato_solicitante,
    dataAbertura: data.data_abertura,
    dataPrazo: data.data_prazo,
    dataConclusao: data.data_conclusao,
    orgaoDestino: data.orgao_destino,
    numeroOficio: data.numero_oficio,
    dataEncaminhamento: data.data_encaminhamento,
    parecer: data.parecer,
  };
}

function mapCategoriaFromApi(data: any): CategoriaListItem {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    nome: data.nome,
    descricao: data.descricao,
    cor: data.cor || '#6B7280',
    icone: data.icone,
    slaDias: data.sla_dias || 30,
    ordem: data.ordem || 0,
    ativo: data.ativo ?? true,
  };
}

function mapDemandaToApi(data: DemandaCreate | DemandaUpdate): any {
  const result: any = {};

  if ('titulo' in data && data.titulo !== undefined) result.titulo = data.titulo;
  if ('descricao' in data && data.descricao !== undefined) result.descricao = data.descricao;
  if ('categoriaId' in data) result.categoria_id = data.categoriaId || null;
  if ('status' in data && data.status !== undefined) result.status = data.status;
  if ('prioridade' in data && data.prioridade !== undefined) result.prioridade = data.prioridade;
  if ('pessoaId' in data) result.pessoa_id = data.pessoaId || null;
  if ('nomeSolicitante' in data) result.nome_solicitante = data.nomeSolicitante || null;
  if ('contatoSolicitante' in data) result.contato_solicitante = data.contatoSolicitante || null;
  if ('cep' in data) result.cep = data.cep || null;
  if ('logradouro' in data) result.logradouro = data.logradouro || null;
  if ('bairro' in data) result.bairro = data.bairro || null;
  if ('cidadeId' in data) result.cidade_id = data.cidadeId || null;
  if ('orgaoDestino' in data) result.orgao_destino = data.orgaoDestino || null;
  if ('dataPrazo' in data) result.data_prazo = data.dataPrazo || null;
  if ('responsavelId' in data) result.responsavel_id = data.responsavelId || null;
  if ('numeroOficio' in data) result.numero_oficio = data.numeroOficio || null;
  if ('dataEncaminhamento' in data) result.data_encaminhamento = data.dataEncaminhamento || null;
  if ('parecer' in data) result.parecer = data.parecer || null;

  return result;
}

function mapCategoriaToApi(data: CategoriaCreate): any {
  return {
    nome: data.nome,
    descricao: data.descricao || null,
    cor: data.cor || '#6B7280',
    icone: data.icone || null,
    sla_dias: data.slaDias || 30,
  };
}

// =====================================================
// Demandas Service
// =====================================================

export const demandasService = {
  async listar(params: ListDemandasParams = {}): Promise<PaginatedDemandasResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.prioridade) queryParams.append('prioridade', params.prioridade);
    if (params.categoriaId) queryParams.append('categoria_id', params.categoriaId);
    if (params.pessoaId) queryParams.append('pessoa_id', params.pessoaId);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);
    if (params.atrasadas) queryParams.append('atrasadas', 'true');

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/demandas${query ? `?${query}` : ''}`);

    return {
      items: data.items.map(mapDemandaListFromApi),
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      pages: data.pages,
    };
  },

  async obter(id: string): Promise<DemandaResponse> {
    const { data } = await api.get<any>(`/demandas/${id}`);
    return mapDemandaResponseFromApi(data);
  },

  async criar(demanda: DemandaCreate): Promise<DemandaResponse> {
    const { data } = await api.post<any>('/demandas', mapDemandaToApi(demanda));
    return mapDemandaResponseFromApi(data);
  },

  async atualizar(id: string, demanda: DemandaUpdate): Promise<DemandaResponse> {
    const { data } = await api.put<any>(`/demandas/${id}`, mapDemandaToApi(demanda));
    return mapDemandaResponseFromApi(data);
  },

  async cancelar(id: string): Promise<void> {
    await api.delete(`/demandas/${id}`);
  },
};

// =====================================================
// Categorias Service
// =====================================================

export const categoriasService = {
  async listar(ativo: boolean = true): Promise<CategoriaListItem[]> {
    const { data } = await api.get<any[]>(`/categorias?ativo=${ativo}`);
    return data.map(mapCategoriaFromApi);
  },

  async obter(id: string): Promise<CategoriaListItem> {
    const { data } = await api.get<any>(`/categorias/${id}`);
    return mapCategoriaFromApi(data);
  },

  async criar(categoria: CategoriaCreate): Promise<CategoriaListItem> {
    const { data } = await api.post<any>('/categorias', mapCategoriaToApi(categoria));
    return mapCategoriaFromApi(data);
  },

  async atualizar(id: string, categoria: CategoriaCreate): Promise<CategoriaListItem> {
    const { data } = await api.put<any>(`/categorias/${id}`, mapCategoriaToApi(categoria));
    return mapCategoriaFromApi(data);
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/categorias/${id}`);
  },
};
