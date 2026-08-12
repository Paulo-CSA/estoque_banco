import pg from 'pg';
import mysql from 'mysql2/promise';

export interface DbConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  type?: 'postgres' | 'mysql';
}

export interface DbStatusInfo {
  connected: boolean;
  mode: 'postgres' | 'mysql' | 'local_fallback';
  host: string;
  port: number | string;
  database: string;
  user: string;
  message: string;
  error?: string;
  tableError?: string;
  tablesStatus?: {
    products: boolean;
    categories: boolean;
    suppliers: boolean;
    movements: boolean;
  };
}

// In-memory / local fallback storage (starts empty)
let localCategories: Array<{
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at?: string;
}> = [];

let localSuppliers: Array<{
  id: string;
  name: string;
  cnpj_cpf?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  created_at?: string;
}> = [];

let localProducts: Array<{
  id: string;
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  supplier_id?: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number;
  sale_price: number;
  unit_measure?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}> = [];

let localMovements: Array<{
  id: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantity: number;
  unit_price: number;
  total_price: number;
  reason: string;
  user_name: string;
  created_at: string;
}> = [];

let pgPool: pg.Pool | null = null;
let mysqlPool: mysql.Pool | null = null;
let currentMode: 'postgres' | 'mysql' | 'local_fallback' = 'local_fallback';
let dbConnectionError: string | undefined = undefined;

