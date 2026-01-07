import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  MessageSquare,
  Search,
  User,
  ArrowLeft,
  Loader2,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Modal, Badge } from '../ui';
import {
  whatsappService,
  WhatsAppInstanciaListItem,
  WhatsAppConversaResumo,
  WhatsAppMensagem,
} from '../../services/whatsapp.service';
import { cn } from '../../utils/cn';

// =====================================================
// Helpers
// =====================================================

const formatPhoneDisplay = (phone: string): string => {
  if (!phone) return '';
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length < 10) return phone;

  if (numbers.startsWith('55') && numbers.length >= 12) {
    const ddd = numbers.substring(2, 4);
    const rest = numbers.substring(4);
    if (rest.length === 9) {
      return `(${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
    } else if (rest.length === 8) {
      return `(${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
    }
  }

  return phone;
};

const formatMessageDate = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr);
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
};

const formatFullDate = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return '';
  }
};

const getDateKey = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr);
    return format(date, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

const formatConversaDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Ontem';
    return format(date, 'dd/MM', { locale: ptBR });
  } catch {
    return '';
  }
};

// =====================================================
// Componentes Internos
// =====================================================

interface ConversaItemProps {
  conversa: WhatsAppConversaResumo;
  isSelected: boolean;
  onClick: () => void;
}

const ConversaItem: React.FC<ConversaItemProps> = ({ conversa, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 flex items-start gap-3 text-left transition-colors border-b border-slate-100',
        isSelected
          ? 'bg-primary-50 border-l-2 border-l-primary-500'
          : 'hover:bg-slate-50'
      )}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white flex-shrink-0">
        {conversa.pessoaNome ? (
          <span className="text-sm font-medium">{conversa.pessoaNome.charAt(0).toUpperCase()}</span>
        ) : (
          <User className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-slate-900 truncate">
            {conversa.pessoaNome || formatPhoneDisplay(conversa.telefone)}
          </p>
          <span className="text-xs text-slate-400 flex-shrink-0">
            {formatConversaDate(conversa.ultimaData)}
          </span>
        </div>
        {conversa.pessoaNome && (
          <p className="text-xs text-slate-500">{formatPhoneDisplay(conversa.telefone)}</p>
        )}
        <p className="text-sm text-slate-500 truncate mt-0.5">{conversa.ultimaMensagem}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="default" className="text-xs py-0 px-1.5">
            {conversa.totalMensagens} msg
          </Badge>
          <span className="text-xs text-green-600">{conversa.mensagensEnviadas} env</span>
          <span className="text-xs text-blue-600">{conversa.mensagensRecebidas} rec</span>
        </div>
      </div>
    </button>
  );
};

interface MensagemItemProps {
  mensagem: WhatsAppMensagem;
}

