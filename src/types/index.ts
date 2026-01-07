// =====================================================
// GPVx - Tipos TypeScript
// =====================================================

// Enums
export enum StatusDemanda {
  ABERTA = 'aberta',
  EM_ANDAMENTO = 'em_andamento',
  AGUARDANDO = 'aguardando',
  CONCLUIDA = 'concluida',
  CANCELADA = 'cancelada'
}

export enum PrioridadeDemanda {
  BAIXA = 'baixa',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente',
  CRITICA = 'critica'
}

export enum TipoContato {
  TELEFONE = 'telefone',
  CELULAR = 'celular',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  OUTRO = 'outro'
}

export enum StatusUsuario {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  BLOQUEADO = 'bloqueado',
  PENDENTE = 'pendente'
}

export enum Genero {
  MASCULINO = 'masculino',
  FEMININO = 'feminino',
  OUTRO = 'outro',
  NAO_INFORMADO = 'nao_informado'
}

// Interfaces base
export interface BaseEntity {
  id: string;
  dataCriacao: string;
  dataAtualizacao?: string;
}

// Gabinete
export interface Gabinete extends BaseEntity {
  codigo: string;
  nome: string;
  nomeParlamentar: string;
  partido?: string;
  cargo?: string;
  uf?: string;
  logoUrl?: string;
  corPrimaria: string;
  corSecundaria: string;
  emailContato?: string;
  telefoneContato?: string;
  endereco?: string;
  ativo: boolean;
}

// Subgabinete
export interface Subgabinete extends BaseEntity {
  gabineteId: string;
  codigo: string;
  nome: string;
  descricao?: string;
  cidade?: string;
  regiao?: string;
  uf?: string;
  endereco?: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  responsavelEmail?: string;
  ativo: boolean;
}

// Perfil de acesso
export interface Perfil extends BaseEntity {
  gabineteId?: string;
  codigo: string;
  nome: string;
  descricao?: string;
  permissoes: string[];
  nivelAcesso: number;
  sistema: boolean;
  ativo: boolean;
}

// Gabinete Simples (para seletor)
export interface GabineteSimples {
  id: string;
  codigo: string;
  nome: string;
  nomeParlamentar?: string;
  uf?: string;
  logoUrl?: string;
  gabinetePrincipalId?: string | null;  // Se preenchido, é um subgabinete
}

// Usuário
export interface Usuario extends BaseEntity {
  gabineteId?: string;
  perfilId?: string;
  perfilNome?: string;
  perfilCodigo?: string;  // Codigo do perfil (ex: 'atendente', 'operador', etc)
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  fotoUrl?: string;
  status: StatusUsuario;
  ultimoAcesso?: string;
  superUsuario: boolean;
  isAdminGabinete?: boolean;  // True se for admin do gabinete (pode ver subgabinetes)
  pertenceSubgabinete?: boolean;  // True se o usuário pertence a um subgabinete
  gabinetePrincipal?: GabineteSimples;  // Gabinete principal (se pertence a subgabinete)
  subgabineteAtual?: GabineteSimples;  // Subgabinete do usuário (se pertence a subgabinete)
  perfil?: Perfil;
  gabinete?: Gabinete;
  gabinetes?: GabineteSimples[];
  subgabinetes?: GabineteSimples[];  // Subgabinetes disponíveis para o admin
}

// Pessoa (Cidadão/Liderança)
export interface Pessoa extends BaseEntity {
  gabineteId: string;
  subgabineteId?: string;
  nome: string;
  nomeSocial?: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  genero: Genero;
  profissao?: string;
  escolaridade?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidadeId?: number;
  estadoId?: number;
  cidade?: string;
  estado?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  fotoUrl?: string;
  observacoes?: string;
  comoConheceu?: string;
  liderancaId?: string;
  lideranca?: Pessoa;
  aceitaWhatsapp: boolean;
  aceitaSms: boolean;
  aceitaEmail: boolean;
  totalDemandas: number;
  ultimaInteracao?: string;
  tags?: Tag[];
  ativo: boolean;
}

