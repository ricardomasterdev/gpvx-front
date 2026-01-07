import api from './api';

// Interface para o response completo do dashboard
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
  status: string;
  quantidade: number;
  cor: string;
}

export interface DemandaPorCategoria {
  categoria: string;
  quantidade: number;
  cor: string;
}

export interface DemandaRecente {
  id: string;
  numeroProtocolo: string;
  titulo: string;
  status: string;
  prioridade: string;
  nomeSolicitante: string | null;
  dataAbertura: string;
}

export interface AniversarianteHoje {
  id: string;
  nome: string;
  dataNascimento: string;
  idade: number;
  telefone: string | null;
  celular: string | null;
  whatsapp: string | null;
}

export interface UltimoCadastro {
  id: string;
  nome: string;
  dataCadastro: string;
  horaCadastro: string;
  usuarioCadastro: string | null;
}

export interface DashboardResponse {
  stats: DashboardStats;
  demandasPorStatus: DemandaPorStatus[];
  demandasPorCategoria: DemandaPorCategoria[];
  demandasRecentes: DemandaRecente[];
  aniversariantesHoje: AniversarianteHoje[];
  ultimosCadastros: UltimoCadastro[];
}

// Funcao de mapeamento (snake_case -> camelCase)
function mapDashboardResponse(data: any): DashboardResponse {
  // Tratamento seguro para dados vazios ou nulos
  const stats = data?.stats || {};
  const demandasPorStatus = data?.demandas_por_status || [];
  const demandasPorCategoria = data?.demandas_por_categoria || [];
  const demandasRecentes = data?.demandas_recentes || [];
  const aniversariantesHoje = data?.aniversariantes_hoje || [];
  const ultimosCadastros = data?.ultimos_cadastros || [];

  return {
    stats: {
      totalPessoas: stats.total_pessoas || 0,
      totalLiderancas: stats.total_liderancas || 0,
      totalDemandas: stats.total_demandas || 0,
      demandasAbertas: stats.demandas_abertas || 0,
      demandasEmAndamento: stats.demandas_em_andamento || 0,
      demandasConcluidas: stats.demandas_concluidas || 0,
      demandasAtrasadas: stats.demandas_atrasadas || 0,
      aniversariantesHoje: stats.aniversariantes_hoje || 0,
    },
    demandasPorStatus: demandasPorStatus.map((d: any) => ({
      status: d.status,
      quantidade: d.quantidade,
      cor: d.cor,
    })),
    demandasPorCategoria: demandasPorCategoria.map((d: any) => ({
      categoria: d.categoria,
      quantidade: d.quantidade,
      cor: d.cor,
    })),
    demandasRecentes: demandasRecentes.map((d: any) => ({
      id: d.id,
      numeroProtocolo: d.numero_protocolo,
      titulo: d.titulo,
      status: d.status,
      prioridade: d.prioridade,
      nomeSolicitante: d.nome_solicitante,
      dataAbertura: d.data_abertura,
    })),
    aniversariantesHoje: aniversariantesHoje.map((a: any) => ({
      id: a.id,
      nome: a.nome,
      dataNascimento: a.data_nascimento,
      idade: a.idade,
      telefone: a.telefone,
      celular: a.celular,
      whatsapp: a.whatsapp,
    })),
    ultimosCadastros: ultimosCadastros.map((u: any) => ({
      id: u.id,
      nome: u.nome,
      dataCadastro: u.data_cadastro,
      horaCadastro: u.hora_cadastro,
      usuarioCadastro: u.usuario_cadastro,
    })),
  };
}

export const dashboardService = {
  async getDashboard(): Promise<DashboardResponse> {
    const { data } = await api.get<any>('/dashboard');
    return mapDashboardResponse(data);
  },
};
