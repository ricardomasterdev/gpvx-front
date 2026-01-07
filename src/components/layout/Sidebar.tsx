import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Tags,
  Cake,
  MapPin,
  BarChart3,
  Sparkles,
  Shield,
  UserCog,
  MessageSquare,
  User,
  Layers,
} from 'lucide-react';
import { Avatar } from '../ui';

// Itens de menu com flag para indicar se deve esconder para usuarios de subgabinete
const menuItems = [
  {
    title: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Pessoas', path: '/pessoas' },
      { icon: ClipboardList, label: 'Demandas', path: '/demandas' },
      { icon: Cake, label: 'Aniversariantes', path: '/aniversariantes' },
    ],
  },
  {
    title: 'Gestao',
    items: [
      { icon: Layers, label: 'Subgabinetes', path: '/subgabinetes', hideForSubgabinete: true },
      { icon: UserCog, label: 'Usuarios', path: '/usuarios' },
      { icon: Tags, label: 'Tags', path: '/tags' },
      { icon: MapPin, label: 'Regioes', path: '/regioes', hideForSubgabinete: true },
      { icon: MessageSquare, label: 'WhatsApp', path: '/whatsapp' },
    ],
  },
  {
    title: 'Relatorios',
    items: [
      { icon: BarChart3, label: 'Relatorios', path: '/relatorios', hideForSubgabinete: true },
      { icon: FileText, label: 'Documentos', path: '/documentos', hideForSubgabinete: true },
    ],
  },
];

const adminMenuItems = [
  {
    title: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ],
  },
  {
    title: 'Administracao',
    items: [
      { icon: Building2, label: 'Gabinetes', path: '/admin/gabinetes' },
      { icon: UserCog, label: 'Usuarios', path: '/admin/usuarios' },
      { icon: MessageSquare, label: 'WhatsApp', path: '/admin/whatsapp' },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { usuario, gabinete, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Verifica se usuario pertence a subgabinete
  const isSubgabineteUser = usuario?.pertenceSubgabinete === true;

  // Verifica se usuario e atendente (nao pode ver Gestao nem Configuracoes)
  const isAtendente = usuario?.perfilCodigo?.toLowerCase() === 'atendente';

  // Filtra itens de menu baseado no tipo de usuario
  const filterMenuItems = (items: typeof menuItems) => {
    let filtered = items;

    // Atendente nao ve secao Gestao nem Relatorios
    if (isAtendente) {
      filtered = filtered.filter(section =>
        section.title !== 'Gestao' && section.title !== 'Relatorios'
      );
    } else if (isSubgabineteUser) {
      // Usuario de subgabinete (nao atendente) ve menu filtrado
      filtered = filtered.map(section => ({
        ...section,
        items: section.items.filter(item => !('hideForSubgabinete' in item && item.hideForSubgabinete))
      })).filter(section => section.items.length > 0);
    }

    return filtered;
  };

  // Super usuario sem gabinete selecionado ve apenas opcoes de administracao
  // Super usuario com gabinete selecionado ve tudo
  // Usuario normal ve apenas menu principal
  // Usuario de subgabinete ve menu filtrado (sem Regioes, Subgabinetes, Configuracoes)
  // Atendente ve apenas menu Principal (sem Gestao, Relatorios, Configuracoes)
  const allMenuItems = usuario?.superUsuario
    ? gabinete
      ? [...filterMenuItems(menuItems), ...adminMenuItems]  // Super usuario com gabinete - ve tudo (filtrado se subgabinete)
      : adminMenuItems  // Super usuario sem gabinete - apenas admin
    : filterMenuItems(menuItems);  // Usuario normal (filtrado se subgabinete ou atendente)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-40 shadow-sm',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center justify-between px-4 border-b border-slate-100',
        usuario?.superUsuario
          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
          : 'bg-gradient-to-r from-primary-500 to-emerald-500'
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
              {usuario?.superUsuario ? (
                <Shield className="w-5 h-5 text-white" />
              ) : (
                <Sparkles className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">GPVx</h1>
              <p className="text-xs text-white/80 -mt-0.5">
                {usuario?.superUsuario ? 'Super Admin' : 'Gabinete Virtual'}
              </p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mx-auto backdrop-blur">
            {usuario?.superUsuario ? (
              <Shield className="w-5 h-5 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
        )}
        <button
          onClick={toggleSidebarCollapsed}
          className={cn(
            'p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors',
            sidebarCollapsed && 'absolute -right-3 top-6 bg-white shadow-lg border border-slate-200 text-slate-600 hover:text-slate-800'
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Usuario Info */}
      <div className={cn(
        'px-3 py-4 border-b border-slate-100',
        sidebarCollapsed ? 'flex justify-center' : ''
      )}>
        {sidebarCollapsed ? (
          <div className="relative group">
            <Avatar name={usuario?.nome} src={usuario?.fotoUrl} size="sm" />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
              <p className="text-sm font-medium text-white">{usuario?.nome}</p>
              {usuario?.perfilNome && (
                <p className="text-xs text-slate-300">{usuario.perfilNome}</p>
              )}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar name={usuario?.nome} src={usuario?.fotoUrl} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {usuario?.nome}
              </p>
              {usuario?.perfilNome && (
                <p className="text-xs text-slate-500 truncate">
                  {usuario.perfilNome}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin bg-gradient-to-b from-slate-50/50 to-white">
        {allMenuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            {!sidebarCollapsed && (
              <p className={cn(
                'px-3 mb-2 text-xs font-semibold uppercase tracking-wider',
                section.title === 'Administracao' ? 'text-amber-500' : 'text-slate-400'
              )}>
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? section.title === 'Administracao'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25'
                            : 'bg-gradient-to-r from-primary-500 to-emerald-500 text-white shadow-md shadow-primary-500/25'
                          : section.title === 'Administracao'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-slate-600 hover:bg-primary-50 hover:text-primary-700',
                        sidebarCollapsed && 'justify-center px-2'
                      )
                    }
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-2">
        {/* Configuracoes - esconde para usuarios de subgabinete e atendentes */}
        {!isSubgabineteUser && !isAtendente && (
          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-emerald-500 text-white shadow-md shadow-primary-500/25'
                  : 'text-slate-600 hover:bg-primary-50 hover:text-primary-700',
                sidebarCollapsed && 'justify-center px-2'
              )
            }
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span>Configuracoes</span>}
          </NavLink>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full',
            'text-red-500 hover:bg-red-50 hover:text-red-600',
            sidebarCollapsed && 'justify-center px-2'
          )}
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
          {!sidebarCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};