interface DateSeparatorProps {
  date: string;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => (
  <div className="flex items-center justify-center my-3">
    <div className="bg-white/90 px-3 py-1 rounded-full shadow-sm">
      <span className="text-xs font-medium text-slate-600">{formatFullDate(date)}</span>
    </div>
  </div>
);

const MensagemItem: React.FC<MensagemItemProps> = ({ mensagem }) => {
  const isFromMe = mensagem.fromMe;

  return (
    <div className={cn('flex mb-2', isFromMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-3 py-2 shadow-sm',
          isFromMe
            ? 'bg-green-100 text-slate-900 rounded-br-none'
            : 'bg-white text-slate-900 rounded-bl-none border border-slate-200'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{mensagem.conteudo || '[Mensagem sem conteudo]'}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-slate-400">{formatMessageDate(mensagem.timestamp)}</span>
          {isFromMe && (
            <span className="text-[10px] text-slate-400">
              {mensagem.status === 'lida' ? '✓✓' : mensagem.status === 'entregue' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Modal Principal
// =====================================================

interface WhatsAppHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  instancia: WhatsAppInstanciaListItem | null;
}

export const WhatsAppHistoryModal: React.FC<WhatsAppHistoryModalProps> = ({
  isOpen,
  onClose,
  instancia,
}) => {
  const queryClient = useQueryClient();
  const [selectedConversa, setSelectedConversa] = useState<WhatsAppConversaResumo | null>(null);
  const [viewAllMessages, setViewAllMessages] = useState(false);
  const [conversaSearch, setConversaSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [filterFromMe, setFilterFromMe] = useState<boolean | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset state quando mudar instancia
  useEffect(() => {
    if (isOpen) {
      setSelectedConversa(null);
      setViewAllMessages(false);
      setConversaSearch('');
      setMessageSearch('');
      setFilterFromMe(undefined);
    }
  }, [isOpen, instancia?.id]);

  // Query para buscar conversas - sem cache para garantir dados frescos
  const conversasQuery = useQuery<WhatsAppConversaResumo[], Error>({
    queryKey: ['whatsapp-conversas', instancia?.id],
    queryFn: () => (instancia ? whatsappService.listarConversas(instancia.id) : Promise.resolve([])),
    enabled: isOpen && !!instancia,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
  const conversas: WhatsAppConversaResumo[] = conversasQuery.data ?? [];
  const loadingConversas = conversasQuery.isLoading;

  // Query para buscar mensagens (todas ou de uma conversa) - sem cache
  const {
    data: mensagensData,
    isLoading: loadingMensagens,
    isFetching: fetchingMensagens,
  } = useQuery({
    queryKey: ['whatsapp-mensagens', instancia?.id, viewAllMessages ? 'all' : selectedConversa?.remoteJid, messageSearch, filterFromMe],
    queryFn: async () => {
      if (!instancia || (!selectedConversa && !viewAllMessages)) {
        return { items: [], total: 0, page: 1, pageSize: 100, totalPages: 1 };
      }
      const remoteJid = viewAllMessages ? undefined : selectedConversa?.remoteJid;
      console.log('[DEBUG] Buscando mensagens - instanciaId:', instancia.id, 'remoteJid:', remoteJid);
      const result = await whatsappService.listarMensagens(instancia.id, {
        page: 1,
        pageSize: 100,
        remoteJid,
        search: messageSearch || undefined,
        fromMe: filterFromMe,
      });
      console.log('[DEBUG] Mensagens retornadas:', result);
      return result;
    },
    enabled: isOpen && !!instancia && (!!selectedConversa || viewAllMessages),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // Agrupar mensagens por data para separadores
  const messagesWithDates = useMemo(() => {
    if (!mensagensData?.items) return [];

    const sorted = [...mensagensData.items].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const result: { type: 'date' | 'message'; date?: string; message?: WhatsAppMensagem }[] = [];
    let lastDate = '';

    sorted.forEach((msg) => {
      const msgDate = getDateKey(msg.timestamp);
      if (msgDate !== lastDate) {
        result.push({ type: 'date', date: msg.timestamp });
        lastDate = msgDate;
      }
      result.push({ type: 'message', message: msg });
    });

    return result;
  }, [mensagensData?.items]);

  // Scroll para o final quando carregar mensagens
  useEffect(() => {
    if (mensagensData?.items.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagensData?.items]);

  // Filtrar conversas por busca
  const filteredConversas = useMemo((): WhatsAppConversaResumo[] => {
    return conversas.filter((c) => {
      if (!conversaSearch) return true;
      const query = conversaSearch.toLowerCase();
      return (
        c.telefone.includes(query) ||
        c.pessoaNome?.toLowerCase().includes(query) ||
        c.ultimaMensagem?.toLowerCase().includes(query)
      );
    });
  }, [conversas, conversaSearch]);

  const handleBackToList = () => {
    setSelectedConversa(null);
    setViewAllMessages(false);
    setMessageSearch('');
  };

  const handleViewAllMessages = () => {
    setSelectedConversa(null);
    setViewAllMessages(true);
    setMessageSearch('');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['whatsapp-conversas'] });
    queryClient.invalidateQueries({ queryKey: ['whatsapp-mensagens'] });
  };

  const handleSelectConversa = (conversa: WhatsAppConversaResumo) => {
    console.log('[DEBUG] Selecionando conversa:', conversa);
    console.log('[DEBUG] remote_jid:', conversa.remoteJid);
    setSelectedConversa(conversa);
    setViewAllMessages(false);
  };

  if (!instancia) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" noPadding hideCloseButton>
      <div className="flex flex-col h-[80vh] max-h-[700px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            {(selectedConversa || viewAllMessages) && (
              <button
                onClick={handleBackToList}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                title="Voltar para lista de conversas"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <MessageSquare className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">
                {viewAllMessages
                  ? `Todas as Mensagens - ${instancia.nome}`
                  : selectedConversa
                  ? selectedConversa.pessoaNome || formatPhoneDisplay(selectedConversa.telefone)
                  : `Historico - ${instancia.nome}`}
              </h2>
              {(selectedConversa || viewAllMessages) && (
                <p className="text-sm text-green-100">
                  {viewAllMessages
                    ? `${mensagensData?.total || 0} mensagem(ns) total`
                    : `${selectedConversa?.totalMensagens || 0} mensagens`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-5 h-5 ${(conversasQuery.isFetching || fetchingMensagens) ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {!selectedConversa && !viewAllMessages ? (
            // Lista de Conversas
            <div className="flex-1 flex flex-col">
              {/* Barra de busca */}
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar conversas..."
                    value={conversaSearch}
                    onChange={(e) => setConversaSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto">
                {loadingConversas ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : filteredConversas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                    <MessageCircle className="w-12 h-12 mb-3" />
                    <p className="text-sm font-medium">Nenhuma conversa encontrada</p>
                    {conversas.length === 0 ? (
                      <p className="text-xs mt-2 text-center">
                        As mensagens enviadas e recebidas aparecerao aqui
                      </p>
                    ) : (
                      <p className="text-xs mt-2 text-center">
                        Tente buscar por outro termo
                      </p>
                    )}
                  </div>
                ) : (
                  filteredConversas.map((conversa: WhatsAppConversaResumo) => (
                    <ConversaItem
                      key={conversa.remoteJid}
                      conversa={conversa}
                      isSelected={false}
                      onClick={() => handleSelectConversa(conversa)}
                    />
                  ))
                )}
              </div>

              {/* Estatisticas e acoes */}
              <div className="p-3 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {conversas.length} conversa(s)
                  </span>
                  <button
                    onClick={handleViewAllMessages}
                    className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    title="Ver todas as mensagens sem filtrar por conversa"
                  >
                    Ver Todas as Mensagens
                  </button>
                </div>
                {conversas.length > 0 && (
                  <p className="text-xs text-slate-400 italic mt-2 text-center">
                    Clique em uma conversa ou em &quot;Ver Todas&quot; para visualizar as mensagens
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Visualizacao de Mensagens
            <div className="flex-1 flex flex-col">
              {/* Filtros */}
              <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar nas mensagens..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterFromMe(undefined)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-lg transition-colors',
                      filterFromMe === undefined
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFilterFromMe(true)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-lg transition-colors',
                      filterFromMe === true
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    Enviadas
                  </button>
                  <button
                    onClick={() => setFilterFromMe(false)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-lg transition-colors',
                      filterFromMe === false
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    Recebidas
                  </button>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] bg-opacity-50">
                {loadingMensagens ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : mensagensData?.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageCircle className="w-12 h-12 mb-2" />
                    <p className="text-sm">Nenhuma mensagem encontrada</p>
                  </div>
                ) : (
                  <>
                    {/* Lista de mensagens com separadores de data */}
                    {messagesWithDates.map((item, index) =>
                      item.type === 'date' && item.date ? (
                        <DateSeparator key={`date-${index}`} date={item.date} />
                      ) : item.message ? (
                        <MensagemItem key={item.message.id} mensagem={item.message} />
                      ) : null
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Rodape com info */}
              <div className="p-3 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {mensagensData?.items?.length || 0} de {mensagensData?.total || 0} mensagem(ns)
                  </span>
                  {fetchingMensagens && (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin text-green-500 mr-2" />
                      <span className="text-xs text-slate-500">Carregando...</span>
                    </div>
                  )}
                  <span className="text-xs text-slate-400 italic">
                    Role para ver todas as mensagens
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
