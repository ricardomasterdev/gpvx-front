import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cake,
  TrendingUp,
  ArrowUpRight,
  Phone,
  MessageCircle,
  Building2,
  Shield,
  UserCog,
  BarChart3,
  Loader2,
  Crown,
  UserPlus,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Button } from '../../components/ui';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';
import { adminService, DashboardStats as AdminDashboardStats } from '../../services/admin.service';
import { dashboardService, DashboardResponse } from '../../services/dashboard.service';

const statusColors: Record<string, string> = {
  Aberta: 'bg-blue-100 text-blue-800',
  'Em Andamento': 'bg-amber-100 text-amber-800',
  Aguardando: 'bg-purple-100 text-purple-800',
  Concluida: 'bg-green-100 text-green-800',
  Cancelada: 'bg-slate-100 text-slate-800',
};

const prioridadeColors: Record<string, string> = {
  baixa: 'text-slate-500 bg-slate-500',
  normal: 'text-blue-500 bg-blue-500',
  alta: 'text-amber-500 bg-amber-500',
  urgente: 'text-orange-500 bg-orange-500',
  critica: 'text-red-500 bg-red-500',
};

// Funcao para formatar numeros grandes
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return num.toLocaleString('pt-BR');
  }
  return num.toString();
};

// Componente Dashboard Super Usuario (sem gabinete selecionado)
const SuperUserDashboard: React.FC = () => {
  const { data: dashboardStats, isLoading, isError, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminService.getDashboardStats(),
    refetchInterval: 60000, // Atualiza a cada 1 minuto
    retry: 1,
  });

  // Criar array de stats baseado nos dados reais
  const superUserStats = dashboardStats ? [
    {
      title: 'Total de Gabinetes',
      value: formatNumber(dashboardStats.gabinetesAtivos),
      subtitle: `${dashboardStats.totalGabinetes} cadastrados`,
      icon: Building2,
      color: 'bg-amber-500',
      link: '/admin/gabinetes',
    },
    {
      title: 'Total de Usuarios',
      value: formatNumber(dashboardStats.usuariosAtivos),
      subtitle: `${dashboardStats.totalUsuarios} cadastrados`,
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/usuarios',
    },
    {
      title: 'Total de Pessoas',
      value: formatNumber(dashboardStats.totalPessoas),
      subtitle: 'cadastradas no sistema',
      icon: UserCog,
      color: 'bg-green-500',
      link: '/pessoas',
    },
    {
      title: 'Total de Demandas',
      value: formatNumber(dashboardStats.totalDemandas),
      subtitle: `${dashboardStats.demandasAbertas} abertas`,
      icon: ClipboardList,
      color: 'bg-purple-500',
      link: '/demandas',
    },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-slate-900">Painel Administrativo</h1>
          </div>
          <p className="text-slate-500">Visao geral do sistema - Super Usuario</p>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-red-500">Erro ao carregar estatisticas</p>
          <p className="text-sm text-slate-500 mt-2">Verifique o console para mais detalhes</p>
        </div>
      ) : superUserStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {superUserStats.map((stat, idx) => (
            <Link key={idx} to={stat.link}>
              <Card variant="hover" className="relative overflow-hidden border-amber-100 cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', stat.color)}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500">Nenhum dado disponivel</p>
        </div>
      )}

      {/* Cards de Resumo */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/demandas?status=aberta">
            <Card variant="hover" className="border-blue-100 cursor-pointer group relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center transition-transform group-hover:scale-110">
                    <ClipboardList className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Demandas Abertas</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(dashboardStats.demandasAbertas)}</p>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/demandas?status=em_andamento">
            <Card variant="hover" className="border-amber-100 cursor-pointer group relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Em Andamento</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(dashboardStats.demandasEmAndamento)}</p>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/demandas?status=concluida">
            <Card variant="hover" className="border-green-100 cursor-pointer group relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center transition-transform group-hover:scale-110">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Concluidas</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(dashboardStats.demandasConcluidas)}</p>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Acoes Rapidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-amber-900">Gerenciar Gabinetes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 mb-4">
              Cadastre, edite ou remova gabinetes do sistema.
            </p>
            <Link to="/admin/gabinetes">
              <Button className="bg-amber-500 hover:bg-amber-600">
                Acessar Gabinetes
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-blue-900">Gerenciar Usuarios</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-4">
              Cadastre, edite ou remova usuarios do sistema.
            </p>
            <Link to="/admin/usuarios">
              <Button className="bg-blue-500 hover:bg-blue-600">
                Acessar Usuarios
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Componente Dashboard do Gabinete (gabinete selecionado)
const GabineteDashboard: React.FC = () => {
  const { gabinete, subgabinete } = useAuthStore();

  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['gabinete-dashboard', gabinete?.id, subgabinete?.id],
    queryFn: () => dashboardService.getDashboard(),
    refetchInterval: 60000, // Atualiza a cada 1 minuto
    retry: 1,
    enabled: !!gabinete?.id,
  });

  // Criar stats baseado nos dados reais
  const stats = dashboardData ? [
    {
      title: 'Total de Pessoas',
      value: formatNumber(dashboardData.stats.totalPessoas),
      icon: Users,
      color: 'bg-blue-500',
      link: '/pessoas',
    },
    {
      title: 'Demandas Abertas',
      value: formatNumber(dashboardData.stats.demandasAbertas),
      icon: ClipboardList,
      color: 'bg-amber-500',
      link: '/demandas?status=aberta',
    },
    {
      title: 'Demandas Atrasadas',
      value: formatNumber(dashboardData.stats.demandasAtrasadas),
      icon: AlertTriangle,
      color: 'bg-red-500',
      link: '/demandas?atrasadas=true',
    },
    {
      title: 'Concluidas',
      value: formatNumber(dashboardData.stats.demandasConcluidas),
      icon: CheckCircle,
      color: 'bg-green-500',
      link: '/demandas?status=concluida',
    },
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-24">
        <p className="text-red-500">Erro ao carregar dashboard</p>
        <p className="text-sm text-slate-500 mt-2">Verifique o console para mais detalhes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            Visao geral - {subgabinete ? subgabinete.nome : gabinete?.nome}
            {subgabinete && <span className="text-xs ml-2">({gabinete?.nome})</span>}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Link key={idx} to={stat.link}>
            <Card variant="hover" className="relative overflow-hidden cursor-pointer group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', stat.color)}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Ultimos Cadastros */}
      <Card padding="none" variant="hover" className="mb-6 group">
        <Link to="/pessoas">
          <CardHeader className="p-6 pb-0 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center transition-transform group-hover:scale-110">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                </div>
                <CardTitle>Últimos Cadastros</CardTitle>
              </div>
              <div className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                Ver todas
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
        </Link>
        <CardContent className="p-0 mt-4">
          {dashboardData?.ultimosCadastros && dashboardData.ultimosCadastros.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {dashboardData.ultimosCadastros.map((pessoa) => (
                <Link
                  key={pessoa.id}
                  to={`/pessoas`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  <Avatar name={pessoa.nome} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{pessoa.nome}</p>
                    <p className="text-xs text-slate-500">
                      Cadastrado por: {pessoa.usuarioCadastro || 'Sistema'}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-600">{pessoa.dataCadastro}</p>
                      <p className="text-xs text-slate-400">{pessoa.horaCadastro}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              Nenhum cadastro recente
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demandas Recentes */}
        <div className="lg:col-span-2">
          <Card padding="none" variant="hover" className="group">
            <Link to="/demandas">
              <CardHeader className="p-6 pb-0 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center transition-transform group-hover:scale-110">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                    <CardTitle>Demandas Recentes</CardTitle>
                  </div>
                  <div className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                    Ver todas
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </CardHeader>
            </Link>
            <CardContent className="p-0 mt-4">
              {dashboardData?.demandasRecentes && dashboardData.demandasRecentes.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {dashboardData.demandasRecentes.map((demanda) => (
                    <Link
                      key={demanda.id}
                      to={'/demandas/' + demanda.id}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className={cn('w-1 h-12 rounded-full', prioridadeColors[demanda.prioridade]?.split(' ')[1] || 'bg-blue-500')} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-400">{demanda.numeroProtocolo}</span>
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[demanda.status] || 'bg-slate-100 text-slate-800')}>
                            {demanda.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 truncate">{demanda.titulo}</p>
                        <p className="text-xs text-slate-500">{demanda.nomeSolicitante || 'Sem solicitante'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">{demanda.dataAbertura}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Nenhuma demanda recente
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Aniversariantes */}
        <div>
          <Card variant="hover" className="group">
            <Link to="/aniversariantes">
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center transition-transform group-hover:scale-110">
                      <Cake className="w-5 h-5 text-pink-600" />
                    </div>
                    <CardTitle>Aniversariantes Hoje</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{dashboardData?.stats.aniversariantesHoje || 0}</Badge>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </CardHeader>
            </Link>
            <CardContent>
              {dashboardData?.aniversariantesHoje && dashboardData.aniversariantesHoje.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.aniversariantesHoje.map((pessoa) => (
                    <div key={pessoa.id} className="flex items-center gap-3">
                      <Avatar name={pessoa.nome} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{pessoa.nome}</p>
                        <p className="text-xs text-slate-500">{pessoa.idade} anos</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {pessoa.whatsapp && (
                          <a
                            href={`https://wa.me/55${pessoa.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        {pessoa.telefone && (
                          <a
                            href={`tel:${pessoa.telefone}`}
                            className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Ligar"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-slate-500 text-sm">
                  Nenhum aniversariante hoje
                </div>
              )}
              <Link to="/aniversariantes">
                <Button variant="outline" className="w-full mt-4" size="sm">
                  Ver todos os aniversariantes
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Link to="/demandas">
            <Card variant="hover" className="mt-4 cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center transition-transform group-hover:scale-110">
                      <BarChart3 className="w-5 h-5 text-slate-600" />
                    </div>
                    <CardTitle>Resumo</CardTitle>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total de pessoas</span>
                    <span className="text-sm font-semibold text-slate-900">{formatNumber(dashboardData?.stats.totalPessoas || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total de liderancas</span>
                    <span className="text-sm font-semibold text-slate-900">{formatNumber(dashboardData?.stats.totalLiderancas || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Demandas em andamento</span>
                    <span className="text-sm font-semibold text-amber-600">{formatNumber(dashboardData?.stats.demandasEmAndamento || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Demandas concluidas</span>
                    <span className="text-sm font-semibold text-green-600">{formatNumber(dashboardData?.stats.demandasConcluidas || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Demandas atrasadas</span>
                    <span className="text-sm font-semibold text-red-600">{formatNumber(dashboardData?.stats.demandasAtrasadas || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Componente Principal - Decide qual dashboard mostrar
export const DashboardPage: React.FC = () => {
  const { usuario, gabinete } = useAuthStore();

  // Super usuario sem gabinete selecionado - mostra dashboard administrativo
  if (usuario?.superUsuario && !gabinete) {
    return <SuperUserDashboard />;
  }

  // Com gabinete selecionado - mostra dashboard do gabinete
  return <GabineteDashboard />;
};
