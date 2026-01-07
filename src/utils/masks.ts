/**
 * Utilitarios para mascaras de campos
 */

/**
 * Aplica mascara de telefone celular brasileiro
 * Formato: (00) 00000-0000
 */
export function maskPhone(value: string): string {
  if (!value) return '';

  // Remove tudo que nao e digito
  const digits = value.replace(/\D/g, '');

  // Limita a 11 digitos
  const limited = digits.slice(0, 11);

  // Aplica a mascara
  if (limited.length <= 2) {
    return `(${limited}`;
  }
  if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  }
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
}

/**
 * Aplica mascara de CPF
 * Formato: 000.000.000-00
 */
export function maskCPF(value: string): string {
  if (!value) return '';

  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 11);

  if (limited.length <= 3) {
    return limited;
  }
  if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`;
  }
  if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
  }
  return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
}

/**
 * Aplica mascara de CEP
 * Formato: 00000-000
 */
export function maskCEP(value: string): string {
  if (!value) return '';

  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 8);

  if (limited.length <= 5) {
    return limited;
  }
  return `${limited.slice(0, 5)}-${limited.slice(5)}`;
}

/**
 * Remove mascara, retornando apenas digitos
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Aplica mascara de data brasileira
 * Formato: DD/MM/AAAA
 */
export function maskDate(value: string): string {
  if (!value) return '';

  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 8);

  if (limited.length <= 2) {
    return limited;
  }
  if (limited.length <= 4) {
    return `${limited.slice(0, 2)}/${limited.slice(2)}`;
  }
  return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
}

/**
 * Converte data do formato brasileiro (DD/MM/AAAA) para ISO (AAAA-MM-DD)
 * @param dataBR Data no formato DD/MM/AAAA
 * @returns Data no formato AAAA-MM-DD ou string vazia se invalida
 */
export function dateToISO(dataBR: string): string {
  if (!dataBR) return '';

  // Remove caracteres nao numericos
  const digits = dataBR.replace(/\D/g, '');

  if (digits.length !== 8) return '';

  const dia = digits.slice(0, 2);
  const mes = digits.slice(2, 4);
  const ano = digits.slice(4, 8);

  // Validacao basica
  const diaNum = parseInt(dia, 10);
  const mesNum = parseInt(mes, 10);
  const anoNum = parseInt(ano, 10);

  if (diaNum < 1 || diaNum > 31) return '';
  if (mesNum < 1 || mesNum > 12) return '';
  if (anoNum < 1900 || anoNum > 2100) return '';

  return `${ano}-${mes}-${dia}`;
}

/**
 * Converte data do formato ISO (AAAA-MM-DD) para brasileiro (DD/MM/AAAA)
 * @param dataISO Data no formato AAAA-MM-DD
 * @returns Data no formato DD/MM/AAAA ou string vazia se invalida
 */
export function dateFromISO(dataISO: string): string {
  if (!dataISO) return '';

  // Se ja esta no formato brasileiro, retorna como esta
  if (dataISO.includes('/')) return dataISO;

  const parts = dataISO.split('-');
  if (parts.length !== 3) return '';

  const [ano, mes, dia] = parts;

  // Validacao basica
  if (!ano || !mes || !dia) return '';
  if (ano.length !== 4 || mes.length !== 2 || dia.length !== 2) return '';

  return `${dia}/${mes}/${ano}`;
}

/**
 * Interface de retorno da API ViaCEP
 */
export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Busca endereco pelo CEP usando a API ViaCEP
 * @param cep CEP com ou sem mascara
 * @returns Dados do endereco ou null se nao encontrado
 */
export async function buscarCEP(cep: string): Promise<ViaCEPResponse | null> {
  const cepLimpo = unmask(cep);

  if (cepLimpo.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await response.json();

    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}
