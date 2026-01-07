import api from './api';

// =====================================================
// Tipos
// =====================================================

export interface EstadoSimples {
  id: number;
  sigla: string;
  nome: string;
}

export interface MunicipioSimples {
  id: string;
  nome: string;
  estadoId: number;
  estadoSigla?: string;
}

export interface SetorSimples {
  id: string;
  nome: string;
}

export interface SetorCreate {
  nome: string;
  descricao?: string;
}

export interface SetorResponse {
  id: string;
  municipioId: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface SetorCreateRequest {
  nome: string;
  descricao?: string;
  municipio_id: string;
}

// =====================================================
// Funcoes auxiliares de mapeamento
// =====================================================

const mapEstado = (data: any): EstadoSimples => ({
  id: data.id,
  sigla: data.sigla,
  nome: data.nome,
});

const mapMunicipio = (data: any): MunicipioSimples => ({
  id: data.id,
  nome: data.nome,
  estadoId: data.estado_id,
  estadoSigla: data.estado_sigla,
});

const mapSetor = (data: any): SetorSimples => ({
  id: data.id,
  nome: data.nome,
});

const mapSetorResponse = (data: any): SetorResponse => ({
  id: data.id,
  municipioId: data.municipio_id,
  nome: data.nome,
  descricao: data.descricao,
  ativo: data.ativo,
});

// =====================================================
// Service
// =====================================================

export const auxiliarService = {
  // Estados
  async listarEstados(search?: string): Promise<EstadoSimples[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await api.get(`/auxiliar/estados?${params}`);
    return response.data.map(mapEstado);
  },

  // Municipios
  async listarMunicipios(estadoId?: number, search?: string, limit = 50): Promise<MunicipioSimples[]> {
    const params = new URLSearchParams();
    if (estadoId) params.append('estado_id', String(estadoId));
    if (search) params.append('search', search);
    params.append('limit', limit.toString());

    const response = await api.get(`/auxiliar/municipios?${params}`);
    return response.data.map(mapMunicipio);
  },

  // Setores
  async listarSetores(municipioId?: string, search?: string): Promise<SetorSimples[]> {
    const params = new URLSearchParams();
    if (municipioId) params.append('municipio_id', municipioId);
    if (search) params.append('search', search);

    const response = await api.get(`/auxiliar/setores?${params}`);
    return response.data.map(mapSetor);
  },

  async criarSetor(municipioId: string, data: SetorCreate): Promise<SetorResponse> {
    const response = await api.post('/auxiliar/setores', {
      nome: data.nome,
      descricao: data.descricao,
      municipio_id: municipioId,
    });
    return mapSetorResponse(response.data);
  },

  async atualizarSetor(id: string, data: Partial<SetorCreate>): Promise<SetorResponse> {
    const response = await api.put(`/auxiliar/setores/${id}`, data);
    return mapSetorResponse(response.data);
  },

  async excluirSetor(id: string): Promise<void> {
    await api.delete(`/auxiliar/setores/${id}`);
  },
};