export function getDbConfigFromEnv(): DbConfig {
  let host = process.env.DB_HOST || process.env.DATABASE_HOST || '';
  let portStr = process.env.DB_PORT || process.env.DATABASE_PORT || '';
  let database = process.env.DB_NAME || process.env.DATABASE_NAME || '';
  let user = process.env.DB_USER || process.env.DATABASE_USER || '';
  let password = process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '';
  let typeStr = (process.env.DB_TYPE || '').toLowerCase();

  const dbUrl = process.env.DATABASE_URL || process.env.DB_URL || process.env.POSTGRES_URL || process.env.MYSQL_URL || '';

  if (dbUrl && (!host || !database)) {
    try {
      const parsed = new URL(dbUrl);
      if (parsed.protocol.includes('mysql')) {
        typeStr = 'mysql';
      } else {
        typeStr = 'postgres';
      }
      host = host || parsed.hostname;
      portStr = portStr || parsed.port;
      database = database || parsed.pathname.replace(/^\//, '');
      user = user || parsed.username;
      password = password || parsed.password;
    } catch (e) {
      console.warn('Erro ao ler DATABASE_URL do .env:', e);
    }
  }

  const type: 'postgres' | 'mysql' = typeStr.includes('mysql') ? 'mysql' : 'postgres';
  const defaultPort = type === 'mysql' ? 3306 : 5432;

  return {
    host: host.trim(),
    port: parseInt(portStr, 10) || defaultPort,
    database: database.trim(),
    user: user.trim(),
    password: password.trim(),
    type
  };
}

export async function initDatabaseConnection(): Promise<DbStatusInfo> {
  const config = getDbConfigFromEnv();

  // Reset existing connections
  if (pgPool) {
    try { await pgPool.end(); } catch (e) { /* ignore */ }
    pgPool = null;
  }
  if (mysqlPool) {
    try { await mysqlPool.end(); } catch (e) { /* ignore */ }
    mysqlPool = null;
  }

  dbConnectionError = undefined;

  if (!config.host || !config.database || !config.user) {
    currentMode = 'local_fallback';
    return {
      connected: false,
      mode: 'local_fallback',
      host: config.host || 'Não informado',
      port: config.port || 5432,
      database: config.database || 'Não informado',
      user: config.user || 'Não informado',
      message: 'Servidor de banco de dados não configurado no arquivo .env. Operando em modo de memória local.'
    };
  }

  if (config.type === 'postgres') {
    const isLocal = config.host === 'localhost' || config.host === '127.0.0.1' || config.host === '::1';
    
    // First attempt with SSL if remote or DB_SSL=true, or fallback to non-SSL
    const tryPgConnect = async (useSsl: boolean) => {
      const pool = new pg.Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        connectionTimeoutMillis: 7000,
        idleTimeoutMillis: 10000,
        ssl: useSsl ? { rejectUnauthorized: false } : false
      });

      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return pool;
    };

    try {
      let pool: pg.Pool;
      const shouldUseSsl = process.env.DB_SSL === 'true' || (!isLocal && process.env.DB_SSL !== 'false');
      
      try {
        pool = await tryPgConnect(shouldUseSsl);
      } catch (firstErr: any) {
        // Fallback retry with inverted SSL setting if SSL was rejected
        if (!shouldUseSsl) {
          pool = await tryPgConnect(true);
        } else {
          pool = await tryPgConnect(false);
        }
      }

      pgPool = pool;
      currentMode = 'postgres';

      // Auto create tables for PostgreSQL & get detailed table status
      let tableErrorMsg: string | undefined;
      let tablesStatus: any;

      try {
        tablesStatus = await autoCreatePgTables(pool);
      } catch (tErr: any) {
        tableErrorMsg = tErr.message || String(tErr);
        console.error('Erro na criação automática das tabelas PostgreSQL:', tableErrorMsg);
      }

      return {
        connected: true,
        mode: 'postgres',
        host: config.host,
        port: config.port || 5432,
        database: config.database,
        user: config.user,
        message: `Conectado com sucesso ao servidor PostgreSQL (${config.host}:${config.port}/${config.database})`,
        tableError: tableErrorMsg,
        tablesStatus
      };
    } catch (err: any) {
      dbConnectionError = err.message || String(err);
      currentMode = 'local_fallback';
      console.error('Erro de conexão ao PostgreSQL:', dbConnectionError);
      return {
        connected: false,
        mode: 'local_fallback',
        host: config.host,
        port: config.port || 5432,
        database: config.database,
        user: config.user,
        message: `Falha ao conectar ao PostgreSQL no host ${config.host}:${config.port}. Verifique o IP, porta, credenciais e liberação de firewall.`,
        error: dbConnectionError
      };
    }
  } else {
    // MySQL
    try {
      const pool = mysql.createPool({
        host: config.host,
        port: config.port || 3306,
        database: config.database,
        user: config.user,
        password: config.password,
        connectTimeout: 7000,
        waitForConnections: true,
        connectionLimit: 10
      });

      await pool.query('SELECT 1');
      mysqlPool = pool;
      currentMode = 'mysql';

      // Auto create tables for MySQL
      let tableErrorMsg: string | undefined;
      let tablesStatus: any;

      try {
        tablesStatus = await autoCreateMysqlTables(pool, config.database);
      } catch (tErr: any) {
        tableErrorMsg = tErr.message || String(tErr);
        console.error('Erro na criação automática das tabelas MySQL:', tableErrorMsg);
      }

      return {
        connected: true,
        mode: 'mysql',
        host: config.host,
        port: config.port || 3306,
        database: config.database,
        user: config.user,
        message: `Conectado com sucesso ao servidor MySQL (${config.host}:${config.port}/${config.database})`,
        tableError: tableErrorMsg,
        tablesStatus
      };
    } catch (err: any) {
      dbConnectionError = err.message || String(err);
      currentMode = 'local_fallback';
      console.error('Erro de conexão ao MySQL:', dbConnectionError);
      return {
        connected: false,
        mode: 'local_fallback',
        host: config.host,
        port: config.port || 3306,
        database: config.database,
        user: config.user,
        message: `Falha ao conectar ao MySQL no host ${config.host}:${config.port}. Verifique o IP, porta, credenciais e permissões.`,
        error: dbConnectionError
      };
    }
  }
}

