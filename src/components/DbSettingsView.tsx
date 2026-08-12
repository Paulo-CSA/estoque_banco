import React, { useState } from 'react';
import { Database, Server, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check, Terminal, Shield, Code, Play } from 'lucide-react';
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
# Informe o IP público ou nome de domínio do seu servidor de banco de dados
DB_HOST=${dbStatus?.host || '192.168.1.100'}

# Porta do banco de dados (Ex: 5432 para PostgreSQL, 3306 para MySQL)
DB_PORT=${dbStatus?.port || '5432'}

# Nome do banco de dados criado no servidor
DB_NAME=${dbStatus?.database || 'estoque_db'}

# Usuário de acesso ao banco
DB_USER=${dbStatus?.user || 'postgres'}

# Senha do usuário do banco
DB_PASSWORD=sua_senha_aqui

# Tipo de banco de dados: postgres (padrão) ou mysql
DB_TYPE=${dbStatus?.mode === 'mysql' ? 'mysql' : 'postgres'}`;

  const postgresSqlScript = `-- Script de Criação das Tabelas de Estoque (PostgreSQL)
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(32) DEFAULT '#3b82f6',
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
  color VARCHAR(32) DEFAULT '#3b82f6',
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            Configuração de Banco de Dados Externo (.env)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Defina as credenciais do seu servidor PostgreSQL ou MySQL no arquivo <code className="text-blue-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">.env</code>
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Testando Conexão...' : 'Testar Conexão Novamente'}</span>
        </button>
      </div>

      {/* Live Status Diagnostics Box */}
      <div className={`p-6 rounded-2xl border text-sm shadow-sm transition-all ${
        dbStatus?.connected
          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
      }`}>
        <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${dbStatus?.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Status da Conexão:
                {dbStatus?.connected ? (
                  <span className="text-xs bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                    Conectado ao Banco Externo
                  </span>
                ) : (
                  <span className="text-xs bg-amber-900/80 text-amber-300 border border-amber-700 px-2.5 py-0.5 rounded-full font-bold">
                    Modo de Memória Local
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">{dbStatus?.message}</p>
            </div>
          </div>
        </div>

        {/* Diagnostic Fields Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block uppercase text-[10px] font-bold">IP do Servidor (DB_HOST)</span>
            <span className="font-mono font-bold text-white text-sm mt-0.5 block">{dbStatus?.host || 'Não informado'}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block uppercase text-[10px] font-bold">Porta (DB_PORT)</span>
            <span className="font-mono font-bold text-white text-sm mt-0.5 block">{dbStatus?.port || '5432'}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block uppercase text-[10px] font-bold">Nome do Banco (DB_NAME)</span>
            <span className="font-mono font-bold text-white text-sm mt-0.5 block">{dbStatus?.database || 'Não informado'}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block uppercase text-[10px] font-bold">Usuário (DB_USER)</span>
            <span className="font-mono font-bold text-white text-sm mt-0.5 block">{dbStatus?.user || 'Não informado'}</span>
          </div>
        </div>

        {dbStatus?.error && (
          <div className="mt-4 p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-mono">
            <strong>Detalhe do Erro:</strong> {dbStatus.error}
          </div>
        )}
      </div>

      {/* Step-by-Step Instructions & .env Template */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Como configurar o arquivo .env</h3>
          </div>

          <button
            onClick={() => copyToClipboard(sampleEnvText, 'env')}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            {copiedEnv ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar .env</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Abra o arquivo <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-blue-300 border border-slate-800">.env</code> na raiz do projeto e substitua pelos valores do seu servidor de banco de dados:
        </p>

        {/* Code Block for .env */}
        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-blue-300 font-mono overflow-x-auto leading-relaxed">
          {sampleEnvText}
        </pre>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <strong className="text-white block font-semibold">1. Servidores Suportados</strong>
            <p className="text-slate-400">
              Funciona com qualquer servidor de banco de dados PostgreSQL ou MySQL rodando em IP local ou na nuvem (AWS RDS, DigitalOcean, Supabase, Neon, Docker ou VPS própria).
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <strong className="text-white block font-semibold">2. Criação Automática de Tabelas</strong>
            <p className="text-slate-400">
              A aplicação executa comandos <code className="text-slate-300">CREATE TABLE IF NOT EXISTS</code> automaticamente ao conectar, criando as tabelas de produtos, categorias, fornecedores e movimentações.
            </p>
          </div>
        </div>
      </div>

      {/* Manual SQL Script Generator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Script SQL de Criação das Tabelas</h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveSqlType('postgres')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  activeSqlType === 'postgres' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                PostgreSQL
              </button>
              <button
                onClick={() => setActiveSqlType('mysql')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  activeSqlType === 'mysql' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                MySQL
              </button>
            </div>

            <button
              onClick={() => copyToClipboard(activeSqlType === 'postgres' ? postgresSqlScript : mysqlSqlScript, 'sql')}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300">
          Se preferir criar as tabelas manualmente no seu cliente de banco de dados (pgAdmin, DBeaver, MySQL Workbench), execute o script abaixo:
        </p>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-emerald-300 font-mono overflow-x-auto max-h-80 leading-relaxed">
          {activeSqlType === 'postgres' ? postgresSqlScript : mysqlSqlScript}
        </pre>
      </div>
    </div>
  );
};
