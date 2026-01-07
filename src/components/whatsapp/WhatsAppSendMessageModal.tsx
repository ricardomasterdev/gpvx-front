import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Phone, MessageSquare, CheckCircle, AlertCircle, XCircle, Clock, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Modal, Button, Textarea } from '../ui';
import {
  whatsappService,
  WhatsAppInstanciaListItem,
  WhatsAppMensagem
} from '../../services/whatsapp.service';

// =====================================================
// Tipos
// =====================================================

interface WhatsAppSendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pessoa: {
    id: string;
    nome: string;
    whatsapp?: string | null;
    celular?: string | null;
    telefone?: string | null;
  };
  defaultMessage?: string;
}

interface SendResult {
  success: boolean;
  timestamp: string;
  error?: string;
}

// =====================================================
// Componente
// =====================================================

export const WhatsAppSendMessageModal: React.FC<WhatsAppSendMessageModalProps> = ({
  isOpen,
  onClose,
  pessoa,
  defaultMessage = '',
}) => {
  const queryClient = useQueryClient();
  const [selectedInstanciaId, setSelectedInstanciaId] = useState<string>('');
  const [mensagem, setMensagem] = useState(defaultMessage);
  const [lastResult, setLastResult] = useState<SendResult | null>(null);

  // Buscar instancias conectadas
  const instanciasQuery = useQuery({
    queryKey: ['whatsapp-instancias'],
    queryFn: () => whatsappService.listar(),
    enabled: isOpen,
    staleTime: 30000,
  });

  // Filtrar apenas instancias conectadas e ativas
  const instanciasConectadas = (instanciasQuery.data || []).filter(
    (inst: WhatsAppInstanciaListItem) => inst.status === 'conectado' && inst.ativo
  );

  // Buscar historico de mensagens para esta pessoa
  const historicoQuery = useQuery({
    queryKey: ['whatsapp-historico-pessoa', pessoa.id],
    queryFn: () => whatsappService.listarMensagensPorPessoa(pessoa.id, { pageSize: 5 }),
    enabled: isOpen && !!pessoa.id,
    staleTime: 0,
  });

  // Selecionar primeira instancia conectada por padrao
  useEffect(() => {
    if (instanciasConectadas.length > 0 && !selectedInstanciaId) {
      setSelectedInstanciaId(instanciasConectadas[0].id);
    }
  }, [instanciasConectadas, selectedInstanciaId]);

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setMensagem(defaultMessage);
      setLastResult(null);
    }
  }, [isOpen, defaultMessage]);

  // Mutation para enviar mensagem
  const sendMutation = useMutation({
    mutationFn: () => {
      const telefone = pessoa.whatsapp || pessoa.celular || pessoa.telefone;
      if (!telefone) throw new Error('Pessoa sem telefone cadastrado');
      if (!selectedInstanciaId) throw new Error('Selecione uma sessao de WhatsApp');

      return whatsappService.enviarMensagem(selectedInstanciaId, {
        telefone,
        mensagem,
        pessoaId: pessoa.id,
      });
    },
    onSuccess: () => {
      setLastResult({
        success: true,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      });
      toast.success('Mensagem enviada com sucesso!');
      // Invalidar cache do historico
      queryClient.invalidateQueries({ queryKey: ['whatsapp-historico-pessoa', pessoa.id] });
    },
    onError: (error: any) => {
      const message = error.message || error.response?.data?.detail || 'Erro ao enviar mensagem';
      setLastResult({
        success: false,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        error: message,
      });
      toast.error(message);
    },
  });

  const handleClose = () => {
    setMensagem('');
    setLastResult(null);
    setSelectedInstanciaId('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }
    sendMutation.mutate();
  };

  // Telefone para exibir
  const telefoneDisplay = pessoa.whatsapp || pessoa.celular || pessoa.telefone || 'Nao informado';

  // Formatar data
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enviar WhatsApp"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Destinatario */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{pessoa.nome}</p>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Phone className="w-3 h-3" />
                <span>{telefoneDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selecao de Instancia */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enviar pela sessao:
          </label>
          {instanciasQuery.isLoading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Carregando sessoes...</span>
            </div>
          ) : instanciasConectadas.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                Nenhuma sessao de WhatsApp conectada.
                <br />
                Acesse a pagina WhatsApp para conectar uma sessao.
              </p>
            </div>
          ) : (
            <select
              value={selectedInstanciaId}
              onChange={(e) => setSelectedInstanciaId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {instanciasConectadas.map((inst: WhatsAppInstanciaListItem) => (
                <option key={inst.id} value={inst.id}>
                  {inst.nome} {inst.telefone ? `(${inst.telefone})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Mensagem */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>Mensagem</span>
          </div>
          <Textarea
            placeholder="Digite sua mensagem..."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={4}
          />
        </div>

        {/* Historico de Mensagens */}
        {historicoQuery.data && historicoQuery.data.items.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-700 text-sm">
                Ultimas mensagens enviadas para {pessoa.nome.split(' ')[0]}
              </span>
            </div>
            <ul className="space-y-2">
              {historicoQuery.data.items.map((msg: WhatsAppMensagem) => (
                <li
                  key={msg.id}
                  className="bg-white rounded-lg p-3 border border-slate-100"
                >
                  <p className="text-sm text-slate-700 line-clamp-2">
                    {msg.conteudo}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDate(msg.timestamp)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resultado do ultimo envio */}
        {lastResult && (
          <div className={`rounded-xl p-4 ${lastResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <div>
                <span className={`font-medium ${lastResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {lastResult.success ? 'Mensagem enviada!' : 'Erro ao enviar'}
                </span>
                <span className="text-xs text-slate-500 ml-2">({lastResult.timestamp})</span>
                {lastResult.error && (
                  <p className="text-sm text-red-700 mt-1">{lastResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botoes */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={sendMutation.isPending}
          >
            Fechar
          </Button>
          <Button
            type="submit"
            isLoading={sendMutation.isPending}
            disabled={instanciasConectadas.length === 0 || !selectedInstanciaId}
            leftIcon={<Send className="w-4 h-4" />}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            Enviar Mensagem
          </Button>
        </div>
      </form>
    </Modal>
  );
};
