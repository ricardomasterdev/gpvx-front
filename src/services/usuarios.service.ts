import api from './api';

// =====================================================
// Tipos para Usuarios do Gabinete
// =====================================================

export interface UsuarioListItem {
  id: string;
  gabineteId?: string;
  gabineteNome?: string;
  subgabineteId?: string;
  subgabineteNome?: string;
  perfilId?: string;
  perfilNome?: string;
  nome: string;
  email: string;
  telefone?: string;
  status: string;
  superUsuario: boolean;
  createdAt?: string;
}

export interface UsuarioCreate {
  nome: string;
  email: string;
  senha: string;
  perfilId?: string;
  telefone?: string;
  subgabineteId?: string;
}

export interface UsuarioUpdate {
  nome?: string;
  email?: string;
  senha?: string;
  perfilId?: string;
  telefone?: string;
  status?: string;
  subgabineteId?: string | null;
}

export interface PerfilListItem {
  id: string;
  gabineteId?: string;
  codigo: string;
  nome: string;
  descricao?: string;
  nivelAcesso: number;
  sistema: boolean;
}

// =====================================================
// Funcoes de mapeamento (snake_case -> camelCase)
// =====================================================

function mapUsuarioFromApi(data: any): UsuarioListItem {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    gabineteNome: data.gabinete_nome,
    subgabineteId: data.subgabinete_id,
    subgabineteNome: data.subgabinete_nome,
    perfilId: data.perfil_id,
    perfilNome: data.perfil_nome,
    nome: data.nome,
    email: data.email,
    telefone: data.telefone,
    status: data.status,
    superUsuario: data.super_usuario || false,
    createdAt: data.created_at,
  };
}

function mapPerfilFromApi(data: any): PerfilListItem {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    codigo: data.codigo,
    nome: data.nome,
    descricao: data.descricao,
    nivelAcesso: data.nivel_acesso,
    sistema: data.sistema,
  };
}

function mapUsuarioToApi(data: UsuarioCreate | UsuarioUpdate): any {
  const result: any = {};

  if ('nome' in data && data.nome !== undefined) result.nome = data.nome;
  if ('email' in data && data.email !== undefined) result.email = data.email;
  if ('senha' in data && data.senha !== undefined) result.senha = data.senha;
  if ('perfilId' in data && data.perfilId !== undefined) result.perfil_id = data.perfilId || null;
  if ('telefone' in data && data.telefone !== undefined) result.telefone = data.telefone || null;
  if ('status' in data && data.status !== undefined) result.status = data.status;
  if ('subgabineteId' in data) result.subgabinete_id = data.subgabineteId || null;

  return result;
}

// =====================================================
// Usuarios Service (para Admin de Gabinete)
// =====================================================

export const usuariosService = {
  /**
   * Lista usuarios do gabinete atual
   */
  async listar(): Promise<UsuarioListItem[]> {
    const { data } = await api.get<any[]>('/usuarios');
    return data.map(mapUsuarioFromApi);
  },

  /**
   * Obtem detalhes de um usuario
   */
  async obter(id: string): Promise<UsuarioListItem> {
    const { data } = await api.get<any>(`/usuarios/${id}`);
    return mapUsuarioFromApi(data);
  },

  /**
   * Cria um novo usuario no gabinete
   */
  async criar(usuario: UsuarioCreate): Promise<UsuarioListItem> {
    const { data } = await api.post<any>('/usuarios', mapUsuarioToApi(usuario));
    return mapUsuarioFromApi(data);
  },

  /**
   * Atualiza um usuario
   */
  async atualizar(id: string, usuario: UsuarioUpdate): Promise<UsuarioListItem> {
    const { data } = await api.put<any>(`/usuarios/${id}`, mapUsuarioToApi(usuario));
    return mapUsuarioFromApi(data);
  },

  /**
   * Remove um usuario
   */
  async excluir(id: string): Promise<void> {
    await api.delete(`/usuarios/${id}`);
  },

  /**
   * Ativa um usuario
   */
  async ativar(id: string): Promise<UsuarioListItem> {
    const { data } = await api.post<any>(`/usuarios/${id}/ativar`);
    return mapUsuarioFromApi(data);
  },

  /**
   * Desativa um usuario
   */
  async desativar(id: string): Promise<UsuarioListItem> {
    const { data } = await api.post<any>(`/usuarios/${id}/desativar`);
    return mapUsuarioFromApi(data);
  },

  /**
   * Lista perfis disponiveis para o gabinete
   */
  async listarPerfis(): Promise<PerfilListItem[]> {
    const { data } = await api.get<any[]>('/usuarios/perfis');
    return data.map(mapPerfilFromApi);
  },
};
