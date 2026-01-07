import api from './api';

// =====================================================
// Tipos para Documentos
// =====================================================

export interface Documento {
  id: string;
  gabinete_id: string;
  pessoa_id: string;
  compromisso_id?: string;
  titulo: string;
  descricao?: string;
  data_documento: string;
  tipo_documento?: string;
  observacoes?: string;
  arquivo_nome?: string;
  arquivo_url?: string;
  arquivo_tipo?: string;
  arquivo_tamanho?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  criado_por?: string;
  pessoa_nome?: string;
  compromisso_titulo?: string;
}

export interface DocumentoCreate {
  titulo: string;
  descricao?: string;
  data_documento: string;
  pessoa_id: string;
  compromisso_id?: string;
  tipo_documento?: string;
  observacoes?: string;
  arquivo_nome?: string;
  arquivo_url?: string;
  arquivo_tipo?: string;
  arquivo_tamanho?: string;
}

export interface DocumentoUpdate {
  titulo?: string;
  descricao?: string;
  data_documento?: string;
  pessoa_id?: string;
  compromisso_id?: string;
  tipo_documento?: string;
  observacoes?: string;
  arquivo_nome?: string;
  arquivo_url?: string;
  arquivo_tipo?: string;
  arquivo_tamanho?: string;
}

export interface DocumentoListResponse {
  items: Documento[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ListDocumentosParams {
  page?: number;
  perPage?: number;
  search?: string;
  pessoaId?: string;
  compromissoId?: string;
  tipoDocumento?: string;
  dataInicio?: string;
  dataFim?: string;
}

// =====================================================
// Tipos para Compromissos
// =====================================================

export interface Compromisso {
  id: string;
  gabinete_id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  hora_inicio?: string;
  hora_fim?: string;
  local?: string;
  pessoa_id?: string;
  responsavel_id?: string;
  concluido: boolean;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  pessoa_nome?: string;
}

export interface CompromissoCreate {
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  hora_inicio?: string;
  hora_fim?: string;
  local?: string;
  pessoa_id?: string;
  responsavel_id?: string;
  concluido?: boolean;
  observacoes?: string;
}

export interface CompromissoUpdate {
  titulo?: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  hora_inicio?: string;
  hora_fim?: string;
  local?: string;
  pessoa_id?: string;
  responsavel_id?: string;
  concluido?: boolean;
  observacoes?: string;
}

export interface CompromissoSimples {
  id: string;
  titulo: string;
  data_inicio: string;
  hora_inicio?: string;
}

export interface CompromissoListResponse {
  items: Compromisso[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ListCompromissosParams {
  page?: number;
  perPage?: number;
  search?: string;
  pessoaId?: string;
  dataInicio?: string;
  dataFim?: string;
  concluido?: boolean;
}

// =====================================================
// Funcoes de mapeamento
// =====================================================

function mapDocumentoFromApi(data: any): Documento {
  return {
    id: data.id,
    gabinete_id: data.gabinete_id,
    pessoa_id: data.pessoa_id,
    compromisso_id: data.compromisso_id,
    titulo: data.titulo,
    descricao: data.descricao,
    data_documento: data.data_documento,
    tipo_documento: data.tipo_documento,
    observacoes: data.observacoes,
    arquivo_nome: data.arquivo_nome,
    arquivo_url: data.arquivo_url,
    arquivo_tipo: data.arquivo_tipo,
    arquivo_tamanho: data.arquivo_tamanho,
    ativo: data.ativo,
    created_at: data.created_at,
    updated_at: data.updated_at,
    criado_por: data.criado_por,
    pessoa_nome: data.pessoa_nome,
    compromisso_titulo: data.compromisso_titulo,
  };
}

function mapCompromissoFromApi(data: any): Compromisso {
  return {
    id: data.id,
    gabinete_id: data.gabinete_id,
    titulo: data.titulo,
    descricao: data.descricao,
    data_inicio: data.data_inicio,
    data_fim: data.data_fim,
    hora_inicio: data.hora_inicio,
    hora_fim: data.hora_fim,
    local: data.local,
    pessoa_id: data.pessoa_id,
    responsavel_id: data.responsavel_id,
    concluido: data.concluido,
    observacoes: data.observacoes,
    ativo: data.ativo,
    created_at: data.created_at,
    updated_at: data.updated_at,
    pessoa_nome: data.pessoa_nome,
  };
}

// =====================================================
// Documentos Service
// =====================================================

export const documentosService = {
  // Listar documentos
  async listar(params: ListDocumentosParams = {}): Promise<DocumentoListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.pessoaId) queryParams.append('pessoa_id', params.pessoaId);
    if (params.compromissoId) queryParams.append('compromisso_id', params.compromissoId);
    if (params.tipoDocumento) queryParams.append('tipo_documento', params.tipoDocumento);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/documentos${query ? `?${query}` : ''}`);

    return {
      items: data.items.map(mapDocumentoFromApi),
      total: data.total,
      page: data.page,
      per_page: data.per_page,
      pages: data.pages,
    };
  },

  // Obter documento por ID
  async obter(id: string): Promise<Documento> {
    const { data } = await api.get<any>(`/documentos/${id}`);
    return mapDocumentoFromApi(data);
  },

  // Criar documento
  async criar(documento: DocumentoCreate): Promise<Documento> {
    const { data } = await api.post<any>('/documentos', documento);
    return mapDocumentoFromApi(data);
  },

  // Atualizar documento
  async atualizar(id: string, documento: DocumentoUpdate): Promise<Documento> {
    const { data } = await api.put<any>(`/documentos/${id}`, documento);
    return mapDocumentoFromApi(data);
  },

  // Excluir documento
  async excluir(id: string): Promise<void> {
    await api.delete(`/documentos/${id}`);
  },
};

// =====================================================
// Compromissos Service
// =====================================================

export const compromissosService = {
  // Listar compromissos
  async listar(params: ListCompromissosParams = {}): Promise<CompromissoListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.pessoaId) queryParams.append('pessoa_id', params.pessoaId);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);
    if (params.concluido !== undefined) queryParams.append('concluido', String(params.concluido));

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/documentos/compromissos/listar${query ? `?${query}` : ''}`);

    return {
      items: data.items.map(mapCompromissoFromApi),
      total: data.total,
      page: data.page,
      per_page: data.per_page,
      pages: data.pages,
    };
  },

  // Listar compromissos simples (para selects)
  async listarSimples(search?: string, pessoaId?: string): Promise<CompromissoSimples[]> {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (pessoaId) queryParams.append('pessoa_id', pessoaId);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/documentos/compromissos/simples${query ? `?${query}` : ''}`);

    return data.map((item: any) => ({
      id: item.id,
      titulo: item.titulo,
      data_inicio: item.data_inicio,
      hora_inicio: item.hora_inicio,
    }));
  },

  // Obter compromisso por ID
  async obter(id: string): Promise<Compromisso> {
    const { data } = await api.get<any>(`/documentos/compromissos/${id}`);
    return mapCompromissoFromApi(data);
  },

  // Criar compromisso
  async criar(compromisso: CompromissoCreate): Promise<Compromisso> {
    const { data } = await api.post<any>('/documentos/compromissos', compromisso);
    return mapCompromissoFromApi(data);
  },

  // Atualizar compromisso
  async atualizar(id: string, compromisso: CompromissoUpdate): Promise<Compromisso> {
    const { data } = await api.put<any>(`/documentos/compromissos/${id}`, compromisso);
    return mapCompromissoFromApi(data);
  },

  // Excluir compromisso
  async excluir(id: string): Promise<void> {
    await api.delete(`/documentos/compromissos/${id}`);
  },
};
