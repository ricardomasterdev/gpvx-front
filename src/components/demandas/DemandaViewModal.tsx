import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  User,
  Tag,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  PauseCircle,
  Hash,
  Building,
} from 'lucide-react';

import { Modal, Badge, Spinner } from '../ui';
import {
  demandasService,
  DemandaListItem,
  StatusDemanda,
  PrioridadeDemanda,
} from '../../services/demandas.service';

interface DemandaViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  demanda: DemandaListItem | null;
}

const STATUS_CONFIG: Record<StatusDemanda, { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'primary'; icon: React.ReactNode }> = {
  aberta: { label: 'Aberta', variant: 'primary', icon: <Clock className="w-4 h-4" /> },
  em_andamento: { label: 'Em Andamento', variant: 'warning', icon: <Loader2 className="w-4 h-4" /> },
  aguardando: { label: 'Aguardando', variant: 'default', icon: <PauseCircle className="w-4 h-4" /> },
  concluida: { label: 'Concluida', variant: 'success', icon: <CheckCircle className="w-4 h-4" /> },
  cancelada: { label: 'Cancelada', variant: 'error', icon: <XCircle className="w-4 h-4" /> },
};

const PRIORIDADE_CONFIG: Record<PrioridadeDemanda, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'text-slate-500 bg-slate-100' },
  normal: { label: 'Normal', color: 'text-blue-600 bg-blue-100' },
  alta: { label: 'Alta', color: 'text-amber-600 bg-amber-100' },
  urgente: { label: 'Urgente', color: 'text-orange-600 bg-orange-100' },
  critica: { label: 'Critica', color: 'text-red-600 bg-red-100' },
};

// Formatar data sem conversao de timezone
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-';
  const [datePart, timePart] = dateStr.split('T');
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const time = timePart ? timePart.substring(0, 5) : '';
    return `${parts[2]}/${parts[1]}/${parts[0]}${time ? ` ${time}` : ''}`;
  }
  return dateStr;
};

export const DemandaViewModal: React.FC<DemandaViewModalProps> = ({
  isOpen,
  onClose,
  demanda,
}) => {
  // Busca detalhes completos da demanda
  const { data: demandaDetalhes, isLoading } = useQuery({
    queryKey: ['demanda', demanda?.id],
    queryFn: () => demandasService.obter(demanda!.id),
    enabled: isOpen && !!demanda?.id,
  });

  if (!demanda) return null;

  const statusConfig = STATUS_CONFIG[demanda.status] || STATUS_CONFIG.aberta;
  const prioridadeConfig = PRIORIDADE_CONFIG[demanda.prioridade] || PRIORIDADE_CONFIG.normal;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Demanda #${demanda.numeroProtocolo}`}
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header com Status e Prioridade */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={statusConfig.variant} className="gap-1.5 px-3 py-1.5">
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${prioridadeConfig.color}`}>
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
              {prioridadeConfig.label}
            </span>
            {demanda.categoriaNome && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: demanda.categoriaCor || '#6B7280' }}
                />
                {demanda.categoriaNome}
              </span>
            )}
          </div>

          {/* Titulo */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              {demanda.titulo}
            </h3>
          </div>

          {/* Descricao */}
          {demandaDetalhes?.descricao && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
                <FileText className="w-4 h-4" />
                <span>Descricao</span>
              </div>
              <p className="text-slate-600 whitespace-pre-wrap">
                {demandaDetalhes.descricao}
              </p>
            </div>
          )}

          {/* Grid de Informacoes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Solicitante */}
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <User className="w-4 h-4" />
                <span>Solicitante</span>
              </div>
              <p className="font-medium text-slate-900">
                {demanda.pessoaNome || demanda.nomeSolicitante || '-'}
              </p>
            </div>

            {/* Protocolo */}
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Hash className="w-4 h-4" />
                <span>Protocolo</span>
              </div>
              <p className="font-mono font-medium text-primary-600">
                #{demanda.numeroProtocolo}
              </p>
            </div>

            {/* Data Abertura */}
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                <span>Data de Abertura</span>
              </div>
              <p className="font-medium text-slate-900">
                {formatDateTime(demanda.dataAbertura)}
              </p>
            </div>

            {/* Prazo */}
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>Prazo</span>
              </div>
              <p className="font-medium text-slate-900">
                {formatDate(demanda.dataPrazo)}
              </p>
            </div>

            {/* Dias Aberto */}
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>Dias em Aberto</span>
              </div>
              <p className={`font-medium ${demanda.diasAberto > 30 ? 'text-red-500' : 'text-slate-900'}`}>
                {demanda.diasAberto} dias
              </p>
            </div>

            {/* Orgao Destino */}
            {demandaDetalhes?.orgaoDestino && (
              <div className="bg-white border border-slate-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Building className="w-4 h-4" />
                  <span>Orgao Destino</span>
                </div>
                <p className="font-medium text-slate-900">
                  {demandaDetalhes.orgaoDestino}
                </p>
              </div>
            )}
          </div>

          {/* Parecer (se concluida) */}
          {demandaDetalhes?.parecer && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                <CheckCircle className="w-4 h-4" />
                <span>Parecer</span>
              </div>
              <p className="text-green-800 whitespace-pre-wrap">
                {demandaDetalhes.parecer}
              </p>
            </div>
          )}

          {/* Botao Fechar */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