async function autoCreatePgTables(pool: pg.Pool) {
  // Auto create tables for PostgreSQL
  await pool.query(`
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
    );
  `);

  const res = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('products', 'categories', 'suppliers', 'movements')
  `);
  const foundTables = res.rows.map(r => r.table_name);
  return {
    products: foundTables.includes('products'),
    categories: foundTables.includes('categories'),
    suppliers: foundTables.includes('suppliers'),
    movements: foundTables.includes('movements')
  };
}

async function autoCreateMysqlTables(pool: mysql.Pool, dbName: string) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color VARCHAR(32) DEFAULT '#4f46e5',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      cnpj_cpf VARCHAR(32),
      email VARCHAR(255),
      phone VARCHAR(64),
      contact_person VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`
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
  `);
  await pool.query(`
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
    );
  `);

  const [tRows]: any = await pool.query(`
    SELECT TABLE_NAME 
    FROM information_schema.tables 
    WHERE TABLE_SCHEMA = ? 
    AND TABLE_NAME IN ('products', 'categories', 'suppliers', 'movements')
  `, [dbName]);
  const foundTables = (tRows || []).map((r: any) => r.TABLE_NAME || r.table_name);
  return {
    products: foundTables.includes('products'),
    categories: foundTables.includes('categories'),
    suppliers: foundTables.includes('suppliers'),
    movements: foundTables.includes('movements')
  };
}

// Data Access Object Functions

export async function getCategories() {
  if (currentMode === 'postgres' && pgPool) {
    const res = await pgPool.query('SELECT * FROM categories ORDER BY name ASC');
    return res.rows;
  }
  if (currentMode === 'mysql' && mysqlPool) {
    const [rows]: any = await mysqlPool.query('SELECT * FROM categories ORDER BY name ASC');
    return rows;
  }
  return localCategories;
}

export async function createCategory(data: { name: string; description?: string; color?: string }) {
  const id = 'cat-' + Date.now();
  const color = data.color || '#3b82f6';
  const created_at = new Date().toISOString();

  if (currentMode === 'postgres' && pgPool) {
    const res = await pgPool.query(
      'INSERT INTO categories (id, name, description, color, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, data.name, data.description || '', color, created_at]
    );
    return res.rows[0];
  }
  if (currentMode === 'mysql' && mysqlPool) {
    await mysqlPool.query(
      'INSERT INTO categories (id, name, description, color) VALUES (?, ?, ?, ?)',
      [id, data.name, data.description || '', color]
    );
    return { id, name: data.name, description: data.description, color, created_at };
  }

  const newCat = { id, name: data.name, description: data.description || '', color, created_at };
  localCategories.push(newCat);
  return newCat;
}

export async function deleteCategory(id: string) {
  if (currentMode === 'postgres' && pgPool) {
    await pgPool.query('DELETE FROM categories WHERE id = $1', [id]);
    return true;
  }
  if (currentMode === 'mysql' && mysqlPool) {
    await mysqlPool.query('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }
  localCategories = localCategories.filter(c => c.id !== id);
  return true;
}

export async function getSuppliers() {
  if (currentMode === 'postgres' && pgPool) {
    const res = await pgPool.query('SELECT * FROM suppliers ORDER BY name ASC');
    return res.rows;
  }
  if (currentMode === 'mysql' && mysqlPool) {
    const [rows]: any = await mysqlPool.query('SELECT * FROM suppliers ORDER BY name ASC');
    return rows;
  }
  return localSuppliers;
}

export async function createSupplier(data: { name: string; cnpj_cpf?: string; email?: string; phone?: string; contact_person?: string }) {
  const id = 'sup-' + Date.now();
  const created_at = new Date().toISOString();

  if (currentMode === 'postgres' && pgPool) {
    const res = await pgPool.query(
      'INSERT INTO suppliers (id, name, cnpj_cpf, email, phone, contact_person, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, data.name, data.cnpj_cpf || '', data.email || '', data.phone || '', data.contact_person || '', created_at]
    );
    return res.rows[0];
  }
  if (currentMode === 'mysql' && mysqlPool) {
    await mysqlPool.query(
      'INSERT INTO suppliers (id, name, cnpj_cpf, email, phone, contact_person) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.name, data.cnpj_cpf || '', data.email || '', data.phone || '', data.contact_person || '']
    );
    return { id, ...data, created_at };
  }

  const newSup = { id, name: data.name, cnpj_cpf: data.cnpj_cpf || '', email: data.email || '', phone: data.phone || '', contact_person: data.contact_person || '', created_at };
  localSuppliers.push(newSup);
  return newSup;
}

export async function deleteSupplier(id: string) {
  if (currentMode === 'postgres' && pgPool) {
    await pgPool.query('DELETE FROM suppliers WHERE id = $1', [id]);
    return true;
  }
  if (currentMode === 'mysql' && mysqlPool) {
    await mysqlPool.query('DELETE FROM suppliers WHERE id = ?', [id]);
    return true;
  }
  localSuppliers = localSuppliers.filter(s => s.id !== id);
  return true;
}

export async function getProducts() {
  if (currentMode === 'postgres' && pgPool) {
    const res = await pgPool.query(`
      SELECT p.*,
             c.name as category_name, c.color as category_color,
             s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.name ASC
    `);
    return res.rows.map(r => ({
      ...r,
      quantity: Number(r.quantity),
      min_quantity: Number(r.min_quantity),
      unit_cost: Number(r.unit_cost),
      sale_price: Number(r.sale_price)
    }));
  }

  if (currentMode === 'mysql' && mysqlPool) {
    const [rows]: any = await mysqlPool.query(`
      SELECT p.*,
             c.name as category_name, c.color as category_color,
             s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.name ASC
    `);
    return rows.map((r: any) => ({
      ...r,
      quantity: Number(r.quantity),
      min_quantity: Number(r.min_quantity),
      unit_cost: Number(r.unit_cost),
      sale_price: Number(r.sale_price)
    }));
  }

  // Local fallback join
  return localProducts.map(p => {
    const cat = localCategories.find(c => c.id === p.category_id);
    const sup = localSuppliers.find(s => s.id === p.supplier_id);
    return {
      ...p,
      category_name: cat ? cat.name : undefined,
      category_color: cat ? cat.color : undefined,
      supplier_name: sup ? sup.name : undefined
    };
  });
}

export async function createProduct(data: any) {
  const id = 'prod-' + Date.now();
  const now = new Date().toISOString();

  const productData = {
    id,
    sku: data.sku || ('SKU-' + Math.floor(1000 + Math.random() * 9000)),
    name: data.name,
    description: data.description || '',
    category_id: data.category_id || null,
    supplier_id: data.supplier_id || null,
    quantity: Number(data.quantity || 0),
    min_quantity: Number(data.min_quantity || 5),
    unit_cost: Number(data.unit_cost || 0),
    sale_price: Number(data.sale_price || 0),
    unit_measure: data.unit_measure || 'UN',
    location: data.location || '',
    created_at: now,
    updated_at: now
  };

  if (currentMode === 'postgres' && pgPool) {
    const res = await pgPool.query(
      `INSERT INTO products (id, sku, name, description, category_id, supplier_id, quantity, min_quantity, unit_cost, sale_price, unit_measure, location, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        productData.id, productData.sku, productData.name, productData.description,
        productData.category_id, productData.supplier_id, productData.quantity, productData.min_quantity,
        productData.unit_cost, productData.sale_price, productData.unit_measure, productData.location,
        productData.created_at, productData.updated_at
      ]
    );

    // Initial movement log if quantity > 0
    if (productData.quantity > 0) {
      await recordMovement({
        product_id: id,
        product_name: productData.name,
        product_sku: productData.sku,
        type: 'ENTRADA',
        quantity: productData.quantity,
        unit_price: productData.unit_cost,
        total_price: productData.quantity * productData.unit_cost,
        reason: 'Cadastro inicial de produto no estoque',
        user_name: 'Sistema'
      });
    }

    return res.rows[0];
  }

  if (currentMode === 'mysql' && mysqlPool) {
    await mysqlPool.query(
      `INSERT INTO products (id, sku, name, description, category_id, supplier_id, quantity, min_quantity, unit_cost, sale_price, unit_measure, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productData.id, productData.sku, productData.name, productData.description,
        productData.category_id, productData.supplier_id, productData.quantity, productData.min_quantity,
        productData.unit_cost, productData.sale_price, productData.unit_measure, productData.location
      ]
    );

    if (productData.quantity > 0) {
      await recordMovement({
        product_id: id,
        product_name: productData.name,
        product_sku: productData.sku,
        type: 'ENTRADA',
        quantity: productData.quantity,
        unit_price: productData.unit_cost,
        total_price: productData.quantity * productData.unit_cost,
        reason: 'Cadastro inicial de produto no estoque',
        user_name: 'Sistema'
      });
    }

    return productData;
  }

  // Local fallback
  localProducts.push(productData);
  if (productData.quantity > 0) {
    await recordMovement({
      product_id: id,
      product_name: productData.name,
      product_sku: productData.sku,
      type: 'ENTRADA',
      quantity: productData.quantity,
      unit_price: productData.unit_cost,
      total_price: productData.quantity * productData.unit_cost,
      reason: 'Cadastro inicial de produto no estoque',
      user_name: 'Sistema'
    });
  }

  return productData;
}

export async function updateProduct(id: string, data: any) {
  const now = new Date().toISOString();

  if (currentMode === 'postgres' && pgPool) {
    const res = await pgPool.query(
      `UPDATE products
       SET sku = $1, name = $2, description = $3, category_id = $4, supplier_id = $5,
           min_quantity = $6, unit_cost = $7, sale_price = $8, unit_measure = $9,
           location = $10, updated_at = $11
       WHERE id = $12 RETURNING *`,
      [
        data.sku, data.name, data.description || '', data.category_id || null, data.supplier_id || null,
        Number(data.min_quantity || 5), Number(data.unit_cost || 0), Number(data.sale_price || 0),
        data.unit_measure || 'UN', data.location || '', now, id
      ]
    );
    return res.rows[0];
  }

  if (currentMode === 'mysql' && mysqlPool) {
    await mysqlPool.query(
      `UPDATE products
       SET sku = ?, name = ?, description = ?, category_id = ?, supplier_id = ?,
           min_quantity = ?, unit_cost = ?, sale_price = ?, unit_measure = ?,
           location = ?
       WHERE id = ?`,
      [
        data.sku, data.name, data.description || '', data.category_id || null, data.supplier_id || null,
        Number(data.min_quantity || 5), Number(data.unit_cost || 0), Number(data.sale_price || 0),
        data.unit_measure || 'UN', data.location || '', id
      ]
    );
    return { id, ...data, updated_at: now };
  }

  // Local fallback
  const idx = localProducts.findIndex(p => p.id === id);
  if (idx !== -1) {
    localProducts[idx] = {
      ...localProducts[idx],
      sku: data.sku,
      name: data.name,
      description: data.description || '',
      category_id: data.category_id || null,
      supplier_id: data.supplier_id || null,
      min_quantity: Number(data.min_quantity || 5),
      unit_cost: Number(data.unit_cost || 0),
      sale_price: Number(data.sale_price || 0),
      unit_measure: data.unit_measure || 'UN',
      location: data.location || '',
      updated_at: now
    };
    return localProducts[idx];
  }
  return null;
}

export async function deleteProduct(id: string) {
  if (currentMode === 'postgres' && pgPool) {
    await pgPool.query('DELETE FROM products WHERE id = $1', [id]);
    return true;
  }
  if (currentMode === 'mysql' && mysqlPool) {
    await mysqlPool.query('DELETE FROM products WHERE id = ?', [id]);
    return true;
  }
  localProducts = localProducts.filter(p => p.id !== id);
  return true;
}

export async function recordMovement(data: {
  product_id: string;
  product_name: string;
  product_sku?: string;
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantity: number;
  unit_price: number;
  total_price: number;
  reason: string;
  user_name?: string;
}) {
  const movId = 'mov-' + Date.now();
  const created_at = new Date().toISOString();
  const user_name = data.user_name || 'Operador';

  // 1. Record movement
  if (currentMode === 'postgres' && pgPool) {
    await pgPool.query(
      `INSERT INTO movements (id, product_id, product_name, product_sku, type, quantity, unit_price, total_price, reason, user_name, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        movId, data.product_id, data.product_name, data.product_sku || '',
        data.type, data.quantity, data.unit_price, data.total_price,
        data.reason, user_name, created_at
      ]
    );

    // Update product quantity
    if (data.type === 'ENTRADA') {
      await pgPool.query('UPDATE products SET quantity = quantity + $1, updated_at = $2 WHERE id = $3', [data.quantity, created_at, data.product_id]);
    } else if (data.type === 'SAIDA') {
      await pgPool.query('UPDATE products SET quantity = GREATEST(0, quantity - $1), updated_at = $2 WHERE id = $3', [data.quantity, created_at, data.product_id]);
    } else if (data.type === 'AJUSTE') {
      await pgPool.query('UPDATE products SET quantity = $1, updated_at = $2 WHERE id = $3', [data.quantity, created_at, data.product_id]);
    }
  } else if (currentMode === 'mysql' && mysqlPool) {
    await mysqlPool.query(
      `INSERT INTO movements (id, product_id, product_name, product_sku, type, quantity, unit_price, total_price, reason, user_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movId, data.product_id, data.product_name, data.product_sku || '',
        data.type, data.quantity, data.unit_price, data.total_price,
        data.reason, user_name
      ]
    );

    if (data.type === 'ENTRADA') {
      await mysqlPool.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [data.quantity, data.product_id]);
    } else if (data.type === 'SAIDA') {
      await mysqlPool.query('UPDATE products SET quantity = GREATEST(0, quantity - ?) WHERE id = ?', [data.quantity, data.product_id]);
    } else if (data.type === 'AJUSTE') {
      await mysqlPool.query('UPDATE products SET quantity = ? WHERE id = ?', [data.quantity, data.product_id]);
    }
  } else {
    // Local fallback
    localMovements.unshift({
      id: movId,
      product_id: data.product_id,
      product_name: data.product_name,
      product_sku: data.product_sku || '',
      type: data.type,
      quantity: data.quantity,
      unit_price: data.unit_price,
      total_price: data.total_price,
      reason: data.reason,
      user_name,
      created_at
    });

    const targetProduct = localProducts.find(p => p.id === data.product_id);
    if (targetProduct) {
      if (data.type === 'ENTRADA') {
        targetProduct.quantity += data.quantity;
      } else if (data.type === 'SAIDA') {
        targetProduct.quantity = Math.max(0, targetProduct.quantity - data.quantity);
      } else if (data.type === 'AJUSTE') {
        targetProduct.quantity = data.quantity;
      }
      targetProduct.updated_at = created_at;
    }
  }

  return { id: movId, ...data, user_name, created_at };
}

export async function getMovements() {
  if (currentMode === 'postgres' && pgPool) {
    const res = await pgPool.query('SELECT * FROM movements ORDER BY created_at DESC LIMIT 200');
    return res.rows.map(r => ({
      ...r,
      quantity: Number(r.quantity),
      unit_price: Number(r.unit_price),
      total_price: Number(r.total_price)
    }));
  }

  if (currentMode === 'mysql' && mysqlPool) {
    const [rows]: any = await mysqlPool.query('SELECT * FROM movements ORDER BY created_at DESC LIMIT 200');
    return rows.map((r: any) => ({
      ...r,
      quantity: Number(r.quantity),
      unit_price: Number(r.unit_price),
      total_price: Number(r.total_price)
    }));
  }

  return localMovements;
}

export async function getKpis() {
  const products = await getProducts();
  const movements = await getMovements();

  const totalItemsCount = products.length;
  let totalQuantity = 0;
  let totalStockCostValue = 0;
  let totalStockSaleValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of products) {
    totalQuantity += p.quantity;
    totalStockCostValue += (p.quantity * p.unit_cost);
    totalStockSaleValue += (p.quantity * p.sale_price);

    if (p.quantity === 0) {
      outOfStockCount++;
    } else if (p.quantity <= p.min_quantity) {
      lowStockCount++;
    }
  }

  return {
    totalItemsCount,
    totalQuantity,
    totalStockCostValue,
    totalStockSaleValue,
    lowStockCount,
    outOfStockCount,
    recentMovementsCount: movements.length
  };
}
