import api from './api';

// =====================================================
// Tipos para Regioes
// =====================================================

export interface MunicipioNaRegiao {
  id: string;
  nome: string;
  estadoId: number;
  estadoSigla?: string;
}

export interface RegiaoListItem {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  totalMunicipios: number;
  municipiosNomes: string[];
}

export interface RegiaoResponse {
  id: string;
  gabineteId: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  createdAt: string;
  updatedAt?: string;
  municipios: MunicipioNaRegiao[];
}

export interface RegiaoCreate {
  nome: string;
  descricao?: string;
  cor?: string;
  municipioIds?: string[];
}

export interface RegiaoUpdate extends Partial<RegiaoCreate> {
  ativo?: boolean;
}

export interface ListRegioesParams {
  search?: string;
  ativo?: boolean;
}

// =====================================================
// Funcoes de mapeamento (snake_case -> camelCase)
// =====================================================

function mapMunicipioNaRegiaoFromApi(data: any): MunicipioNaRegiao {
  return {
    id: data.id,
    nome: data.nome,
    estadoId: data.estado_id,
    estadoSigla: data.estado_sigla,
  };
}

function mapRegiaoListFromApi(data: any): RegiaoListItem {
  return {
    id: data.id,
    nome: data.nome,
    descricao: data.descricao,
    cor: data.cor || '#6B7280',
    ativo: data.ativo,
    totalMunicipios: data.total_municipios || 0,
    municipiosNomes: data.municipios_nomes || [],
  };
}

function mapRegiaoResponseFromApi(data: any): RegiaoResponse {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    nome: data.nome,
    descricao: data.descricao,
    cor: data.cor || '#6B7280',
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    municipios: (data.municipios || []).map(mapMunicipioNaRegiaoFromApi),
  };
}

function mapRegiaoToApi(data: RegiaoCreate | RegiaoUpdate): any {
  const result: any = {};

  if (data.nome !== undefined) result.nome = data.nome;
  if (data.descricao !== undefined) result.descricao = data.descricao || null;
  if (data.cor !== undefined) result.cor = data.cor || '#6B7280';
  if (data.municipioIds !== undefined) result.municipio_ids = data.municipioIds;
  if ('ativo' in data && data.ativo !== undefined) result.ativo = data.ativo;

  return result;
}

// =====================================================
// Regioes Service
// =====================================================

export const regioesService = {
  async listar(params: ListRegioesParams = {}): Promise<RegiaoListItem[]> {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append('search', params.search);
    if (params.ativo !== undefined) queryParams.append('ativo', String(params.ativo));

    const query = queryParams.toString();
    const { data } = await api.get<any[]>(`/regioes${query ? `?${query}` : ''}`);

    return data.map(mapRegiaoListFromApi);
  },

  async obter(id: string): Promise<RegiaoResponse> {
    const { data } = await api.get<any>(`/regioes/${id}`);
    return mapRegiaoResponseFromApi(data);
  },

  async criar(regiao: RegiaoCreate): Promise<RegiaoResponse> {
    const { data } = await api.post<any>('/regioes', mapRegiaoToApi(regiao));
    return mapRegiaoResponseFromApi(data);
  },

  async atualizar(id: string, regiao: RegiaoUpdate): Promise<RegiaoResponse> {
    const { data } = await api.put<any>(`/regioes/${id}`, mapRegiaoToApi(regiao));
    return mapRegiaoResponseFromApi(data);
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/regioes/${id}`);
  },

  async ativar(id: string): Promise<RegiaoResponse> {
    const { data } = await api.post<any>(`/regioes/${id}/ativar`);
    return mapRegiaoResponseFromApi(data);
  },

  async desativar(id: string): Promise<RegiaoResponse> {
    const { data } = await api.post<any>(`/regioes/${id}/desativar`);
    return mapRegiaoResponseFromApi(data);
  },
};
