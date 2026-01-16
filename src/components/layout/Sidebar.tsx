import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  ChevronDown,
  Building2,
  Tags,
  Cake,
  MapPin,
  BarChart3,
  Sparkles,
  Shield,
  UserCog,
  MessageSquare,
  Layers,
  Tag,
  MapPinned,
  UserCheck,
  FolderKanban,
  User,
  Building,
  X,
  Grid3X3,
} from 'lucide-react';
import { Avatar } from '../ui';

// Interface para itens de menu
interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  hideForSubgabinete?: boolean;
  children?: MenuItem[];
}

interface MenuSection {
  title: string;
  icon: React.ElementType;
  items: MenuItem[];
}

// Itens de menu com flag para indicar se deve esconder para usuarios de subgabinete
const menuItems: MenuSection[] = [
  {
    title: 'Principal',
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Pessoas', path: '/pessoas' },
      { icon: ClipboardList, label: 'Demandas', path: '/demandas' },
      { icon: Cake, label: 'Aniversariantes', path: '/aniversariantes' },
    ],
  },
  {
    title: 'Cadastro',
    icon: Grid3X3,
    items: [
      { icon: Layers, label: 'Subgabinetes', path: '/subgabinetes', hideForSubgabinete: true },
      { icon: MapPin, label: 'Regional/SubRegionais', path: '/regioes', hideForSubgabinete: true },
      { icon: Grid3X3, label: 'Setor/Subdivisoes', path: '/setores', hideForSubgabinete: true },
      { icon: Layers, label: 'Setor/Regiao', path: '/setor-regioes', hideForSubgabinete: true },
      { icon: Tags, label: 'Tags', path: '/tags' },
    ],
  },
  {
    title: 'Gestao',
    icon: Settings,
    items: [
      { icon: UserCog, label: 'Usuarios', path: '/usuarios' },
      { icon: MessageSquare, label: 'WhatsApp', path: '/whatsapp' },
    ],
  },
  {
    title: 'Relatorios',
    icon: BarChart3,
    items: [
      { icon: Tag, label: 'Por Tags', path: '/relatorios/pessoas-por-tags', hideForSubgabinete: true },
      { icon: MapPinned, label: 'Por Cidade', path: '/relatorios/pessoas-por-cidade', hideForSubgabinete: true },
      { icon: MapPin, label: 'Por Regiao', path: '/relatorios/pessoas-por-regiao', hideForSubgabinete: true },
      { icon: Layers, label: 'Por Setor/Subdivisao', path: '/relatorios/pessoas-por-setor-subdivisao', hideForSubgabinete: true },
      { icon: Grid3X3, label: 'Por Setor/Regiao', path: '/relatorios/pessoas-por-setor-regiao', hideForSubgabinete: true },
      { icon: UserCheck, label: 'Por Lideranca', path: '/relatorios/pessoas-por-lideranca', hideForSubgabinete: true },
      { icon: FolderKanban, label: 'Demandas por Tipo', path: '/relatorios/demandas-por-tipo', hideForSubgabinete: true },
      { icon: User, label: 'Por Usuario', path: '/relatorios/pessoas-por-usuario', hideForSubgabinete: true },
      { icon: Building, label: 'Por Subgabinete', path: '/relatorios/pessoas-por-subgabinete', hideForSubgabinete: true },
    ],
  },
  {
    title: 'Documentos',
    icon: FileText,
    items: [
      { icon: FileText, label: 'Documentos', path: '/documentos' },
    ],
  },
];

