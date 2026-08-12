import React, { useState } from 'react';
import { Package, LayoutDashboard, ArrowUpDown, Tag, Users, Database, AlertTriangle, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import { DbConfigStatus } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dbStatus: DbConfigStatus | null;
  onRefreshDb: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, dbStatus, onRefreshDb }) => {
  const [showDbTooltip, setShowDbTooltip] = useState(false);

  const isDbConnected = dbStatus?.connected ?? false;

  return (
    <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight uppercase text-slate-900 flex items-center gap-2">
                NexusStock
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Controle de Estoque & Banco de Dados</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'products'
                  ? 'bg-slate-100 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Estoque</span>
            </button>

            <button
              onClick={() => setActiveTab('movements')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'movements'
                  ? 'bg-slate-100 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Movimentações</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'categories'
                  ? 'bg-slate-100 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Categorias / Fornecedores</span>
            </button>

            <button
              onClick={() => setActiveTab('db-settings')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'db-settings'
                  ? 'bg-slate-100 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Banco (.env)</span>
            </button>
          </nav>

          {/* Database Connection Status Badge */}
          <div className="relative">
            <button
              onClick={() => setActiveTab('db-settings')}
              onMouseEnter={() => setShowDbTooltip(true)}
              onMouseLeave={() => setShowDbTooltip(false)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isDbConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <Server className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isDbConnected
                  ? `${dbStatus?.mode === 'postgres' ? 'PostgreSQL' : 'MySQL'}: ${dbStatus?.host}`
                  : 'Modo Memória (.env)'}
              </span>
              <span className="sm:hidden">
                {isDbConnected ? 'DB Conectado' : 'Modo Memória'}
              </span>
            </button>

            {/* Quick Hover Tooltip */}
            {showDbTooltip && (
              <div className="absolute right-0 mt-2 w-72 p-3 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 text-xs z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 font-semibold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-indigo-600" />
                    Status do Banco de Dados
                  </span>
                  {isDbConnected ? (
                    <span className="text-emerald-700 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold uppercase">
                      Conectado
                    </span>
                  ) : (
                    <span className="text-amber-700 text-[10px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold uppercase">
                      Modo Memória
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-slate-600">
                  <p><strong className="text-slate-800">Host (IP):</strong> {dbStatus?.host || 'Nenhum'}</p>
                  <p><strong className="text-slate-800">Porta:</strong> {dbStatus?.port || '-'}</p>
                  <p><strong className="text-slate-800">Banco:</strong> {dbStatus?.database || '-'}</p>
                  <p><strong className="text-slate-800">Usuário:</strong> {dbStatus?.user || '-'}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-indigo-600 font-medium text-right cursor-pointer hover:underline" onClick={() => setActiveTab('db-settings')}>
                  Clique para configurar ou testar &rarr;
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden border-t border-slate-200 bg-white overflow-x-auto flex py-2 px-3 space-x-2 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-600 bg-slate-100'
          }`}
        >
          Painel
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'products' ? 'bg-indigo-600 text-white' : 'text-slate-600 bg-slate-100'
          }`}
        >
          Estoque
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'movements' ? 'bg-indigo-600 text-white' : 'text-slate-600 bg-slate-100'
          }`}
        >
          Movimentações
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-600 bg-slate-100'
          }`}
        >
          Categorias & Fornecedores
        </button>
        <button
          onClick={() => setActiveTab('db-settings')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'db-settings' ? 'bg-indigo-600 text-white' : 'text-slate-600 bg-slate-100'
          }`}
        >
          Configurar Banco
        </button>
      </div>
    </header>
  );
};
