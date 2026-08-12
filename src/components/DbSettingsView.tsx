import React, { useState } from 'react';
import { Database, Server, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check, Terminal, Code, Table, ShieldCheck, XCircle } from 'lucide-react';
import { DbConfigStatus } from '../types';

interface DbSettingsViewProps {
  dbStatus: DbConfigStatus | null;
  onRefreshDb: () => Promise<void>;
}

export const DbSettingsView: React.FC<DbSettingsViewProps> = ({ dbStatus, onRefreshDb }) => {
  const [testing, setTesting] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeSqlType, setActiveSqlType] = useState<'postgres' | 'mysql'>('postgres');

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      await onRefreshDb();
    } finally {
      setTesting(false);
    }
  };

  const sampleEnvText = `# Configurações de Conexão com o Banco de Dados Externo
# IP público, hostname ou domínio do seu servidor de banco de dados
DB_HOST=${dbStatus?.host && dbStatus.host !== 'Não informado' ? dbStatus.host : '192.168.1.100'}

# Porta do banco (Ex: 5432 para PostgreSQL, 3306 para MySQL)
DB_PORT=${dbStatus?.port || '5432'}

# Nome do banco de dados criado no servidor
DB_NAME=${dbStatus?.database && dbStatus.database !== 'Não informado' ? dbStatus.database : 'estoque_db'}

# Usuário do banco
DB_USER=${dbStatus?.user && dbStatus.user !== 'Não informado' ? dbStatus.user : 'postgres'}

# Senha do usuário do banco
DB_PASSWORD=sua_senha_aqui

# Tipo de banco de dados: postgres (padrão) ou mysql
DB_TYPE=${dbStatus?.mode === 'mysql' ? 'mysql' : 'postgres'}

# Opcional: SSL para conexões remotas em nuvem (true/false)
DB_SSL=true`;

  const postgresSqlScript = `-- Script de Criação das Tabelas de Estoque (PostgreSQL)
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(32) DEFAULT '#4f46e5',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cnpj_cpf VARCHAR(32),
  email VARCHAR(255),
  phone VARCHAR(64),
  contact_person VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  sku VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 5,
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  unit_measure VARCHAR(32) DEFAULT 'UN',
  location VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movements (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(64),
  type VARCHAR(16) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) DEFAULT 0.00,
  total_price NUMERIC(12, 2) DEFAULT 0.00,
  reason VARCHAR(255),
  user_name VARCHAR(128) DEFAULT 'Sistema',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;

  const mysqlSqlScript = `-- Script de Criação das Tabelas de Estoque (MySQL)
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(32) DEFAULT '#4f46e5',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cnpj_cpf VARCHAR(32),
  email VARCHAR(255),
  phone VARCHAR(64),
  contact_person VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  sku VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id VARCHAR(64),
  supplier_id VARCHAR(64),
  quantity INT NOT NULL DEFAULT 0,
  min_quantity INT NOT NULL DEFAULT 5,
  unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  unit_measure VARCHAR(32) DEFAULT 'UN',
  location VARCHAR(128),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movements (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64),
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(64),
  type VARCHAR(16) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12, 2) DEFAULT 0.00,
  total_price DECIMAL(12, 2) DEFAULT 0.00,
  reason VARCHAR(255),
  user_name VARCHAR(128) DEFAULT 'Sistema',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

  const copyToClipboard = (text: string, type: 'env' | 'sql') => {
    navigator.clipboard.writeText(text);
    if (type === 'env') {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    } else {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  const tables = dbStatus?.tablesStatus;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            Conexão com Banco de Dados Externo (.env)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Conecte a aplicação ao seu servidor remoto PostgreSQL ou MySQL e verifique a criação das tabelas.
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Testando Conexão...' : 'Testar e Recarregar .env'}</span>
        </button>
      </div>

      {/* Live Connection Diagnostics */}
      <div className={`p-6 rounded-xl border text-sm transition-all ${
        dbStatus?.connected
          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50/50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-200/60">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${dbStatus?.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900 flex items-center gap-2">
                Status da Conexão:
                {dbStatus?.connected ? (
                  <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Conectado ao Banco Externo ({dbStatus.mode.toUpperCase()})
                  </span>
                ) : (
                  <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Modo de Memória Local (Off-line)
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-600 mt-1">{dbStatus?.message}</p>
            </div>
          </div>
        </div>

        {/* Credentials Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Servidor (DB_HOST)</span>
            <span className="font-mono font-semibold text-slate-900 text-sm mt-0.5 block truncate">{dbStatus?.host || 'Não informado'}</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Porta (DB_PORT)</span>
            <span className="font-mono font-semibold text-slate-900 text-sm mt-0.5 block">{dbStatus?.port || '5432'}</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Banco (DB_NAME)</span>
            <span className="font-mono font-semibold text-slate-900 text-sm mt-0.5 block truncate">{dbStatus?.database || 'Não informado'}</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Usuário (DB_USER)</span>
            <span className="font-mono font-semibold text-slate-900 text-sm mt-0.5 block truncate">{dbStatus?.user || 'Não informado'}</span>
          </div>
        </div>

        {/* Error Notification Banner */}
        {dbStatus?.error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-mono space-y-1">
            <strong className="font-semibold text-rose-900 block flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" /> Causa da falha de conexão:
            </strong>
            <p className="text-rose-700 leading-relaxed">{dbStatus.error}</p>
          </div>
        )}

        {/* Table Creation Diagnostics */}
        {dbStatus?.connected && (
          <div className="mt-4 pt-4 border-t border-slate-200/80">
            <h4 className="text-xs font-semibold uppercase text-slate-600 tracking-wider mb-2.5 flex items-center gap-1.5">
              <Table className="w-4 h-4 text-indigo-600" /> Status de Criação das Tabelas no Banco:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Categorias', key: 'categories' },
                { name: 'Fornecedores', key: 'suppliers' },
                { name: 'Produtos', key: 'products' },
                { name: 'Movimentações', key: 'movements' }
              ].map(tb => {
                const isCreated = tables ? tables[tb.key as keyof typeof tables] : true;
                return (
                  <div key={tb.key} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700">{tb.name}</span>
                    {isCreated ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        <Check className="w-3 h-3" /> Criada
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                        <XCircle className="w-3 h-3" /> Pendente
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Checklist / Instructions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-base">Modelo para o arquivo .env</h3>
          </div>

          <button
            onClick={() => copyToClipboard(sampleEnvText, 'env')}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            {copiedEnv ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar .env</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Edite o arquivo <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-700 border border-slate-200">.env</code> na raiz do projeto e clique no botão <strong>"Testar e Recarregar .env"</strong> acima:
        </p>

        {/* .env Code Block */}
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed">
          {sampleEnvText}
        </pre>

        {/* Troubleshooting Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> 1. Liberação de Firewall
            </strong>
            <p className="text-slate-600">
              Certifique-se de que a porta <strong>5432</strong> (PostgreSQL) ou <strong>3306</strong> (MySQL) está aberta no firewall/security group do seu servidor externo para conexões do IP da aplicação.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-semibold flex items-center gap-1.5">
              <Server className="w-4 h-4 text-indigo-600" /> 2. Permissão do Usuário
            </strong>
            <p className="text-slate-600">
              O usuário informado precisa de permissão de <code className="text-slate-800">CREATE TABLE</code> e <code className="text-slate-800">INSERT</code> no banco de dados para criar as tabelas do sistema.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 3. Criação Automática
            </strong>
            <p className="text-slate-600">
              Assim que a conexão for estabelecida, o sistema executa automaticamente os comandos DDL para criar as tabelas <code className="text-slate-800 font-mono">products</code>, <code className="text-slate-800 font-mono">categories</code>, etc.
            </p>
          </div>
        </div>
      </div>

      {/* Manual SQL Script Generator */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-base">Script SQL de Criação Manual (Opcional)</h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setActiveSqlType('postgres')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  activeSqlType === 'postgres' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PostgreSQL
              </button>
              <button
                onClick={() => setActiveSqlType('mysql')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  activeSqlType === 'mysql' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                MySQL
              </button>
            </div>

            <button
              onClick={() => copyToClipboard(activeSqlType === 'postgres' ? postgresSqlScript : mysqlSqlScript, 'sql')}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Se preferir criar as tabelas manualmente no seu gerenciador de banco (pgAdmin, DBeaver, MySQL Workbench, phpMyAdmin), execute o código abaixo:
        </p>

        <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto max-h-80 leading-relaxed">
          {activeSqlType === 'postgres' ? postgresSqlScript : mysqlSqlScript}
        </pre>
      </div>
    </div>
  );
};
