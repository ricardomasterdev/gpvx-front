import api from './api';
import type { Gabinete, Usuario, PaginatedResponse } from '../types';

// =====================================================
// Tipos para Admin
// =====================================================

export interface ParlamentarInfo {
  id: string;
  nome: string;
  email: string;
}

export interface GabineteListItem {
  id: string;
  codigo: string;
  nome: string;
  parlamentarId?: string;
  parlamentar?: ParlamentarInfo;
  ativo: boolean;
  dataCriacao?: string;
}

export interface GabineteCreate {
  nome: string;
  parlamentarId?: string | null;
  gabinetePrincipalId?: string | null;
}

export interface GabineteUpdate {
  nome?: string;
  parlamentarId?: string | null;
  ativo?: boolean;
}

export interface SubgabineteListItem {
  id: string;
  codigo: string;
  nome: string;
  gabinetePrincipalId: string;
  parlamentarId?: string;
  parlamentar?: ParlamentarInfo;
  ativo: boolean;
  dataCriacao?: string;
}

export interface SubgabineteCreate {
  nome: string;
  parlamentarId?: string | null;
}

export interface SubgabineteUpdate {
  nome?: string;
  parlamentarId?: string | null;
  ativo?: boolean;
}

export interface UsuarioListItem {
  id: string;
  gabineteId?: string;
  gabineteNome?: string;
  gabinetePrincipalId?: string;
  gabinetePrincipalNome?: string;
  isSubgabinete: boolean;
  perfilId?: string;
  nome: string;
  email: string;
  status: string;
  superUsuario: boolean;
  dataCriacao: string;
}