// Tag
export interface Tag extends BaseEntity {
  gabineteId: string;
  categoriaId?: string;
  nome: string;
  slug: string;
  descricao?: string;
  cor: string;
  icone?: string;
  ativo: boolean;
  categoria?: TagCategoria;
}

export interface TagCategoria extends BaseEntity {
  gabineteId: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone?: string;
  ordem: number;
  ativo: boolean;
}

// Demanda
export interface Demanda extends BaseEntity {
  gabineteId: string;
  subgabineteId?: string;
  numeroProtocolo: string;
  pessoaId?: string;
  pessoa?: Pessoa;
  nomeSolicitante?: string;
  contatoSolicitante?: string;
  categoriaId?: string;
  categoria?: DemandaCategoria;
  status: StatusDemanda;
  prioridade: PrioridadeDemanda;
  titulo: string;
  descricao: string;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  orgaoDestino?: string;
  numeroOficio?: string;
  dataEncaminhamento?: string;
  dataAbertura: string;
  dataPrazo?: string;
  dataConclusao?: string;
  responsavelId?: string;
  responsavel?: Usuario;
  lembreteAtivo: boolean;
  lembreteData?: string;
  lembreteMensagem?: string;
  parecer?: string;
  avaliacao?: number;
  feedback?: string;
  tags?: Tag[];
  andamentos?: DemandaAndamento[];
}

export interface DemandaCategoria extends BaseEntity {
  gabineteId: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone?: string;
  slaDias: number;
  ordem: number;
  ativo: boolean;
}

export interface DemandaAndamento extends BaseEntity {
  demandaId: string;
  usuarioId?: string;
  usuario?: Usuario;
  statusAnterior?: StatusDemanda;
  statusNovo?: StatusDemanda;
  descricao: string;
  interno: boolean;
}

// Documento
export interface Documento extends BaseEntity {
  gabineteId: string;
  pessoaId?: string;
  demandaId?: string;
  tipo: string;
  nome: string;
  nomeOriginal?: string;
  descricao?: string;
  mimeType?: string;
  tamanhoBytes?: number;
  url: string;
  ativo: boolean;
}

// Notificação
export interface Notificacao extends BaseEntity {
  gabineteId: string;
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensagem?: string;
  link?: string;
  lida: boolean;
  dataLeitura?: string;
}

// Auth
export interface LoginRequest {
  email: string;
  senha: string;
  gabineteId?: string;
}

export interface AuthState {
  usuario: Usuario | null;
  gabinete: GabineteSimples | null;
  gabinetes: GabineteSimples[];
  subgabinete: GabineteSimples | null;  // Subgabinete selecionado
  subgabinetes: GabineteSimples[];       // Lista de subgabinetes disponíveis
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filtros
export interface PessoaFiltros {
  busca?: string;
  cidadeId?: number;
  bairro?: string;
  tagIds?: string[];
  liderancaId?: string;
  subgabineteId?: string;
  ativo?: boolean;
}

export interface DemandaFiltros {
  busca?: string;
  status?: StatusDemanda;
  prioridade?: PrioridadeDemanda;
  categoriaId?: string;
  responsavelId?: string;
  pessoaId?: string;
  subgabineteId?: string;
  dataInicio?: string;
  dataFim?: string;
  atrasadas?: boolean;
}

// Dashboard
export interface DashboardStats {
  totalPessoas: number;
  totalLiderancas: number;
  totalDemandas: number;
  demandasAbertas: number;
  demandasEmAndamento: number;
  demandasConcluidas: number;
  demandasAtrasadas: number;
  aniversariantesHoje: number;
}

export interface DemandaPorStatus {
  status: StatusDemanda;
  quantidade: number;
}

export interface DemandaPorCategoria {
  categoria: string;
  quantidade: number;
  cor: string;
}

export interface AniversarianteHoje {
  id: string;
  nome: string;
  dataNascimento: string;
  idade: number;
  telefone?: string;
  celular?: string;
  whatsapp?: string;
}
