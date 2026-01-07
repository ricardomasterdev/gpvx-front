import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Cake,
  Phone,
  Calendar,
  Gift,
  Filter,
  X,
} from 'lucide-react';

import {
  Button,
  Card,
  Badge,
  DataTable,
  Avatar,
} from '../../components/ui';
import type { Column } from '../../components/ui/DataTable';
import { WhatsAppSendMessageModal } from '../../components/whatsapp';
import { aniversariantesService, Aniversariante } from '../../services/aniversariantes.service';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

// Icone do WhatsApp
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Botoes de acao
interface ActionButtonsProps {
  aniversariante: Aniversariante;
  onWhatsAppClick: (aniversariante: Aniversariante) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ aniversariante, onWhatsAppClick }) => {
  const hasWhatsApp = aniversariante.whatsapp || aniversariante.celular || aniversariante.telefone;

  return (
    <div className="flex items-center gap-1">
      {/* WhatsApp */}
      {hasWhatsApp && (
        <button
          onClick={() => onWhatsAppClick(aniversariante)}
          className="p-2 rounded-lg text-[#25D366] hover:text-[#128C7E] hover:bg-green-50 transition-colors"
          title="Enviar WhatsApp"
        >
          <WhatsAppIcon className="w-5 h-5" />
        </button>
      )}

      {/* Telefone */}
      {(aniversariante.celular || aniversariante.telefone) && (
        <a
          href={`tel:${aniversariante.celular || aniversariante.telefone}`}
          className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          title="Ligar"
        >
          <Phone className="w-4 h-4" />
        </a>
      )}
    </div>
  );
};

// Formatar data para exibicao (dd/mm)
const formatarData = (dataStr: string): { dia: string; mes: string; diaNum: number; mesNum: number } => {
  // A data vem do backend no formato ISO: YYYY-MM-DD
  // Exemplo: "1979-01-05" = 5 de janeiro de 1979
  const parts = dataStr.split('-');
  if (parts.length === 3) {
    const mesNum = parseInt(parts[1], 10);
    const diaNum = parseInt(parts[2], 10);
    return {
      dia: parts[2].padStart(2, '0'),
      mes: parts[1].padStart(2, '0'),
      diaNum,
      mesNum,
    };
  }
  // Fallback usando Date
  const date = new Date(dataStr + 'T00:00:00');
  return {
    dia: String(date.getDate()).padStart(2, '0'),
    mes: String(date.getMonth() + 1).padStart(2, '0'),
    diaNum: date.getDate(),
    mesNum: date.getMonth() + 1,
  };
};

