import api from './api';

// =====================================================
// Tipos para Relatorios
// =====================================================

export interface RelatorioItem {
  nome: string;
  quantidade: number;
  percentual: number;
}

export interface RelatorioTagItem extends RelatorioItem {
  id: string;
  cor: string;
  tipo?: 'tag' | 'pessoa';
}

export interface RelatorioCidadeItem extends RelatorioItem {
  municipioId: string;
  estadoSigla: string;
  tipo?: 'cidade' | 'pessoa';
}

export interface RelatorioRegiaoItem extends RelatorioItem {
  regiaoId: string;
  cidades?: RelatorioCidadeRegiaoItem[];
  tipo?: 'regiao' | 'pessoa';
}

export interface RelatorioCidadeRegiaoItem {
  municipioId: string;
  nome: string;
  quantidade: number;
  percentual: number;
}

// Tipo para quando uma cidade e selecionada - retorna pessoas
export interface RelatorioPessoaItem {
  pessoaId: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  tipo: 'pessoa';
}

export interface RelatorioLiderancaItem extends RelatorioItem {
  liderancaId: string;
  totalLiderados: number;
  tipo?: 'lideranca' | 'pessoa';
}

export interface RelatorioDemandaTipoItem extends RelatorioItem {
  tipoId: string;
}

export interface RelatorioUsuarioItem extends RelatorioItem {
  usuarioId: string;
  email: string;
  tipo?: 'usuario' | 'pessoa';
}

export interface RelatorioSubgabineteItem extends RelatorioItem {
  subgabineteId: string;
  tipo?: 'subgabinete' | 'pessoa';
}

export interface RelatorioSetorSubdivisaoItem extends RelatorioItem {
  setorSubdivisaoId: string;
  tipo?: 'setor_subdivisao' | 'pessoa';
}

export interface RelatorioSetorRegiaoItem extends RelatorioItem {
  setorRegiaoId: string;
  cor?: string;
  tipo?: 'setor_regiao' | 'pessoa';
}

export interface RelatorioResponse<T> {
  items: T[];
  total: number;
  totalGeral: number;
}

export interface ListRelatorioParams {
  page?: number;
  perPage?: number;
  search?: string;
  dataInicio?: string;
  dataFim?: string;
  estadoId?: number;
  municipioId?: string;
  regiaoId?: string;
  tagId?: string;
  categoriaId?: string;
  usuarioId?: string;
  subgabineteId?: string;
  liderancaId?: string;
  setorSubdivisaoId?: string;
  setorRegiaoId?: string;
}

// =====================================================
// Funcoes de mapeamento
// =====================================================

function mapRelatorioTagFromApi(data: any): RelatorioTagItem | RelatorioPessoaItem {
  // Se tem pessoa_id, e uma pessoa (quando tag esta selecionada)
  if (data.pessoa_id || data.tipo === 'pessoa') {
    return {
      pessoaId: data.pessoa_id,
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email,
      tipo: 'pessoa',
    } as RelatorioPessoaItem;
  }

  return {
    id: data.id || data.tag_id,
    nome: data.nome || data.tag_nome,
    cor: data.cor || '#6B7280',
    quantidade: data.quantidade || data.total || 0,
    percentual: data.percentual || 0,
    tipo: 'tag',
  };
}

function mapRelatorioCidadeFromApi(data: any): RelatorioCidadeItem | RelatorioPessoaItem {
  // Se tem pessoa_id, e uma pessoa (quando cidade esta selecionada)
  if (data.pessoa_id || data.tipo === 'pessoa') {
    return {
      pessoaId: data.pessoa_id,
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email,
      tipo: 'pessoa',
    } as RelatorioPessoaItem;
  }

  return {
    municipioId: data.municipio_id,
    nome: data.nome || data.municipio_nome,
    estadoSigla: data.estado_sigla || data.uf,
    quantidade: data.quantidade || data.total || 0,
    percentual: data.percentual || 0,
    tipo: 'cidade',
  };
}

function mapRelatorioRegiaoFromApi(data: any): RelatorioRegiaoItem | RelatorioPessoaItem {
  // Se tem pessoa_id, e uma pessoa (quando cidade esta selecionada)
  if (data.pessoa_id || data.tipo === 'pessoa') {
    return {
      pessoaId: data.pessoa_id,
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email,
      tipo: 'pessoa',
    } as RelatorioPessoaItem;
  }

  // Caso contrario, e uma regiao
  return {
    regiaoId: data.regiao_id,
    nome: data.nome || data.regiao_nome,
    quantidade: data.quantidade || data.total || 0,
    percentual: data.percentual || 0,
    cidades: data.cidades?.map((c: any) => ({
      municipioId: c.municipio_id,
      nome: c.nome || c.municipio_nome,
      quantidade: c.quantidade || 0,
      percentual: c.percentual || 0,
    })),
    tipo: 'regiao',
  };
}