export interface UsuarioCreate {
  gabineteId?: string;
  perfilId?: string;
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
  superUsuario?: boolean;
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

export interface UsuarioUpdate extends Partial<Omit<UsuarioCreate, 'senha'>> {
  senha?: string;
  status?: string;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  busca?: string;
  ativo?: boolean;
  gabineteId?: string;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface DashboardStats {
  totalGabinetes: number;
  gabinetesAtivos: number;
  totalUsuarios: number;
  usuariosAtivos: number;
  totalDemandas: number;
  demandasAbertas: number;
  demandasEmAndamento: number;
  demandasConcluidas: number;
  totalPessoas: number;
}

// WhatsApp Admin Types
export interface WhatsAppSessionItem {
  id: string;
  gabineteId?: string;
  gabineteNome?: string;
  gabineteCodigo?: string;
  isSubgabinete: boolean;
  gabinetePrincipalNome?: string;
  nome: string;
  telefone?: string;
  status: string;
  ativo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NodeSessionItem {
  sessionId: string;
  status: string;
  gabineteId?: string;
  nome?: string;
  info?: {
    telefone?: string;
    nome?: string;
  };
}

export interface DeleteSessionResponse {
  success: boolean;
  message: string;
  dbDeleted: boolean;
  nodeDeleted: boolean;
  nodeError?: string;
}

export interface DisconnectSessionResponse {
  success: boolean;
  message: string;
  nodeDisconnected: boolean;
  nodeError?: string;
}

export interface WhatsAppSessionCreate {
  gabineteId?: string;
  nome: string;
  telefone?: string;
  autoRead?: boolean;
  autoResponse?: boolean;
  mensagemBoasVindas?: string;
}

export interface WhatsAppSessionUpdate {
  gabineteId?: string | null;
  nome?: string;
  telefone?: string;
  autoRead?: boolean;
  autoResponse?: boolean;
  mensagemBoasVindas?: string;
  ativo?: boolean;
}

export interface WhatsAppSessionDetail {
  id: string;
  gabineteId?: string;
  gabineteNome?: string;
  isSubgabinete: boolean;
  gabinetePrincipalNome?: string;
  nome: string;
  telefone?: string;
  status: string;
  ativo: boolean;
  autoRead: boolean;
  autoResponse: boolean;
  mensagemBoasVindas?: string;
  qrcode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConnectSessionResponse {
  success: boolean;
  status: string;
  qrcode?: string;
  message?: string;
}

export interface GabineteSubgabineteItem {
  id: string;
  codigo: string;
  nome: string;
  gabinetePrincipalId?: string;
  ativo: boolean;
}

// =====================================================
// Funcoes de mapeamento (snake_case -> camelCase)
// =====================================================

function mapGabineteFromApi(data: any): GabineteListItem {
  return {
    id: data.id,
    codigo: data.codigo,
    nome: data.nome,
    parlamentarId: data.parlamentar_id,
    parlamentar: data.parlamentar ? {
      id: data.parlamentar.id,
      nome: data.parlamentar.nome,
      email: data.parlamentar.email,
    } : undefined,
    ativo: data.ativo,
    dataCriacao: data.created_at,
  };
}

function mapSubgabineteFromApi(data: any): SubgabineteListItem {
  return {
    id: data.id,
    codigo: data.codigo,
    nome: data.nome,
    gabinetePrincipalId: data.gabinete_principal_id,
    parlamentarId: data.parlamentar_id,
    parlamentar: data.parlamentar ? {
      id: data.parlamentar.id,
      nome: data.parlamentar.nome,
      email: data.parlamentar.email,
    } : undefined,
    ativo: data.ativo,
    dataCriacao: data.created_at,
  };
}

function mapSubgabineteToApi(data: SubgabineteCreate | SubgabineteUpdate): any {
  const result: any = {};
  if ('nome' in data && data.nome) result.nome = data.nome;
  if ('parlamentarId' in data && data.parlamentarId !== undefined) result.parlamentar_id = data.parlamentarId || null;
  if ('ativo' in data && data.ativo !== undefined) result.ativo = data.ativo;
  return result;
}

function mapUsuarioFromApi(data: any): UsuarioListItem {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    gabineteNome: data.gabinete_nome,
    gabinetePrincipalId: data.gabinete_principal_id,
    gabinetePrincipalNome: data.gabinete_principal_nome,
    isSubgabinete: !!data.gabinete_principal_id,
    perfilId: data.perfil_id,
    nome: data.nome,
    email: data.email,
    status: data.status,
    superUsuario: data.super_usuario || false,
    dataCriacao: data.data_criacao || data.created_at,
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

function mapGabineteToApi(data: GabineteCreate | GabineteUpdate): any {
  const result: any = {};

  if (data.nome) result.nome = data.nome;
  if (data.parlamentarId !== undefined) result.parlamentar_id = data.parlamentarId || null;
  if ('ativo' in data && data.ativo !== undefined) result.ativo = data.ativo;

  return result;
}

function mapWhatsAppSessionFromApi(data: any): WhatsAppSessionItem {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    gabineteNome: data.gabinete_nome,
    gabineteCodigo: data.gabinete_codigo,
    isSubgabinete: data.is_subgabinete || false,
    gabinetePrincipalNome: data.gabinete_principal_nome,
    nome: data.nome,
    telefone: data.telefone,
    status: data.status,
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapWhatsAppSessionDetailFromApi(data: any): WhatsAppSessionDetail {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    gabineteNome: data.gabinete_nome,
    isSubgabinete: data.is_subgabinete || false,
    gabinetePrincipalNome: data.gabinete_principal_nome,
    nome: data.nome,
    telefone: data.telefone,
    status: data.status,
    ativo: data.ativo,
    autoRead: data.auto_read ?? true,
    autoResponse: data.auto_response ?? false,
    mensagemBoasVindas: data.mensagem_boas_vindas,
    qrcode: data.qrcode,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapWhatsAppSessionCreateToApi(data: WhatsAppSessionCreate): any {
  const result: any = {
    nome: data.nome,
    telefone: data.telefone,
    auto_read: data.autoRead ?? true,
    auto_response: data.autoResponse ?? false,
    mensagem_boas_vindas: data.mensagemBoasVindas,
  };
  // Somente incluir gabinete_id se foi selecionado
  if (data.gabineteId) {
    result.gabinete_id = data.gabineteId;
  }
  return result;
}

function mapWhatsAppSessionUpdateToApi(data: WhatsAppSessionUpdate): any {
  const result: any = {};
  if (data.gabineteId !== undefined) result.gabinete_id = data.gabineteId || null;
  if (data.nome !== undefined) result.nome = data.nome;
  if (data.telefone !== undefined) result.telefone = data.telefone;
  if (data.autoRead !== undefined) result.auto_read = data.autoRead;
  if (data.autoResponse !== undefined) result.auto_response = data.autoResponse;
  if (data.mensagemBoasVindas !== undefined) result.mensagem_boas_vindas = data.mensagemBoasVindas;
  if (data.ativo !== undefined) result.ativo = data.ativo;
  return result;
}

function mapGabineteSubgabineteFromApi(data: any): GabineteSubgabineteItem {
  return {
    id: data.id,
    codigo: data.codigo,
    nome: data.nome,
    gabinetePrincipalId: data.gabinete_principal_id,
    ativo: data.ativo,
  };
}

// =====================================================
// Admin Service
// =====================================================

export const adminService = {
  // ==================== GABINETES ====================

  async listarGabinetes(params: ListParams = {}): Promise<GabineteListItem[]> {
    const queryParams = new URLSearchParams();
    if (params.busca) queryParams.append('busca', params.busca);
    if (params.ativo !== undefined) queryParams.append('ativo', String(params.ativo));

    const query = queryParams.toString();
    const { data } = await api.get<any[]>(`/admin/gabinetes${query ? `?${query}` : ''}`);
    return data.map(mapGabineteFromApi);
  },

  async obterGabinete(id: string): Promise<GabineteListItem> {
    const { data } = await api.get<any>(`/admin/gabinetes/${id}`);
    return mapGabineteFromApi(data);
  },

  async criarGabinete(gabinete: GabineteCreate): Promise<GabineteListItem> {
    const { data } = await api.post<any>('/admin/gabinetes', mapGabineteToApi(gabinete));
    return mapGabineteFromApi(data);
  },

  async atualizarGabinete(id: string, gabinete: GabineteUpdate): Promise<GabineteListItem> {
    const { data } = await api.put<any>(`/admin/gabinetes/${id}`, mapGabineteToApi(gabinete));
    return mapGabineteFromApi(data);
  },

  async ativarGabinete(id: string): Promise<GabineteListItem> {
    return this.atualizarGabinete(id, { ativo: true });
  },

  async desativarGabinete(id: string): Promise<GabineteListItem> {
    return this.atualizarGabinete(id, { ativo: false });
  },

  async deletarGabinete(id: string): Promise<void> {
    await api.delete(`/admin/gabinetes/${id}`);
  },

  // ==================== USUARIOS ====================

  async listarUsuarios(params: ListParams = {}): Promise<UsuarioListItem[]> {
    const queryParams = new URLSearchParams();
    if (params.busca) queryParams.append('busca', params.busca);
    if (params.gabineteId) queryParams.append('gabinete_id', params.gabineteId);

    const query = queryParams.toString();
    const { data } = await api.get<any[]>(`/admin/usuarios${query ? `?${query}` : ''}`);
    return data.map(mapUsuarioFromApi);
  },

  async obterUsuario(id: string): Promise<Usuario> {
    const { data } = await api.get<any>(`/admin/usuarios/${id}`);
    return {
      id: data.id,
      gabineteId: data.gabinete_id,
      perfilId: data.perfil_id,
      nome: data.nome,
      email: data.email,
      cpf: data.cpf,
      telefone: data.telefone,
      fotoUrl: data.foto_url,
      status: data.status,
      ultimoAcesso: data.ultimo_acesso,
      superUsuario: data.super_usuario || false,
      dataCriacao: data.data_criacao || data.created_at,
      dataAtualizacao: data.data_atualizacao || data.updated_at,
    } as Usuario;
  },

  async criarUsuario(usuario: UsuarioCreate): Promise<Usuario> {
    const payload: any = {
      gabinete_id: usuario.gabineteId,
      perfil_id: usuario.perfilId,
      nome: usuario.nome,
      email: usuario.email,
      senha: usuario.senha,
      cpf: usuario.cpf,
      telefone: usuario.telefone,
      super_usuario: usuario.superUsuario,
    };
    const { data } = await api.post<any>('/admin/usuarios', payload);
    return this.obterUsuario(data.id);
  },

  async atualizarUsuario(id: string, usuario: UsuarioUpdate): Promise<Usuario> {
    const payload: any = {};
    if (usuario.gabineteId !== undefined) payload.gabinete_id = usuario.gabineteId;
    if (usuario.perfilId !== undefined) payload.perfil_id = usuario.perfilId;
    if (usuario.nome !== undefined) payload.nome = usuario.nome;
    if (usuario.email !== undefined) payload.email = usuario.email;
    if (usuario.senha !== undefined) payload.senha = usuario.senha;
    if (usuario.cpf !== undefined) payload.cpf = usuario.cpf;
    if (usuario.telefone !== undefined) payload.telefone = usuario.telefone;
    if (usuario.superUsuario !== undefined) payload.super_usuario = usuario.superUsuario;
    if (usuario.status !== undefined) payload.status = usuario.status;

    const { data } = await api.put<any>(`/admin/usuarios/${id}`, payload);
    return this.obterUsuario(data.id);
  },

  async deletarUsuario(id: string): Promise<void> {
    await api.delete(`/admin/usuarios/${id}`);
  },

  // ==================== PERFIS ====================

  async listarPerfis(gabineteId?: string): Promise<PerfilListItem[]> {
    const queryParams = new URLSearchParams();
    if (gabineteId) queryParams.append('gabinete_id', gabineteId);

    const query = queryParams.toString();
    const { data } = await api.get<any[]>(`/admin/perfis${query ? `?${query}` : ''}`);
    return data.map(mapPerfilFromApi);
  },

  // ==================== SUBGABINETES ====================

  async listarSubgabinetes(): Promise<SubgabineteListItem[]> {
    const { data } = await api.get<any[]>('/admin/subgabinetes');
    return data.map(mapSubgabineteFromApi);
  },

  async obterSubgabinete(id: string): Promise<SubgabineteListItem> {
    const { data } = await api.get<any>(`/admin/subgabinetes/${id}`);
    return mapSubgabineteFromApi(data);
  },

  async criarSubgabinete(subgabinete: SubgabineteCreate): Promise<SubgabineteListItem> {
    const { data } = await api.post<any>('/admin/subgabinetes', mapSubgabineteToApi(subgabinete));
    return mapSubgabineteFromApi(data);
  },

  async atualizarSubgabinete(id: string, subgabinete: SubgabineteUpdate): Promise<SubgabineteListItem> {
    const { data } = await api.put<any>(`/admin/subgabinetes/${id}`, mapSubgabineteToApi(subgabinete));
    return mapSubgabineteFromApi(data);
  },

  async ativarSubgabinete(id: string): Promise<SubgabineteListItem> {
    return this.atualizarSubgabinete(id, { ativo: true });
  },

  async desativarSubgabinete(id: string): Promise<SubgabineteListItem> {
    return this.atualizarSubgabinete(id, { ativo: false });
  },

  async deletarSubgabinete(id: string): Promise<void> {
    await api.delete(`/admin/subgabinetes/${id}`);
  },

  // ==================== DASHBOARD ====================

  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await api.get<any>('/admin/dashboard/stats');
    return {
      totalGabinetes: data.total_gabinetes,
      gabinetesAtivos: data.gabinetes_ativos,
      totalUsuarios: data.total_usuarios,
      usuariosAtivos: data.usuarios_ativos,
      totalDemandas: data.total_demandas,
      demandasAbertas: data.demandas_abertas,
      demandasEmAndamento: data.demandas_em_andamento,
      demandasConcluidas: data.demandas_concluidas,
      totalPessoas: data.total_pessoas,
    };
  },

  // ==================== WHATSAPP ADMIN ====================

  async listarSessoesWhatsApp(): Promise<WhatsAppSessionItem[]> {
    const { data } = await api.get<any[]>('/admin/whatsapp/sessions');
    return data.map(mapWhatsAppSessionFromApi);
  },

  async listarSessoesNode(): Promise<NodeSessionItem[]> {
    try {
      const { data } = await api.get<any[]>('/admin/whatsapp/node-sessions');
      return data;
    } catch (error) {
      // Retorna array vazio se o servidor Node estiver indisponivel
      console.error('Erro ao buscar sessoes do Node:', error);
      return [];
    }
  },

  async deletarSessaoWhatsApp(id: string): Promise<DeleteSessionResponse> {
    const { data } = await api.delete<any>(`/admin/whatsapp/sessions/${id}`);
    return {
      success: data.success,
      message: data.message,
      dbDeleted: data.db_deleted,
      nodeDeleted: data.node_deleted,
      nodeError: data.node_error,
    };
  },

  async desconectarSessaoWhatsApp(id: string): Promise<DisconnectSessionResponse> {
    const { data } = await api.post<any>(`/admin/whatsapp/sessions/${id}/disconnect`);
    return {
      success: data.success,
      message: data.message,
      nodeDisconnected: data.node_disconnected,
      nodeError: data.node_error,
    };
  },

  async criarSessaoWhatsApp(session: WhatsAppSessionCreate): Promise<WhatsAppSessionItem> {
    const { data } = await api.post<any>('/admin/whatsapp/sessions', mapWhatsAppSessionCreateToApi(session));
    return mapWhatsAppSessionFromApi(data);
  },

  async obterSessaoWhatsApp(id: string): Promise<WhatsAppSessionDetail> {
    const { data } = await api.get<any>(`/admin/whatsapp/sessions/${id}`);
    return mapWhatsAppSessionDetailFromApi(data);
  },

  async atualizarSessaoWhatsApp(id: string, session: WhatsAppSessionUpdate): Promise<WhatsAppSessionItem> {
    const { data } = await api.put<any>(`/admin/whatsapp/sessions/${id}`, mapWhatsAppSessionUpdateToApi(session));
    return mapWhatsAppSessionFromApi(data);
  },

  async conectarSessaoWhatsApp(id: string): Promise<ConnectSessionResponse> {
    const { data } = await api.post<any>(`/admin/whatsapp/sessions/${id}/conectar`);
    return {
      success: data.success,
      status: data.status,
      qrcode: data.qrcode,
      message: data.message,
    };
  },

  async obterQRCodeSessao(id: string): Promise<{ qrcode?: string; status: string }> {
    const { data } = await api.get<any>(`/admin/whatsapp/sessions/${id}/qrcode`);
    return {
      qrcode: data.qrcode,
      status: data.status,
    };
  },

  async listarGabinetesSubgabinetes(): Promise<GabineteSubgabineteItem[]> {
    const { data } = await api.get<any[]>('/admin/gabinetes-subgabinetes');
    return data.map(mapGabineteSubgabineteFromApi);
  },
};
