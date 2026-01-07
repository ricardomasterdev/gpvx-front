import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/30 mb-4">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">GPVx</h1>
          <p className="text-slate-500">Gabinete Parlamentar Virtual</p>
        </div>

        {/* Content */}
        <Outlet />

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-8">
          &copy; {new Date().getFullYear()} GPVx. Todos os direitos reservados. CDX Solucoes.
        </p>
      </div>
    </div>
  );
};
