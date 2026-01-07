import { io, Socket } from 'socket.io-client';
import api from './api';
import { useAuthStore } from '../stores/authStore';

// =====================================================
// Configuracao
// =====================================================

const WHATSAPP_API_URL = 'http://localhost:3002/api/whatsapp';
const WHATSAPP_WS_URL = 'http://localhost:3002';

// =====================================================
// Helper para obter token
// =====================================================

const getAuthToken = (): string | null => {
  return useAuthStore.getState().token;
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// =====================================================
// Tipos para WhatsApp
// =====================================================

export type StatusWhatsApp = 'desconectado' | 'aguardando_qrcode' | 'conectando' | 'conectado';

export interface WhatsAppInstanciaListItem {
  id: string;
  gabineteId: string;
  nome: string;
  telefone?: string;
  status: StatusWhatsApp;
  ativo: boolean;
  createdAt?: string;
}

export interface WhatsAppInstanciaResponse {
  id: string;
  gabineteId: string;
  nome: string;
  telefone?: string;
  status: StatusWhatsApp;
  instanceId?: string;
  instanceName?: string;
  qrcode?: string;
  qrcodeCount?: string;
  autoRead: boolean;
  autoResponse: boolean;
  mensagemBoasVindas?: string;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WhatsAppInstanciaCreate {
  nome: string;
  telefone?: string;
  autoRead?: boolean;
  autoResponse?: boolean;
  mensagemBoasVindas?: string;
}

export interface WhatsAppInstanciaUpdate extends Partial<WhatsAppInstanciaCreate> {
  ativo?: boolean;
}

export interface WhatsAppStatus {
  sessionId: string;
  connected: boolean;
  status: string;
  qrCode: string | null;
  info?: {
    telefone: string;
    nome: string;
  } | null;
  error?: string;
}

export interface ConnectResponse {
  success: boolean;
  sessionId: string;
  message: string;
  status?: string;
  qrcode?: string;
}

export interface QRCodeResponse {
  qrCode: string;
}

export interface SendMessageRequest {
  telefone: string;
  mensagem: string;
  pessoaId?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message?: string;
  messageId?: string;
  telefone?: string;
  error?: string;
}

export interface BulkSendResult {
  total: number;
  enviados: number;
  erros: number;
  detalhes: Array<{
    telefone: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

// =====================================================
// Tipos para Historico de Mensagens
// =====================================================

export interface WhatsAppMensagemPessoa {
  id: string;
  nome: string;
}

export interface WhatsAppMensagem {
  id: string;
  gabineteId: string;
  instanciaId?: string;
  remoteJid: string;
  messageId: string;
  tipo: string;
  conteudo?: string;
  fromMe: boolean;
  timestamp: string;
  status: string;
  pessoaId?: string;
  pessoa?: WhatsAppMensagemPessoa;
  createdAt?: string;
}

export interface WhatsAppMensagemListResponse {
  items: WhatsAppMensagem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WhatsAppConversaResumo {
  remoteJid: string;
  telefone: string;
  pessoaId?: string;
  pessoaNome?: string;
  ultimaMensagem?: string;
  ultimaData?: string;
  totalMensagens: number;
  mensagensEnviadas: number;
  mensagensRecebidas: number;
}

// =====================================================
// Socket.IO Manager para WhatsApp
// =====================================================

class WhatsAppSocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private currentSessionId: string | null = null;

  connect(sessionId: string) {
    if (this.socket?.connected && this.currentSessionId === sessionId) {
      return;
    }

    // Desconectar socket anterior se existir
    if (this.socket) {
      this.disconnect();
    }

    this.currentSessionId = sessionId;

    // Obter token para autenticacao
    const token = getAuthToken();

    this.socket = io(WHATSAPP_WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('WhatsApp Socket conectado');
      this.socket?.emit('session:join', sessionId);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexao Socket:', error.message);
      this.emit('error', { message: error.message });
    });

    this.socket.on('disconnect', () => {
      console.log('WhatsApp Socket desconectado');
    });

    // Eventos do WhatsApp (novos eventos baseados em sessao)
    this.socket.on('session:qr', (data) => {
      this.emit('qr', data);
    });

    this.socket.on('session:authenticated', (data) => {
      this.emit('authenticated', data);
    });

    this.socket.on('session:ready', (data) => {
      this.emit('ready', data);
    });

    this.socket.on('session:disconnected', (data) => {
      this.emit('disconnected', data);
    });

    this.socket.on('session:auth_failure', (data) => {
      this.emit('auth_failure', data);
    });

    this.socket.on('session:message', (data) => {
      this.emit('message', data);
    });

    this.socket.on('session:status', (data) => {
      this.emit('status', data);
    });

    // Eventos legados (compatibilidade)
    this.socket.on('whatsapp:qr', (data) => {
      this.emit('qr', data);
    });

    this.socket.on('whatsapp:authenticated', (data) => {
      this.emit('authenticated', data);
    });

    this.socket.on('whatsapp:ready', (data) => {
      this.emit('ready', data);
    });

    this.socket.on('whatsapp:disconnected', (data) => {
      this.emit('disconnected', data);
    });

    this.socket.on('whatsapp:auth_failure', (data) => {
      this.emit('auth_failure', data);
    });

    this.socket.on('whatsapp:message', (data) => {
      this.emit('message', data);
    });
  }

  disconnect() {
    if (this.socket) {
      if (this.currentSessionId) {
        this.socket.emit('session:leave', this.currentSessionId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.currentSessionId = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retornar funcao para remover listener
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erro no listener ${event}:`, error);
      }
    });
  }

  requestQrCode(sessionId: string) {
    this.socket?.emit('session:request-qr', sessionId);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Instancia singleton do socket manager
export const whatsappSocket = new WhatsAppSocketManager();

// =====================================================
// Funcoes de mapeamento (snake_case -> camelCase)
// =====================================================

function mapInstanciaListFromApi(data: any): WhatsAppInstanciaListItem {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    nome: data.nome,
    telefone: data.telefone,
    status: data.status,
    ativo: data.ativo,
    createdAt: data.created_at,
  };
}

function mapInstanciaResponseFromApi(data: any): WhatsAppInstanciaResponse {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    nome: data.nome,
    telefone: data.telefone,
    status: data.status,
    instanceId: data.instance_id,
    instanceName: data.instance_name,
    qrcode: data.qrcode,
    qrcodeCount: data.qrcode_count,
    autoRead: data.auto_read ?? true,
    autoResponse: data.auto_response ?? false,
    mensagemBoasVindas: data.mensagem_boas_vindas,
    ativo: data.ativo ?? true,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapInstanciaToApi(data: WhatsAppInstanciaCreate | WhatsAppInstanciaUpdate): any {
  const result: any = {};

  if (data.nome !== undefined) result.nome = data.nome;
  if (data.telefone !== undefined) result.telefone = data.telefone || null;
  if (data.autoRead !== undefined) result.auto_read = data.autoRead;
  if (data.autoResponse !== undefined) result.auto_response = data.autoResponse;
  if (data.mensagemBoasVindas !== undefined) result.mensagem_boas_vindas = data.mensagemBoasVindas || null;
  if ('ativo' in data && data.ativo !== undefined) result.ativo = data.ativo;

  return result;
}

function mapMensagemFromApi(data: any): WhatsAppMensagem {
  return {
    id: data.id,
    gabineteId: data.gabinete_id,
    instanciaId: data.instancia_id,
    remoteJid: data.remote_jid,
    messageId: data.message_id,
    tipo: data.tipo,
    conteudo: data.conteudo,
    fromMe: data.from_me,
    timestamp: data.timestamp,
    status: data.status,
    pessoaId: data.pessoa_id,
    pessoa: data.pessoa ? { id: data.pessoa.id, nome: data.pessoa.nome } : undefined,
    createdAt: data.created_at,
  };
}

function mapMensagemListFromApi(data: any): WhatsAppMensagemListResponse {
  return {
    items: data.items.map(mapMensagemFromApi),
    total: data.total,
    page: data.page,
    pageSize: data.page_size,
    totalPages: data.total_pages,
  };
}

function mapConversaFromApi(data: any): WhatsAppConversaResumo {
  return {
    remoteJid: data.remote_jid,
    telefone: data.telefone,
    pessoaId: data.pessoa_id,
    pessoaNome: data.pessoa_nome,
    ultimaMensagem: data.ultima_mensagem,
    ultimaData: data.ultima_data,
    totalMensagens: data.total_mensagens,
    mensagensEnviadas: data.mensagens_enviadas,
    mensagensRecebidas: data.mensagens_recebidas,
  };
}

// =====================================================
// WhatsApp Service (API Backend Python + Node.js)
// =====================================================

export const whatsappService = {
  // --- Metodos do Backend Python (CRUD de instancias) ---

  async listar(): Promise<WhatsAppInstanciaListItem[]> {
    const { data } = await api.get<any[]>('/whatsapp');
    return data.map(mapInstanciaListFromApi);
  },

  async obter(id: string): Promise<WhatsAppInstanciaResponse> {
    const { data } = await api.get<any>(`/whatsapp/${id}`);
    return mapInstanciaResponseFromApi(data);
  },

  async criar(instancia: WhatsAppInstanciaCreate): Promise<WhatsAppInstanciaResponse> {
    const { data } = await api.post<any>('/whatsapp', mapInstanciaToApi(instancia));
    return mapInstanciaResponseFromApi(data);
  },

  async atualizar(id: string, instancia: WhatsAppInstanciaUpdate): Promise<WhatsAppInstanciaResponse> {
    const { data } = await api.put<any>(`/whatsapp/${id}`, mapInstanciaToApi(instancia));
    return mapInstanciaResponseFromApi(data);
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/whatsapp/${id}`);
  },

  async ativar(id: string): Promise<WhatsAppInstanciaResponse> {
    const { data } = await api.post<any>(`/whatsapp/${id}/ativar`);
    return mapInstanciaResponseFromApi(data);
  },

  async desativar(id: string): Promise<WhatsAppInstanciaResponse> {
    const { data } = await api.post<any>(`/whatsapp/${id}/desativar`);
    return mapInstanciaResponseFromApi(data);
  },

  // --- Metodos de Conexao WhatsApp (via Python -> Node.js) ---

  async conectar(sessionId: string): Promise<ConnectResponse> {
    // Chama o endpoint Python que por sua vez chama o Node.js
    const { data } = await api.post<any>(`/whatsapp/${sessionId}/conectar`);
    return {
      success: data.success,
      message: data.message,
      qrcode: data.qrcode,
    };
  },

  async desconectar(sessionId: string): Promise<{ success: boolean; message: string }> {
    // 1. Primeiro tenta desconectar no Node.js (limpa sessao em memoria)
    try {
      const nodeResponse = await fetch(`${WHATSAPP_API_URL}/sessions/${sessionId}/disconnect`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!nodeResponse.ok) {
        // Tentar API legada do Node
        await fetch(`${WHATSAPP_API_URL}/${sessionId}/disconnect`, {
          method: 'POST',
          headers: getAuthHeaders(),
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Erro ao desconectar no Node.js (ignorado):', e);
    }

    // 2. SEMPRE atualiza via Python (garante que o banco seja atualizado)
    try {
      await api.post(`/whatsapp/${sessionId}/desconectar`);
    } catch (e) {
      console.warn('Erro ao desconectar via Python (ignorado):', e);
    }

    return { success: true, message: 'Desconectado com sucesso' };
  },

  async obterStatus(sessionId: string): Promise<WhatsAppStatus> {
    const response = await fetch(`${WHATSAPP_API_URL}/sessions/${sessionId}/status`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      // Tentar API legada
      const legacyResponse = await fetch(`${WHATSAPP_API_URL}/${sessionId}/status`, {
        headers: getAuthHeaders(),
      });

      if (!legacyResponse.ok) {
        return {
          sessionId,
          connected: false,
          status: 'desconectado',
          qrCode: null,
        };
      }

      return legacyResponse.json();
    }

    return response.json();
  },

  async obterQRCode(sessionId: string): Promise<QRCodeResponse> {
    const response = await fetch(`${WHATSAPP_API_URL}/sessions/${sessionId}/qrcode`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      // Tentar API legada
      const legacyResponse = await fetch(`${WHATSAPP_API_URL}/${sessionId}/qrcode`, {
        headers: getAuthHeaders(),
      });

      if (!legacyResponse.ok) {
        throw new Error('QR Code nao disponivel');
      }

      const data = await legacyResponse.json();
      return { qrCode: data.qrCode };
    }

    const data = await response.json();
    return { qrCode: data.qrCode };
  },

  async enviarMensagem(sessionId: string, request: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await fetch(`${WHATSAPP_API_URL}/sessions/${sessionId}/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        telefone: request.telefone,
        mensagem: request.mensagem,
        pessoa_id: request.pessoaId,
      }),
    });

    if (!response.ok) {
      // Tentar API legada
      const legacyResponse = await fetch(`${WHATSAPP_API_URL}/${sessionId}/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          telefone: request.telefone,
          mensagem: request.mensagem,
          pessoa_id: request.pessoaId,
        }),
      });

      if (!legacyResponse.ok) {
        const error = await legacyResponse.json().catch(() => ({ error: 'Erro ao enviar' }));
        throw new Error(error.error || 'Erro ao enviar mensagem');
      }

      const legacyResult = await legacyResponse.json();
      if (legacyResult.success === false) {
        throw new Error(legacyResult.error || 'Erro ao enviar mensagem');
      }
      return legacyResult;
    }

    const result = await response.json();
    if (result.success === false) {
      throw new Error(result.error || 'Erro ao enviar mensagem');
    }
    return result;
  },

  async verificarNumero(sessionId: string, telefone: string): Promise<{ telefone: string; hasWhatsApp: boolean }> {
    const response = await fetch(`${WHATSAPP_API_URL}/sessions/${sessionId}/check-number`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ telefone }),
    });

    if (!response.ok) {
      // Tentar API legada
      const legacyResponse = await fetch(`${WHATSAPP_API_URL}/${sessionId}/check-number`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ telefone }),
      });

      if (!legacyResponse.ok) {
        throw new Error('Erro ao verificar numero');
      }

      return legacyResponse.json();
    }

    return response.json();
  },

  async enviarEmMassa(
    sessionId: string,
    telefones: string[],
    mensagem: string,
    intervalo?: number
  ): Promise<BulkSendResult> {
    const response = await fetch(`${WHATSAPP_API_URL}/sessions/${sessionId}/send-bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ telefones, mensagem, intervalo }),
    });

    if (!response.ok) {
      // Tentar API legada
      const legacyResponse = await fetch(`${WHATSAPP_API_URL}/${sessionId}/send-bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ telefones, mensagem, intervalo }),
      });

      if (!legacyResponse.ok) {
        throw new Error('Erro ao enviar em massa');
      }

      return legacyResponse.json();
    }

    return response.json();
  },

  // --- Metodos de Sessao (nova API) ---

  async listarSessoes(): Promise<any[]> {
    const response = await fetch(`${WHATSAPP_API_URL}/sessions`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao listar sessoes');
    }

    return response.json();
  },

  async destruirSessao(sessionId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${WHATSAPP_API_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro ao destruir sessao' }));
      throw new Error(error.error);
    }

    return response.json();
  },

  // --- Metodos de Historico de Mensagens ---

  async listarMensagens(
    instanciaId: string,
    params?: {
      page?: number;
      pageSize?: number;
      remoteJid?: string;
      fromMe?: boolean;
      search?: string;
    }
  ): Promise<WhatsAppMensagemListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.pageSize) queryParams.append('page_size', String(params.pageSize));
    if (params?.remoteJid) queryParams.append('remote_jid', params.remoteJid);
    if (params?.fromMe !== undefined) queryParams.append('from_me', String(params.fromMe));
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `/whatsapp/${instanciaId}/mensagens${queryString ? `?${queryString}` : ''}`;

    const { data } = await api.get<any>(url);
    return mapMensagemListFromApi(data);
  },

  async listarConversas(instanciaId: string): Promise<WhatsAppConversaResumo[]> {
    const { data } = await api.get<any[]>(`/whatsapp/${instanciaId}/conversas`);
    return data.map(mapConversaFromApi);
  },

  async listarMensagensPorPessoa(
    pessoaId: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<WhatsAppMensagemListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.pageSize) queryParams.append('page_size', String(params.pageSize));

    const queryString = queryParams.toString();
    const url = `/whatsapp/mensagens/pessoa/${pessoaId}${queryString ? `?${queryString}` : ''}`;

    const { data } = await api.get<any>(url);
    return mapMensagemListFromApi(data);
  },

  async listarInstanciasConectadas(): Promise<WhatsAppInstanciaListItem[]> {
    const instancias = await this.listar();
    return instancias.filter((i) => i.status === 'conectado' && i.ativo);
  },
};
