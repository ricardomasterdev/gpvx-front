import api from './api';
import type { LoginRequest, Usuario, GabineteSimples } from '../types';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  usuario: Usuario;
  gabinete: GabineteSimples | null;
}

// Transforma gabinete da API para camelCase
function mapGabineteFromApi(g: any): GabineteSimples {
  return {
    id: g.id,
    codigo: g.codigo,
    nome: g.nome,
    nomeParlamentar: g.nome_parlamentar,
    uf: g.uf,
    logoUrl: g.logo_url,
    gabinetePrincipalId: g.gabinete_principal_id,
  };
}

// Transforma resposta da API de snake_case para camelCase
function mapUsuarioFromApi(apiUsuario: any): Usuario {
  return {
    id: apiUsuario.id,
    nome: apiUsuario.nome,
    email: apiUsuario.email,
    gabineteId: apiUsuario.gabinete_id,
    perfilId: apiUsuario.perfil_id,
    perfilNome: apiUsuario.perfil_nome,
    perfilCodigo: apiUsuario.perfil_codigo,
    fotoUrl: apiUsuario.foto_url,
    superUsuario: apiUsuario.super_usuario || false,
    isAdminGabinete: apiUsuario.is_admin_gabinete || false,
    pertenceSubgabinete: apiUsuario.pertence_subgabinete || false,
    gabinetePrincipal: apiUsuario.gabinete_principal ? mapGabineteFromApi(apiUsuario.gabinete_principal) : undefined,
    subgabineteAtual: apiUsuario.subgabinete_atual ? mapGabineteFromApi(apiUsuario.subgabinete_atual) : undefined,
    gabinetes: apiUsuario.gabinetes?.map(mapGabineteFromApi) || [],
    subgabinetes: apiUsuario.subgabinetes?.map(mapGabineteFromApi) || [],
  } as Usuario;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<any>('/auth/login', credentials);

    // Transformar resposta da API para o formato do store (snake_case -> camelCase)
    const usuario = mapUsuarioFromApi(data.usuario);

    // Super usuario entra sem gabinete selecionado - deve escolher manualmente
    // Usuario normal entra com seu gabinete
    let gabinete: GabineteSimples | null = null;
    if (!usuario.superUsuario && usuario.gabinetes && usuario.gabinetes.length > 0) {
      gabinete = usuario.gabinetes[0];
    }

    return {
      token: data.token.access_token,
      refreshToken: data.token.refresh_token,
      usuario: usuario,
      gabinete: gabinete,
    };
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async me(): Promise<Usuario> {
    const { data } = await api.get<any>('/auth/me');
    return mapUsuarioFromApi(data);
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken
    });
    return data;
  },

  async switchGabinete(gabineteId: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/switch-gabinete', null, {
      params: { gabinete_id: gabineteId }
    });
    return data;
  },

  async switchSubgabinete(subgabineteId: string | null): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/switch-subgabinete', null, {
      params: { subgabinete_id: subgabineteId }
    });
    return data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, senha: string): Promise<void> {
    await api.post('/auth/reset-password', { token, senha });
  },

  async listarSubgabinetes(): Promise<GabineteSimples[]> {
    const { data } = await api.get<any[]>('/admin/subgabinetes');
    return data.map(mapGabineteFromApi);
  },
};
