import React, { useState, Fragment, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Avatar } from '../ui';
import { authService } from '../../services/auth.service';
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Building2,
  Shield,
  Users,
  X,
  Layers,
} from 'lucide-react';
import { Menu as HeadlessMenu, Transition, Popover } from '@headlessui/react';
import toast from 'react-hot-toast';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario, gabinete, gabinetes, subgabinete, subgabinetes, logout, setGabinete, setTokens, setSubgabinete, setSubgabinetes } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();
  const [switchingGabinete, setSwitchingGabinete] = useState(false);
  const [switchingSubgabinete, setSwitchingSubgabinete] = useState(false);
  const [gabineteSearchQuery, setGabineteSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const subgabineteSearchInputRef = useRef<HTMLInputElement>(null);
  const [subgabineteSearchQuery, setSubgabineteSearchQuery] = useState('');

  // Super usuario sem gabinete selecionado - modo admin apenas
  const isSuperUserNoGabinete = usuario?.superUsuario && !gabinete;

  // Verifica se usuario e atendente (nao pode ver Configuracoes)
  const isAtendente = usuario?.perfilCodigo?.toLowerCase() === 'atendente';

  // Filtrar gabinetes pela busca
  const filteredGabinetes = useMemo(() => {
    if (!gabineteSearchQuery) return gabinetes;
    const query = gabineteSearchQuery.toLowerCase();
    return gabinetes.filter(g =>
      g.nome.toLowerCase().includes(query) ||
      g.codigo?.toLowerCase().includes(query)
    );
  }, [gabinetes, gabineteSearchQuery]);

  // Subgabinetes filtrados pelo gabinete selecionado (para super usuario)
  const subgabinetesByGabinete = useMemo(() => {
    if (!usuario?.superUsuario) return subgabinetes;
    // Super usuario sem gabinete selecionado: mostra todos
    if (!gabinete) return subgabinetes;
    // Super usuario com gabinete selecionado: filtra pelo gabinete
    return subgabinetes.filter(sg => sg.gabinetePrincipalId === gabinete.id);
  }, [subgabinetes, gabinete, usuario?.superUsuario]);

  // Filtrar subgabinetes pela busca
  const filteredSubgabinetes = useMemo(() => {
    if (!subgabineteSearchQuery) return subgabinetesByGabinete;
    const query = subgabineteSearchQuery.toLowerCase();
    return subgabinetesByGabinete.filter(sg =>
      sg.nome.toLowerCase().includes(query) ||
      sg.codigo?.toLowerCase().includes(query)
    );
  }, [subgabinetesByGabinete, subgabineteSearchQuery]);

  // Usuario admin ou super usuario pode ver seletor de subgabinetes
  // Super usuario sempre ve (mesmo sem subgabinetes, para mostrar mensagem)
  const canSeeSubgabinetes = usuario?.isAdminGabinete || (usuario?.superUsuario && gabinete);

  // Verifica se existem subgabinetes para mostrar
  const hasSubgabinetes = subgabinetesByGabinete && subgabinetesByGabinete.length > 0;

  // Helper para obter nome do gabinete principal pelo ID
  const getGabineteNomeById = (gabineteId: string | null | undefined): string | null => {
    if (!gabineteId) return null;
    const found = gabinetes.find(g => g.id === gabineteId);
    return found?.nome || null;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Buscar subgabinetes quando super usuario seleciona um gabinete
  const fetchSubgabinetes = async () => {
    try {
      const subgabinetesList = await authService.listarSubgabinetes();
      setSubgabinetes(subgabinetesList);
    } catch (error) {
      console.error('Erro ao buscar subgabinetes:', error);
      setSubgabinetes([]);
    }
  };

  // Buscar todos os subgabinetes quando super usuario entrar no sistema
  useEffect(() => {
    if (usuario?.superUsuario && subgabinetes.length === 0) {
      fetchSubgabinetes();
    }
  }, [usuario?.superUsuario]);

  const handleSwitchGabinete = async (gabineteId: string | null, close: () => void) => {
    if (gabineteId === null) {
      // Visao Geral selecionada
      setGabinete(null);
      setSubgabinete(null);
      setGabineteSearchQuery('');
      close();
      // Invalida todas as queries para recarregar dados
      await queryClient.invalidateQueries();
      // Buscar todos os subgabinetes de todos os gabinetes
      await fetchSubgabinetes();
      toast.success('Modo Visao Geral ativado');
      navigate('/dashboard');
      return;
    }

    if (gabineteId === gabinete?.id) {
      close();
      return;
    }

    setSwitchingGabinete(true);
    try {
      const response = await authService.switchGabinete(gabineteId);
      const novoGabinete = gabinetes.find(g => g.id === gabineteId);
      if (novoGabinete) {
        setGabinete(novoGabinete);
        setSubgabinete(null); // Limpa subgabinete ao trocar de gabinete
        setTokens(response.access_token, response.refresh_token);
        setGabineteSearchQuery('');
        close();
        // Invalida todas as queries para recarregar dados do gabinete
        await queryClient.invalidateQueries();
        // Buscar subgabinetes do novo gabinete (para super usuario)
        if (usuario?.superUsuario) {
          await fetchSubgabinetes();
        }
        toast.success(`Gabinete alterado para ${novoGabinete.nome}`);
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Erro ao trocar de gabinete');
    } finally {
      setSwitchingGabinete(false);
    }
  };

  const handleSwitchSubgabinete = async (subgabineteId: string | null, close: () => void) => {
    if (subgabineteId === null) {
      // Voltar ao gabinete principal
      if (!subgabinete) {
        close();
        return;
      }
      setSwitchingSubgabinete(true);
      try {
        const response = await authService.switchSubgabinete(null);
        setSubgabinete(null);
        setTokens(response.access_token, response.refresh_token);
        setSubgabineteSearchQuery('');
        close();
        // Invalida todas as queries para recarregar dados do gabinete principal
        await queryClient.invalidateQueries();
        toast.success('Visualizando Gabinete Principal');
        navigate('/dashboard');
      } catch (error) {
        toast.error('Erro ao voltar ao gabinete principal');
      } finally {
        setSwitchingSubgabinete(false);
      }
      return;
    }

    if (subgabineteId === subgabinete?.id) {
      close();
      return;
    }

    setSwitchingSubgabinete(true);
    try {
      const response = await authService.switchSubgabinete(subgabineteId);
      const novoSubgabinete = subgabinetes.find(sg => sg.id === subgabineteId);
      if (novoSubgabinete) {
        // Super usuario: sempre atualizar o gabinete para o gabinete principal do subgabinete
        // Isso garante consistencia entre frontend e token
        if (usuario?.superUsuario && novoSubgabinete.gabinetePrincipalId) {
          const gabPrincipal = gabinetes.find(g => g.id === novoSubgabinete.gabinetePrincipalId);
          if (gabPrincipal) {
            setGabinete(gabPrincipal);
          }
        }
        // Atualizar tokens ANTES de setar o subgabinete
        setTokens(response.access_token, response.refresh_token);
        setSubgabinete(novoSubgabinete);
        setSubgabineteSearchQuery('');
        close();
        // Invalida todas as queries para recarregar dados do subgabinete
        await queryClient.invalidateQueries();
        toast.success(`Subgabinete alterado para ${novoSubgabinete.nome}`);
        navigate('/dashboard');
      } else {
        toast.error('Subgabinete nao encontrado');
      }
    } catch (error: any) {
      console.error('Erro ao trocar de subgabinete:', error);
      const message = error.response?.data?.detail || 'Erro ao trocar de subgabinete';
      toast.error(message);
    } finally {
      setSwitchingSubgabinete(false);
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-30 flex items-center px-6 gap-4 transition-all duration-300 shadow-sm',
        sidebarCollapsed ? 'left-20' : 'left-64'
      )}
    >
      {/* Seletor de Gabinete com busca - Apenas para super usuario */}
      {usuario?.superUsuario && gabinetes && gabinetes.length > 0 && (
        <Popover className="relative">
          {({ open, close }) => (
            <>
              <Popover.Button
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all outline-none',
                  'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300',
                  open && 'border-amber-400 ring-2 ring-amber-500/20'
                )}
                disabled={switchingGabinete}
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <div className="text-left">
                  <p className="text-xs text-slate-500">
                    <Shield className="inline w-3 h-3 mr-1 text-amber-500" />
                    Gabinete
                  </p>
                  <p className="text-sm font-medium text-slate-800 truncate max-w-[150px]">
                    {gabinete?.nome || 'Visao Geral'}
                  </p>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
                afterEnter={() => searchInputRef.current?.focus()}
                afterLeave={() => setGabineteSearchQuery('')}
              >
                <Popover.Panel className="absolute left-0 mt-2 w-80 origin-top-left rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none overflow-hidden z-50">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500">
                    <p className="text-xs font-medium text-white/80">Super Usuario</p>
                    <p className="text-sm font-semibold text-white">Selecione o Gabinete</p>
                  </div>

                  {/* Campo de busca */}
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-slate-100 border border-transparent focus:bg-white focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder:text-slate-400"
                        placeholder="Buscar gabinete..."
                        value={gabineteSearchQuery}
                        onChange={(e) => setGabineteSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                      {gabineteSearchQuery && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600"
                          onClick={() => setGabineteSearchQuery('')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-1 max-h-64 overflow-y-auto">
                    {/* Opcao Visao Geral */}
                    <button
                      onClick={() => handleSwitchGabinete(null, close)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        'hover:bg-amber-50',
                        !gabinete ? 'bg-amber-100 text-amber-700' : 'text-slate-700'
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">Visao Geral</p>
                        <p className="text-xs text-slate-500">Painel administrativo</p>
                      </div>
                      {!gabinete && (
                        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Ativo</span>
                      )}
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {/* Lista de gabinetes filtrados */}
                    {filteredGabinetes.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-slate-500">
                        Nenhum gabinete encontrado
                      </div>
                    ) : (
                      filteredGabinetes.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => handleSwitchGabinete(g.id, close)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                            'hover:bg-primary-50',
                            g.id === gabinete?.id ? 'bg-primary-100 text-primary-700' : 'text-slate-700'
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                            {g.nome.charAt(0)}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium truncate">{g.nome}</p>
                            <p className="text-xs text-slate-500 truncate">{g.codigo}</p>
                          </div>
                          {g.id === gabinete?.id && (
                            <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">Ativo</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Contador de resultados */}
                  {gabineteSearchQuery && (
                    <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
                      <p className="text-xs text-slate-500">
                        {filteredGabinetes.length} de {gabinetes.length} gabinete(s)
                      </p>
                    </div>
                  )}
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      )}

      {/* Usuario normal: exibicao do gabinete */}
      {!usuario?.superUsuario && gabinete && !usuario?.pertenceSubgabinete && !canSeeSubgabinetes && (
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl border',
            'bg-gradient-to-r from-primary-50 to-emerald-50 border-primary-200'
          )}
        >
          <Building2 className="w-4 h-4 text-primary-600" />
          <div className="text-left">
            <p className="text-xs text-slate-500">Gabinete</p>
            <p className="text-sm font-medium text-slate-800 truncate max-w-[180px]">
              {gabinete.nome}
            </p>
          </div>
        </div>
      )}

      {/* Usuario de subgabinete: exibe gabinete principal + subgabinete atual */}
      {!usuario?.superUsuario && usuario?.pertenceSubgabinete && (
        <>
          {/* Gabinete Principal */}
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl border',
              'bg-gradient-to-r from-primary-50 to-emerald-50 border-primary-200'
            )}
          >
            <Building2 className="w-4 h-4 text-primary-600" />
            <div className="text-left">
              <p className="text-xs text-slate-500">Gabinete</p>
              <p className="text-sm font-medium text-slate-800 truncate max-w-[150px]">
                {usuario.gabinetePrincipal?.nome || gabinete?.nome}
              </p>
            </div>
          </div>
          {/* Subgabinete do usuario */}
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl border',
              'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200'
            )}
          >
            <Layers className="w-4 h-4 text-violet-600" />
            <div className="text-left">
              <p className="text-xs text-slate-500">Subgabinete</p>
              <p className="text-sm font-medium text-slate-800 truncate max-w-[150px]">
                {usuario.subgabineteAtual?.nome}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Admin de gabinete principal: exibe gabinete + seletor de subgabinete */}
      {!usuario?.superUsuario && canSeeSubgabinetes && !usuario?.pertenceSubgabinete && (
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl border',
            'bg-gradient-to-r from-primary-50 to-emerald-50 border-primary-200'
          )}
        >
          <Building2 className="w-4 h-4 text-primary-600" />
          <div className="text-left">
            <p className="text-xs text-slate-500">Gabinete</p>
            <p className="text-sm font-medium text-slate-800 truncate max-w-[180px]">
              {gabinete?.nome}
            </p>
          </div>
        </div>
      )}

      {/* Seletor de Subgabinete - para admin de gabinete principal ou super usuario */}
      {canSeeSubgabinetes && (
        <Popover className="relative">
          {({ open, close }) => (
            <>
              <Popover.Button
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all outline-none',
                  usuario?.superUsuario
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300'
                    : 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:border-violet-300',
                  open && (usuario?.superUsuario ? 'border-amber-400 ring-2 ring-amber-500/20' : 'border-violet-400 ring-2 ring-violet-500/20')
                )}
                disabled={switchingSubgabinete}
              >
                <Layers className={cn('w-4 h-4', usuario?.superUsuario ? 'text-amber-600' : 'text-violet-600')} />
                <div className="text-left">
                  <p className="text-xs text-slate-500">Subgabinete</p>
                  <p className="text-sm font-medium text-slate-800 truncate max-w-[150px]">
                    {subgabinete?.nome || (hasSubgabinetes ? 'Gabinete Principal' : 'Nenhum')}
                  </p>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
                afterEnter={() => subgabineteSearchInputRef.current?.focus()}
                afterLeave={() => setSubgabineteSearchQuery('')}
              >
                <Popover.Panel className="absolute left-0 mt-2 w-80 origin-top-left rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none overflow-hidden z-50">
                  <div className={cn(
                    "p-2 bg-gradient-to-r",
                    usuario?.superUsuario ? "from-amber-500 to-orange-500" : "from-violet-500 to-purple-500"
                  )}>
                    <p className="text-xs font-medium text-white/80">
                      {usuario?.superUsuario ? "Super Administrador" : "Administrador"}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {!hasSubgabinetes ? "Subgabinetes" : (usuario?.superUsuario ? "Subgabinetes do Gabinete" : "Selecione o Subgabinete")}
                    </p>
                  </div>

                  {/* Campo de busca - apenas quando tem subgabinetes */}
                  {hasSubgabinetes && (
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          ref={subgabineteSearchInputRef}
                          type="text"
                          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-slate-100 border border-transparent focus:bg-white focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-400"
                          placeholder="Buscar subgabinete..."
                          value={subgabineteSearchQuery}
                          onChange={(e) => setSubgabineteSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                        {subgabineteSearchQuery && (
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600"
                            onClick={() => setSubgabineteSearchQuery('')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-1 max-h-64 overflow-y-auto">
                    {/* Opcao Gabinete Principal - apenas quando tem gabinete selecionado E tem subgabinetes */}
                    {gabinete && hasSubgabinetes && (
                      <>
                        <button
                          onClick={() => handleSwitchSubgabinete(null, close)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                            usuario?.superUsuario ? 'hover:bg-amber-50' : 'hover:bg-violet-50',
                            !subgabinete ? (usuario?.superUsuario ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700') : 'text-slate-700'
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                            usuario?.superUsuario ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-violet-400 to-purple-500"
                          )}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{gabinete.nome}</p>
                            <p className="text-xs text-slate-500">Gabinete Principal</p>
                          </div>
                          {!subgabinete && (
                            <span className={cn(
                              "text-xs text-white px-2 py-0.5 rounded-full",
                              usuario?.superUsuario ? "bg-amber-500" : "bg-violet-500"
                            )}>Ativo</span>
                          )}
                        </button>

                        <div className="my-1 border-t border-slate-100" />
                      </>
                    )}

                    {/* Lista de subgabinetes filtrados */}
                    {!hasSubgabinetes ? (
                      <div className="px-3 py-6 text-center">
                        <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">
                          Nao existem subgabinetes vinculados
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          a este gabinete
                        </p>
                      </div>
                    ) : filteredSubgabinetes.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-slate-500">
                        Nenhum subgabinete encontrado na busca
                      </div>
                    ) : (
                      filteredSubgabinetes.map((sg) => {
                        // Super usuario sempre ve o nome do gabinete de cada subgabinete
                        const gabineteNome = usuario?.superUsuario ? getGabineteNomeById(sg.gabinetePrincipalId) : null;
                        return (
                          <button
                            key={sg.id}
                            onClick={() => handleSwitchSubgabinete(sg.id, close)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                              usuario?.superUsuario ? 'hover:bg-amber-50' : 'hover:bg-violet-50',
                              sg.id === subgabinete?.id ? (usuario?.superUsuario ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700') : 'text-slate-700'
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs",
                              usuario?.superUsuario ? "bg-gradient-to-br from-amber-300 to-orange-400" : "bg-gradient-to-br from-violet-300 to-purple-400"
                            )}>
                              {sg.nome.charAt(0)}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-medium truncate">{sg.nome}</p>
                              <p className="text-xs text-slate-500 truncate">
                                {gabineteNome ? `${gabineteNome}` : sg.codigo}
                              </p>
                            </div>
                            {sg.id === subgabinete?.id && (
                              <span className={cn(
                                "text-xs text-white px-2 py-0.5 rounded-full flex-shrink-0",
                                usuario?.superUsuario ? "bg-amber-500" : "bg-violet-500"
                              )}>Ativo</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Contador de resultados */}
                  {subgabineteSearchQuery && (
                    <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
                      <p className="text-xs text-slate-500">
                        {filteredSubgabinetes.length} de {subgabinetes.length} subgabinete(s)
                      </p>
                    </div>
                  )}
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      )}

      {/* Perfil do usuario - exibido para todos */}
      {usuario?.perfilNome && (
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl border',
            'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200'
          )}
        >
          <User className="w-4 h-4 text-slate-600" />
          <div className="text-left">
            <p className="text-xs text-slate-500">Perfil</p>
            <p className="text-sm font-medium text-slate-800 truncate max-w-[180px]">
              {usuario.perfilNome}
            </p>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {/* Notificacoes - esconder se super usuario sem gabinete */}
        {!isSuperUserNoGabinete && (
          <button className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
        )}

        <HeadlessMenu as="div" className="relative">
          <HeadlessMenu.Button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
            <Avatar name={usuario?.nome} src={usuario?.fotoUrl} size="sm" />
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </HeadlessMenu.Button>
          <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
            <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none overflow-hidden">
              <div className={cn('p-3', usuario?.superUsuario ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-primary-500 to-emerald-500')}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{usuario?.nome}</p>
                  {usuario?.superUsuario && <Shield className="w-4 h-4 text-white" />}
                </div>
                <p className="text-xs text-white/80">{usuario?.email}</p>
              </div>
              <div className="p-1">
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button onClick={() => navigate('/perfil')} className={cn('w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors', active ? 'bg-slate-100 text-slate-900' : 'text-slate-700')}>
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </button>
                  )}
                </HeadlessMenu.Item>
                {/* Configuracoes - esconder para atendentes e usuarios de subgabinete */}
                {!isAtendente && !usuario?.pertenceSubgabinete && (
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <button onClick={() => navigate('/configuracoes')} className={cn('w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors', active ? 'bg-slate-100 text-slate-900' : 'text-slate-700')}>
                        <Settings className="w-4 h-4" />
                        Configuracoes
                      </button>
                    )}
                  </HeadlessMenu.Item>
                )}
                {usuario?.superUsuario && (
                  <>
                    <div className="my-1 border-t border-slate-100" />
                    <HeadlessMenu.Item>
                      {({ active }) => (
                        <button onClick={() => navigate('/admin/gabinetes')} className={cn('w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors', active ? 'bg-amber-50 text-amber-600' : 'text-amber-600')}>
                          <Building2 className="w-4 h-4" />
                          Gerenciar Gabinetes
                        </button>
                      )}
                    </HeadlessMenu.Item>
                    <HeadlessMenu.Item>
                      {({ active }) => (
                        <button onClick={() => navigate('/admin/usuarios')} className={cn('w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors', active ? 'bg-amber-50 text-amber-600' : 'text-amber-600')}>
                          <Users className="w-4 h-4" />
                          Gerenciar Usuarios
                        </button>
                      )}
                    </HeadlessMenu.Item>
                  </>
                )}
              </div>
              <div className="p-1 border-t border-slate-100">
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button onClick={handleLogout} className={cn('w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors', active ? 'bg-red-50 text-red-600' : 'text-red-600')}>
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  )}
                </HeadlessMenu.Item>
              </div>
            </HeadlessMenu.Items>
          </Transition>
        </HeadlessMenu>
      </div>
    </header>
  );
};
