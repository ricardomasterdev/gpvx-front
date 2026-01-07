import api from './api';

export interface Aniversariante {
  id: string;
  nome: string;
  dataNascimento: string;
  idade: number;
  telefone: string | null;
  celular: string | null;
  whatsapp: string | null;
}

// Mapeamento snake_case -> camelCase
function mapAniversariante(data: any): Aniversariante {
  return {
    id: data.id,
    nome: data.nome,
    dataNascimento: data.data_nascimento,
    idade: data.idade,
    telefone: data.telefone,
    celular: data.celular,
    whatsapp: data.whatsapp,
  };
}

export const aniversariantesService = {
  /**
   * Lista aniversariantes de hoje
   */
  async listarHoje(): Promise<Aniversariante[]> {
    const { data } = await api.get<any[]>('/pessoas/aniversariantes');
    return data.map(mapAniversariante);
  },

  /**
   * Lista aniversariantes de um dia especifico
   */
  async listarPorDia(mes: number, dia: number): Promise<Aniversariante[]> {
    const { data } = await api.get<any[]>('/pessoas/aniversariantes', {
      params: { mes, dia },
    });
    return data.map(mapAniversariante);
  },

  /**
   * Lista aniversariantes do mes
   */
  async listarPorMes(mes?: number): Promise<Aniversariante[]> {
    const { data } = await api.get<any[]>('/pessoas/aniversariantes/mes', {
      params: mes ? { mes } : undefined,
    });
    return data.map(mapAniversariante);
  },

  /**
   * Lista aniversariantes em um periodo
   */
  async listarPorPeriodo(dataInicio: string, dataFim: string): Promise<Aniversariante[]> {
    const { data } = await api.get<any[]>('/pessoas/aniversariantes/periodo', {
      params: {
        data_inicio: dataInicio,
        data_fim: dataFim,
      },
    });
    return data.map(mapAniversariante);
  },
};