function mapRelatorioLiderancaFromApi(data: any): RelatorioLiderancaItem | RelatorioPessoaItem {
  // Se tem pessoa_id, e uma pessoa (quando lideranca esta selecionada)
  if (data.pessoa_id || data.tipo === 'pessoa') {
    return {
      pessoaId: data.pessoa_id,
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email,
      tipo: 'pessoa',
    } as RelatorioPessoaItem;
  }

  return {
    liderancaId: data.lideranca_id,
    nome: data.nome || data.lideranca_nome,
    totalLiderados: data.total_liderados || data.quantidade || 0,
    quantidade: data.quantidade || data.total || 0,
    percentual: data.percentual || 0,
    tipo: 'lideranca',
  };
}

function mapRelatorioDemandaTipoFromApi(data: any): RelatorioDemandaTipoItem {
  return {
    tipoId: data.tipo_id,
    nome: data.nome || data.tipo_nome,
    quantidade: data.quantidade || data.total || 0,
    percentual: data.percentual || 0,
  };
}

function mapRelatorioUsuarioFromApi(data: any): RelatorioUsuarioItem | RelatorioPessoaItem {
  // Se tem pessoa_id, e uma pessoa (quando usuario esta selecionado)
  if (data.pessoa_id || data.tipo === 'pessoa') {
    return {
      pessoaId: data.pessoa_id,
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email,
      tipo: 'pessoa',
    } as RelatorioPessoaItem;
  }

  return {
    usuarioId: data.usuario_id,
    nome: data.nome || data.usuario_nome,
    email: data.email || '',
    quantidade: data.quantidade || data.total || 0,
    percentual: data.percentual || 0,
    tipo: 'usuario',
  };
}

function mapRelatorioSubgabineteFromApi(data: any): RelatorioSubgabineteItem | RelatorioPessoaItem {
  // Se tem pessoa_id, e uma pessoa (quando subgabinete esta selecionado)
  if (data.pessoa_id || data.tipo === 'pessoa') {
    return {
      pessoaId: data.pessoa_id,
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email,
      tipo: 'pessoa',
    } as RelatorioPessoaItem;
  }

  return {
    subgabineteId: data.subgabinete_id,
    nome: data.nome || data.subgabinete_nome,
    quantidade: data.quantidade || data.total || 0,
    percentual: data.percentual || 0,
    tipo: 'subgabinete',
  };
}

function mapRelatorioSetorSubdivisaoFromApi(data: any): RelatorioSetorSubdivisaoItem | RelatorioPessoaItem {
  // Se tem pessoa_id, e uma pessoa (quando subdivisao esta selecionada)
  if (data.pessoa_id || data.tipo === 'pessoa') {
    return {
      pessoaId: data.pessoa_id,
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email,
      tipo: 'pessoa',
    } as RelatorioPessoaItem;
  }

  return {
    setorSubdivisaoId: data.setor_subdivisao_id,
    nome: data.nome,
    quantidade: data.quantidade || data.total || 0,
    percentual: data.percentual || 0,
    tipo: 'setor_subdivisao',
  };
}

function mapRelatorioSetorRegiaoFromApi(data: any): RelatorioSetorRegiaoItem | RelatorioPessoaItem {
  // Se tem pessoa_id, e uma pessoa (quando setor regiao esta selecionada)
  if (data.pessoa_id || data.tipo === 'pessoa') {
    return {
      pessoaId: data.pessoa_id,
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email,
      tipo: 'pessoa',
    } as RelatorioPessoaItem;
  }

  return {
    setorRegiaoId: data.setor_regiao_id,
    nome: data.nome,
    cor: data.cor || '#6B7280',
    quantidade: data.quantidade || data.total || 0,
    percentual: data.percentual || 0,
    tipo: 'setor_regiao',
  };
}

// =====================================================
// Relatorios Service
// =====================================================