// Nome do mes
const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const AniversariantesListPage: React.FC = () => {
  const { gabinete } = useAuthStore();
  const hoje = new Date();

  // Estado do filtro de datas
  const [filtroTipo, setFiltroTipo] = useState<'hoje' | 'semana' | 'mes' | 'periodo'>('hoje');
  const [dataInicio, setDataInicio] = useState<string>(hoje.toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState<string>(hoje.toISOString().split('T')[0]);
  const [mesSelecionado, setMesSelecionado] = useState<number>(hoje.getMonth() + 1);
  const [showFilters, setShowFilters] = useState(false);

  // Estado do modal de WhatsApp
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [selectedAniversariante, setSelectedAniversariante] = useState<Aniversariante | null>(null);

  // Handler para abrir modal de WhatsApp
  const handleWhatsAppClick = useCallback((aniversariante: Aniversariante) => {
    setSelectedAniversariante(aniversariante);
    setWhatsAppModalOpen(true);
  }, []);

  // Calcular datas baseado no filtro
  const getDatas = useCallback(() => {
    const now = new Date();

    switch (filtroTipo) {
      case 'hoje':
        const hojeStr = now.toISOString().split('T')[0];
        return { inicio: hojeStr, fim: hojeStr };

      case 'semana':
        const inicioSemana = new Date(now);
        const fimSemana = new Date(now);
        fimSemana.setDate(fimSemana.getDate() + 7);
        return {
          inicio: inicioSemana.toISOString().split('T')[0],
          fim: fimSemana.toISOString().split('T')[0],
        };

      case 'mes':
        const inicioMes = new Date(now.getFullYear(), mesSelecionado - 1, 1);
        const fimMes = new Date(now.getFullYear(), mesSelecionado, 0);
        return {
          inicio: inicioMes.toISOString().split('T')[0],
          fim: fimMes.toISOString().split('T')[0],
        };

      case 'periodo':
        return { inicio: dataInicio, fim: dataFim };

      default:
        return { inicio: now.toISOString().split('T')[0], fim: now.toISOString().split('T')[0] };
    }
  }, [filtroTipo, dataInicio, dataFim, mesSelecionado]);

  const datas = getDatas();

  // Query para buscar aniversariantes
  const { data: aniversariantes = [], isLoading } = useQuery({
    queryKey: ['aniversariantes', gabinete?.id, filtroTipo, datas.inicio, datas.fim, mesSelecionado],
    queryFn: async () => {
      if (filtroTipo === 'hoje') {
        return aniversariantesService.listarHoje();
      } else if (filtroTipo === 'mes') {
        return aniversariantesService.listarPorMes(mesSelecionado);
      } else {
        return aniversariantesService.listarPorPeriodo(datas.inicio, datas.fim);
      }
    },
    enabled: !!gabinete?.id,
  });

  // Colunas da tabela
  const columns: Column<Aniversariante>[] = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (pessoa) => (
        <div className="flex items-center gap-3">
          <Avatar name={pessoa.nome} size="md" />
          <div>
            <p className="font-medium text-slate-900">{pessoa.nome}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'dataNascimento',
      header: 'Data',
      width: '120px',
      align: 'center',
      render: (pessoa) => {
        const { dia, mes, diaNum, mesNum } = formatarData(pessoa.dataNascimento);
        const isHoje =
          diaNum === hoje.getDate() &&
          mesNum === (hoje.getMonth() + 1);

        return (
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className={cn(
              'font-medium',
              isHoje ? 'text-pink-600' : 'text-slate-700'
            )}>
              {dia}/{mes}
            </span>
            {isHoje && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-xs font-medium">
                <Gift className="w-3 h-3" />
                Hoje!
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'idade',
      header: 'Idade',
      width: '100px',
      align: 'center',
      render: (pessoa) => (
        <Badge variant="default" className="bg-slate-100 text-slate-700">
          {pessoa.idade} anos
        </Badge>
      ),
    },
    {
      key: 'contato',
      header: 'Contato',
      render: (pessoa) => (
        <div className="space-y-1">
          {pessoa.celular && (
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Phone className="w-3 h-3" />
              {pessoa.celular}
            </div>
          )}
          {pessoa.whatsapp && !pessoa.celular && (
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <WhatsAppIcon className="w-3 h-3" />
              {pessoa.whatsapp}
            </div>
          )}
          {!pessoa.celular && !pessoa.whatsapp && pessoa.telefone && (
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Phone className="w-3 h-3" />
              {pessoa.telefone}
            </div>
          )}
          {!pessoa.celular && !pessoa.whatsapp && !pessoa.telefone && (
            <span className="text-slate-400 text-sm">-</span>
          )}
        </div>
      ),
    },
  ];

  // Titulo baseado no filtro
  const getTitulo = () => {
    switch (filtroTipo) {
      case 'hoje':
        return 'Aniversariantes de Hoje';
      case 'semana':
        return 'Aniversariantes da Semana';
      case 'mes':
        return `Aniversariantes de ${MESES[mesSelecionado - 1]}`;
      case 'periodo':
        return 'Aniversariantes do Periodo';
      default:
        return 'Aniversariantes';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Cake className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-slate-900">Aniversariantes</h1>
          </div>
          <p className="text-slate-500 mt-1">
            {getTitulo()}
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Filter className="w-4 h-4" />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filtros
        </Button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Filtrar por periodo</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Tipo de filtro */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'hoje', label: 'Hoje' },
                { value: 'semana', label: 'Proximos 7 dias' },
                { value: 'mes', label: 'Mes' },
                { value: 'periodo', label: 'Periodo personalizado' },
              ].map((opcao) => (
                <button
                  key={opcao.value}
                  onClick={() => setFiltroTipo(opcao.value as any)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    filtroTipo === opcao.value
                      ? 'bg-pink-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  {opcao.label}
                </button>
              ))}
            </div>

            {/* Seletor de mes */}
            {filtroTipo === 'mes' && (
              <div className="flex flex-wrap gap-2">
                {MESES.map((mes, idx) => (
                  <button
                    key={mes}
                    onClick={() => setMesSelecionado(idx + 1)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      mesSelecionado === idx + 1
                        ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-500'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {mes.substring(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {/* Periodo personalizado */}
            {filtroTipo === 'periodo' && (
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data inicio
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data fim
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Resumo */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <Cake className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{aniversariantes.length}</p>
              <p className="text-sm text-slate-500">
                {aniversariantes.length === 1 ? 'aniversariante' : 'aniversariantes'}
                {filtroTipo === 'hoje' && ' hoje'}
                {filtroTipo === 'semana' && ' nos proximos 7 dias'}
                {filtroTipo === 'mes' && ` em ${MESES[mesSelecionado - 1]}`}
              </p>
            </div>
          </div>
          {aniversariantes.length > 0 && (
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              <span className="text-sm text-slate-600">
                Envie seus parabens!
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={aniversariantes}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhum aniversariante encontrado"
        emptyDescription={
          filtroTipo === 'hoje'
            ? "Nao ha aniversariantes hoje"
            : "Nao ha aniversariantes no periodo selecionado"
        }
        emptyIcon={<Cake className="w-12 h-12 text-slate-300" />}
        actions={(aniversariante) => (
          <ActionButtons
            aniversariante={aniversariante}
            onWhatsAppClick={handleWhatsAppClick}
          />
        )}
      />

      {/* Modal de WhatsApp */}
      {selectedAniversariante && (
        <WhatsAppSendMessageModal
          isOpen={whatsAppModalOpen}
          onClose={() => {
            setWhatsAppModalOpen(false);
            setSelectedAniversariante(null);
          }}
          pessoa={{
            id: selectedAniversariante.id,
            nome: selectedAniversariante.nome,
            whatsapp: selectedAniversariante.whatsapp,
            celular: selectedAniversariante.celular,
            telefone: selectedAniversariante.telefone,
          }}
          defaultMessage={`Feliz aniversario, ${selectedAniversariante.nome.split(' ')[0]}! Desejamos muitas felicidades e sucesso! 🎉🎂`}
        />
      )}
    </div>
  );
};
