import api from './api';

// =====================================================
// Tipos para Tags
// =====================================================

export interface TagCategoria {
  id: string;
  gabineteId: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone?: string;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TagCategoriaCreate {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  ordem?: number;
}

export interface TagCategoriaUpdate extends Partial<TagCategoriaCreate> {
  ativo?: boolean;
}

export interface TagListItem {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  cor: string;
  icone?: string;
  categoriaId?: string;
  categoriaNome?: string;
  ativo: boolean;
}

export interface TagResponse {
  id: string;
  gabineteId: string;
  nome: string;
  slug: string;
  descricao?: string;
  cor: string;
  icone?: string;
  categoriaId?: string;
  categoria?: TagCategoria;
  ativo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TagCreate {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  categoriaId?: string;
}

export interface TagUpdate extends Partial<TagCreate> {
  ativo?: boolean;
}

export interface ListTagsParams {
  page?: number;
  perPage?: number;
  search?: string;
  categoriaId?: string;
  ativo?: boolean;
}

export interface PaginatedTagsResponse {
  items: TagListItem[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

// =====================================================
// Funcoes de mapeamento (snake_case -> camelCase)
// =====================================================

function mapTagListFromApi(data: any): TagListItem {
  return {
    id: data.id,
    nome: data.nome,
    slug: data.slug,
    descricao: data.descricao,
    cor: data.cor || '#6B7280',
    icone: data.icone,
    categoriaId: data.categoria_id,
    categoriaNome: data.categoria_nome,
    ativo: data.ativo,
  };
}

function mapTagResponseFromApi(data: any): TagResponse {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    nome: data.nome,
    slug: data.slug,
    descricao: data.descricao,
    cor: data.cor || '#6B7280',
    icone: data.icone,
    categoriaId: data.categoria_id,
    categoria: data.categoria ? mapCategoriaFromApi(data.categoria) : undefined,
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapCategoriaFromApi(data: any): TagCategoria {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    nome: data.nome,
    descricao: data.descricao,
    cor: data.cor || '#6B7280',
    icone: data.icone,
    ordem: data.ordem || 0,
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapTagToApi(data: TagCreate | TagUpdate): any {
  const result: any = {};

  if (data.nome !== undefined) result.nome = data.nome;
  if (data.descricao !== undefined) result.descricao = data.descricao || null;
  if (data.cor !== undefined) result.cor = data.cor || '#6B7280';
  if (data.icone !== undefined) result.icone = data.icone || null;
  if (data.categoriaId !== undefined) result.categoria_id = data.categoriaId || null;
  if ('ativo' in data && data.ativo !== undefined) result.ativo = data.ativo;

  return result;
}

function mapCategoriaToApi(data: TagCategoriaCreate | TagCategoriaUpdate): any {
  const result: any = {};

  if (data.nome !== undefined) result.nome = data.nome;
  if (data.descricao !== undefined) result.descricao = data.descricao || null;
  if (data.cor !== undefined) result.cor = data.cor || '#6B7280';
  if (data.icone !== undefined) result.icone = data.icone || null;
  if (data.ordem !== undefined) result.ordem = data.ordem;
  if ('ativo' in data && data.ativo !== undefined) result.ativo = data.ativo;

  return result;
}

// =====================================================
// Tags Service
// =====================================================

export const tagsService = {
  async listar(params: ListTagsParams = {}): Promise<PaginatedTagsResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', String(params.page));
    if (params.perPage) queryParams.append('per_page', String(params.perPage));
    if (params.search) queryParams.append('search', params.search);
    if (params.categoriaId) queryParams.append('categoria_id', params.categoriaId);
    if (params.ativo !== undefined) queryParams.append('ativo', String(params.ativo));

    const query = queryParams.toString();
    const { data } = await api.get<any>(`/tags${query ? `?${query}` : ''}`);

    return {
      items: data.items.map(mapTagListFromApi),
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      pages: data.pages,
    };
  },

  async obter(id: string): Promise<TagResponse> {
    const { data } = await api.get<any>(`/tags/${id}`);
    return mapTagResponseFromApi(data);
  },

  async criar(tag: TagCreate): Promise<TagResponse> {
    const { data } = await api.post<any>('/tags', mapTagToApi(tag));
    return mapTagResponseFromApi(data);
  },

  async atualizar(id: string, tag: TagUpdate): Promise<TagResponse> {
    const { data } = await api.put<any>(`/tags/${id}`, mapTagToApi(tag));
    return mapTagResponseFromApi(data);
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/tags/${id}`);
  },

  async ativar(id: string): Promise<TagResponse> {
    return this.atualizar(id, { ativo: true });
  },

  async desativar(id: string): Promise<TagResponse> {
    return this.atualizar(id, { ativo: false });
  },

  // Categorias
  async listarCategorias(): Promise<TagCategoria[]> {
    const { data } = await api.get<any>('/tags/categorias/');
    return data.map(mapCategoriaFromApi);
  },

  async criarCategoria(categoria: TagCategoriaCreate): Promise<TagCategoria> {
    const { data } = await api.post<any>('/tags/categorias/', mapCategoriaToApi(categoria));
    return mapCategoriaFromApi(data);
  },

  async atualizarCategoria(id: string, categoria: TagCategoriaUpdate): Promise<TagCategoria> {
    const { data } = await api.put<any>(`/tags/categorias/${id}`, mapCategoriaToApi(categoria));
    return mapCategoriaFromApi(data);
  },

  async excluirCategoria(id: string): Promise<void> {
    await api.delete(`/tags/categorias/${id}`);
  },
};
