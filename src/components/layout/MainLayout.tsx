import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../stores/uiStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/30">
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300 min-h-screen',
          'ml-0',
          'lg:ml-64',
          sidebarCollapsed && 'lg:ml-20'
        )}
      >
        <Header />
        <main className="p-3 pt-[72px] sm:p-4 sm:pt-20 lg:p-6 lg:pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
