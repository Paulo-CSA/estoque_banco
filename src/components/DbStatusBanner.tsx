import React from 'react';
import { Database, AlertTriangle, CheckCircle2, ChevronRight, Server } from 'lucide-react';
import { DbConfigStatus } from '../types';

interface DbStatusBannerProps {
  dbStatus: DbConfigStatus | null;
  onOpenDbSettings: () => void;
}

export const DbStatusBanner: React.FC<DbStatusBannerProps> = ({ dbStatus, onOpenDbSettings }) => {
  if (!dbStatus) return null;

  if (dbStatus.connected) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-100 text-emerald-800 px-4 py-2.5 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Banco de Dados Conectado:</strong> Servidor {dbStatus.mode === 'postgres' ? 'PostgreSQL' : 'MySQL'} em <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded text-emerald-900 font-mono text-xs">{dbStatus.host}:{dbStatus.port}</code> (Banco: <span className="font-semibold">{dbStatus.database}</span>)
            </span>
          </div>
          <button
            onClick={onOpenDbSettings}
            className="flex items-center text-emerald-700 hover:text-emerald-900 font-medium gap-1 underline underline-offset-2 ml-auto"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Ver detalhes da conexão</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50/70 border-b border-indigo-100 text-slate-800 px-4 py-3 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-start sm:items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <p className="font-semibold text-slate-900">
              Operando em Modo de Memória Local (Demonstração)
            </p>
            <p className="text-slate-500 text-xs">
              Para conectar a um banco externo, configure o arquivo <code className="bg-white px-1.5 py-0.5 rounded font-mono text-indigo-600 border border-slate-200">.env</code> com <span className="font-mono text-slate-700">DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD</span>.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenDbSettings}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-xs shrink-0 shadow-xs"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Configurar .env</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
