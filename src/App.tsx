import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { MainLayout, AuthLayout } from './components/layout';
import { LoginPage, ForgotPasswordPage } from './pages/auth';
import { DashboardPage } from './pages/dashboard';
import { GabinetesListPage, UsuariosListPage, SubgabinetesListPage, WhatsAppSessionsPage } from './pages/admin';
import { PessoasListPage } from './pages/pessoas';
import { TagsListPage } from './pages/tags';
import { AniversariantesListPage } from './pages/aniversariantes';
import { DemandasListPage } from './pages/demandas';
import { UsuariosGabineteListPage } from './pages/usuarios';
import { WhatsAppListPage } from './pages/whatsapp';
import { RegioesListPage } from './pages/regioes';
import { SetoresListPage } from './pages/setores';
import { SetorRegioesListPage } from './pages/setor-regioes';
import {
  RelatorioPessoasPorTagsPage,
  RelatorioPessoasPorCidadePage,
  RelatorioPessoasPorRegiaoPage,
  RelatorioPessoasPorLiderancaPage,
  RelatorioDemandasPorTipoPage,
  RelatorioPessoasPorUsuarioPage,
  RelatorioPessoasPorSubgabinetePage,
  RelatorioPessoasPorSetorSubdivisaoPage,
  RelatorioPessoasPorSetorRegiaoPage,
} from './pages/relatorios';
import { DocumentosListPage } from './pages/documentos';
import { MapaFullscreenPage } from './pages/mapa/MapaFullscreenPage';
import { useAuthStore } from './stores/authStore';
import { LoadingScreen } from './components/ui';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  if (!_hasHydrated || isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  if (!_hasHydrated || isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-500">Esta pagina esta em desenvolvimento</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
          </Route>
          {/* Mapa Fullscreen - Protected but without MainLayout */}
          <Route path="/mapa-fullscreen" element={<ProtectedRoute><MapaFullscreenPage /></ProtectedRoute>} />
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pessoas" element={<PessoasListPage />} />
            <Route path="/pessoas/novo" element={<PlaceholderPage title="Nova Pessoa" />} />
            <Route path="/pessoas/:id" element={<PlaceholderPage title="Detalhes da Pessoa" />} />
            <Route path="/demandas" element={<DemandasListPage />} />
            <Route path="/demandas/novo" element={<PlaceholderPage title="Nova Demanda" />} />
            <Route path="/demandas/:id" element={<PlaceholderPage title="Detalhes da Demanda" />} />
            <Route path="/aniversariantes" element={<AniversariantesListPage />} />
            <Route path="/subgabinetes" element={<SubgabinetesListPage />} />
            <Route path="/tags" element={<TagsListPage />} />
            <Route path="/usuarios" element={<UsuariosGabineteListPage />} />
            <Route path="/regioes" element={<RegioesListPage />} />
            <Route path="/setores" element={<SetoresListPage />} />
            <Route path="/setor-regioes" element={<SetorRegioesListPage />} />
            {/* Rotas de Relatorios */}
            <Route path="/relatorios/pessoas-por-tags" element={<RelatorioPessoasPorTagsPage />} />
            <Route path="/relatorios/pessoas-por-cidade" element={<RelatorioPessoasPorCidadePage />} />
            <Route path="/relatorios/pessoas-por-regiao" element={<RelatorioPessoasPorRegiaoPage />} />
            <Route path="/relatorios/pessoas-por-setor-subdivisao" element={<RelatorioPessoasPorSetorSubdivisaoPage />} />
            <Route path="/relatorios/pessoas-por-setor-regiao" element={<RelatorioPessoasPorSetorRegiaoPage />} />
            <Route path="/relatorios/pessoas-por-lideranca" element={<RelatorioPessoasPorLiderancaPage />} />
            <Route path="/relatorios/demandas-por-tipo" element={<RelatorioDemandasPorTipoPage />} />
            <Route path="/relatorios/pessoas-por-usuario" element={<RelatorioPessoasPorUsuarioPage />} />
            <Route path="/relatorios/pessoas-por-subgabinete" element={<RelatorioPessoasPorSubgabinetePage />} />
            {/* Rotas de Gestao de Documentos */}
            <Route path="/documentos" element={<DocumentosListPage />} />
            <Route path="/whatsapp" element={<WhatsAppListPage />} />
            <Route path="/configuracoes" element={<PlaceholderPage title="Configuracoes" />} />
            <Route path="/perfil" element={<PlaceholderPage title="Meu Perfil" />} />
            {/* Rotas Admin */}
            <Route path="/admin/gabinetes" element={<GabinetesListPage />} />
            <Route path="/admin/gabinetes/novo" element={<PlaceholderPage title="Novo Gabinete" />} />
            <Route path="/admin/gabinetes/:id" element={<PlaceholderPage title="Detalhes do Gabinete" />} />
            <Route path="/admin/gabinetes/:id/editar" element={<PlaceholderPage title="Editar Gabinete" />} />
            <Route path="/admin/usuarios" element={<UsuariosListPage />} />
            <Route path="/admin/usuarios/novo" element={<PlaceholderPage title="Novo Usuario" />} />
            <Route path="/admin/usuarios/:id" element={<PlaceholderPage title="Detalhes do Usuario" />} />
            <Route path="/admin/usuarios/:id/editar" element={<PlaceholderPage title="Editar Usuario" />} />
            <Route path="/admin/whatsapp" element={<WhatsAppSessionsPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
                <p className="text-xl text-slate-600 mb-4">Pagina nao encontrada</p>
                <a href="/dashboard" className="text-primary-600 hover:underline">Voltar ao Dashboard</a>
              </div>
            </div>
          } />
        </Routes>
      </HashRouter>
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { background: '#fff', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }} />
    </QueryClientProvider>
  );
}

export default App;