export const relatoriosService = {
  // Pessoas por Tags
  async pessoasPorTag(params: ListRelatorioParams = {}): Promise<RelatorioResponse<RelatorioTagItem | RelatorioPessoaItem>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);
    if (params.tagId) queryParams.append('tag_id', params.tagId);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/relatorios/pessoas-por-tag${query ? `?${query}` : ''}`);

    return {
      items: (data.items || data).map(mapRelatorioTagFromApi),
      total: data.total || data.length || 0,
      totalGeral: data.total_geral || data.total || 0,
    };
  },

  // Pessoas por Cidade
  async pessoasPorCidade(params: ListRelatorioParams = {}): Promise<RelatorioResponse<RelatorioCidadeItem | RelatorioPessoaItem>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);
    if (params.estadoId) queryParams.append('estado_id', String(params.estadoId));
    if (params.municipioId) queryParams.append('municipio_id', params.municipioId);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/relatorios/pessoas-por-cidade${query ? `?${query}` : ''}`);

    return {
      items: (data.items || data).map(mapRelatorioCidadeFromApi),
      total: data.total || data.length || 0,
      totalGeral: data.total_geral || data.total || 0,
    };
  },

  // Pessoas por Regiao
  // Retorna regioes ou pessoas dependendo dos filtros aplicados
  async pessoasPorRegiao(params: ListRelatorioParams = {}): Promise<RelatorioResponse<RelatorioRegiaoItem | RelatorioPessoaItem>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);
    if (params.regiaoId) queryParams.append('regiao_id', params.regiaoId);
    if (params.municipioId) queryParams.append('municipio_id', params.municipioId);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/relatorios/pessoas-por-regiao${query ? `?${query}` : ''}`);

    return {
      items: (data.items || data).map(mapRelatorioRegiaoFromApi),
      total: data.total || data.length || 0,
      totalGeral: data.total_geral || data.total || 0,
    };
  },

  // Pessoas por Lideranca
  async pessoasPorLideranca(params: ListRelatorioParams = {}): Promise<RelatorioResponse<RelatorioLiderancaItem | RelatorioPessoaItem>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);
    if (params.liderancaId) queryParams.append('lideranca_id', params.liderancaId);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/relatorios/pessoas-por-lideranca${query ? `?${query}` : ''}`);

    return {
      items: (data.items || data).map(mapRelatorioLiderancaFromApi),
      total: data.total || data.length || 0,
      totalGeral: data.total_geral || data.total || 0,
    };
  },

  // Demandas por Tipo
  async demandasPorTipo(params: ListRelatorioParams = {}): Promise<RelatorioResponse<RelatorioDemandaTipoItem>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/relatorios/demandas-por-tipo${query ? `?${query}` : ''}`);

    return {
      items: (data.items || data).map(mapRelatorioDemandaTipoFromApi),
      total: data.total || data.length || 0,
      totalGeral: data.total_geral || data.total || 0,
    };
  },

  // Pessoas por Usuario
  async pessoasPorUsuario(params: ListRelatorioParams = {}): Promise<RelatorioResponse<RelatorioUsuarioItem | RelatorioPessoaItem>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);
    if (params.usuarioId) queryParams.append('usuario_id', params.usuarioId);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/relatorios/pessoas-por-usuario${query ? `?${query}` : ''}`);

    return {
      items: (data.items || data).map(mapRelatorioUsuarioFromApi),
      total: data.total || data.length || 0,
      totalGeral: data.total_geral || data.total || 0,
    };
  },

  // Pessoas por Subgabinete
  async pessoasPorSubgabinete(params: ListRelatorioParams = {}): Promise<RelatorioResponse<RelatorioSubgabineteItem | RelatorioPessoaItem>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);
    if (params.subgabineteId) queryParams.append('subgabinete_id', params.subgabineteId);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/relatorios/pessoas-por-subgabinete${query ? `?${query}` : ''}`);

    return {
      items: (data.items || data).map(mapRelatorioSubgabineteFromApi),
      total: data.total || data.length || 0,
      totalGeral: data.total_geral || data.total || 0,
    };
  },

  // Pessoas por Setor Subdivisao
  async pessoasPorSetorSubdivisao(params: ListRelatorioParams = {}): Promise<RelatorioResponse<RelatorioSetorSubdivisaoItem | RelatorioPessoaItem>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);
    if (params.setorSubdivisaoId) queryParams.append('setor_subdivisao_id', params.setorSubdivisaoId);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/relatorios/pessoas-por-setor-subdivisao${query ? `?${query}` : ''}`);

    return {
      items: (data.items || data).map(mapRelatorioSetorSubdivisaoFromApi),
      total: data.total || data.length || 0,
      totalGeral: data.total_geral || data.total || 0,
    };
  },

  // Pessoas por Setor Regiao
  async pessoasPorSetorRegiao(params: ListRelatorioParams = {}): Promise<RelatorioResponse<RelatorioSetorRegiaoItem | RelatorioPessoaItem>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.dataInicio) queryParams.append('data_inicio', params.dataInicio);
    if (params.dataFim) queryParams.append('data_fim', params.dataFim);
    if (params.setorRegiaoId) queryParams.append('setor_regiao_id', params.setorRegiaoId);

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/relatorios/pessoas-por-setor-regiao${query ? `?${query}` : ''}`);

    return {
      items: (data.items || data).map(mapRelatorioSetorRegiaoFromApi),
      total: data.total || data.length || 0,
      totalGeral: data.total_geral || data.total || 0,
    };
  },
};