const adminMenuItems: MenuSection[] = [
  {
    title: 'Administracao',
    icon: Shield,
    items: [
      { icon: Building2, label: 'Gabinetes', path: '/admin/gabinetes' },
      { icon: UserCog, label: 'Usuarios', path: '/admin/usuarios' },
      { icon: MessageSquare, label: 'WhatsApp', path: '/admin/whatsapp' },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, gabinete, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore();

  // Estado para controlar quais secoes estao expandidas
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Verifica se usuario pertence a subgabinete
  const isSubgabineteUser = usuario?.pertenceSubgabinete === true;

  // Verifica se usuario e atendente (nao pode ver Gestao nem Configuracoes)
  const isAtendente = usuario?.perfilCodigo?.toLowerCase() === 'atendente';

  // Toggle secao expandida
  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(t => t !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  // Verifica se a secao contem a rota ativa
  const isSectionActive = (section: MenuSection): boolean => {
    return section.items.some(item => location.pathname.startsWith(item.path));
  };

  // Expande automaticamente a secao que contem a rota ativa
  useEffect(() => {
    const activeSection = allMenuItems.find(section => isSectionActive(section));
    if (activeSection && !expandedSections.includes(activeSection.title)) {
      setExpandedSections(prev => [...prev, activeSection.title]);
    }
  }, [location.pathname]);

  // Filtra itens de menu baseado no tipo de usuario
  const filterMenuItems = (items: MenuSection[]): MenuSection[] => {
    let filtered = items;

    // Atendente nao ve secao Cadastro, Gestao nem Relatorios
    if (isAtendente) {
      filtered = filtered.filter(section =>
        section.title !== 'Cadastro' && section.title !== 'Gestao' && section.title !== 'Relatorios'
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

  // Renderiza um item de menu
  const renderMenuItem = (item: MenuItem, isAdmin: boolean) => {
    return (
      <li key={item.path}>
        <NavLink
          to={item.path}
          onClick={handleNavClick}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? isAdmin
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-primary-100 text-primary-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )
          }
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      </li>
    );
  };

  // Renderiza uma secao do menu (accordion)
  const renderSection = (section: MenuSection, isAdmin: boolean = false) => {
    const isExpanded = expandedSections.includes(section.title);
    const isActive = isSectionActive(section);

    return (
      <div key={section.title} className="mb-2">
        {/* Header da secao (clicavel) */}
        <button
          onClick={() => toggleSection(section.title)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
            isExpanded || isActive
              ? isAdmin
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'bg-gradient-to-r from-primary-500 to-emerald-500 text-white shadow-md'
              : isAdmin
                ? 'text-amber-600 hover:bg-amber-50'
                : 'text-slate-700 hover:bg-slate-100'
          )}
        >
          <div className="flex items-center gap-3">
            <section.icon className="w-5 h-5" />
            {!sidebarCollapsed && <span>{section.title}</span>}
          </div>
          {!sidebarCollapsed && (
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </button>

        {/* Itens da secao (expandiveis) */}
        {!sidebarCollapsed && (
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <ul className="mt-1 ml-2 pl-4 border-l-2 border-slate-200 space-y-1">
              {section.items.map((item) => renderMenuItem(item, isAdmin))}
            </ul>
          </div>
        )}

        {/* Tooltip quando sidebar colapsada */}
        {sidebarCollapsed && (
          <div className="relative group">
            <div className="absolute left-full ml-2 top-0 min-w-[180px] bg-white rounded-xl shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <p className={cn(
                'px-3 py-1 text-xs font-semibold uppercase',
                isAdmin ? 'text-amber-500' : 'text-slate-400'
              )}>
                {section.title}
              </p>
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive: itemActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                      itemActive
                        ? isAdmin
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-40 shadow-sm overflow-hidden',
        'lg:translate-x-0',
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
        'w-[280px] sm:w-72',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
            'p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors hidden lg:block',
            sidebarCollapsed && 'absolute -right-3 top-6 bg-white shadow-lg border border-slate-200 text-slate-600 hover:text-slate-800'
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {/* Botao fechar mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors lg:hidden"
        >
          <X className="w-5 h-5" />
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

      {/* Menu Accordion */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin bg-gradient-to-b from-slate-50/50 to-white">
        {allMenuItems.map((section) =>
          renderSection(section, section.title === 'Administracao')
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-2">
        {/* Configuracoes - esconde para usuarios de subgabinete e atendentes */}
        {!isSubgabineteUser && !isAtendente && (
          <NavLink
            to="/configuracoes"
            onClick={handleNavClick}
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
