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
}

// In-memory / local fallback storage
let localCategories = [
  { id: 'cat-1', name: 'Eletrônicos', description: 'Componentes e dispositivos eletrônicos', color: '#3b82f6', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Escritório', description: 'Materiais e suprimentos para escritório', color: '#10b981', created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Informática', description: 'Periféricos e computadores', color: '#8b5cf6', created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Embalagens', description: 'Caixas, fitas e proteção', color: '#f59e0b', created_at: new Date().toISOString() },
];

let localSuppliers = [
  { id: 'sup-1', name: 'TechDistribuidora Ltda', cnpj_cpf: '12.345.678/0001-90', email: 'vendas@techdist.com.br', phone: '(11) 3344-5566', contact_person: 'Carlos Silva', created_at: new Date().toISOString() },
  { id: 'sup-2', name: 'Suprimentos Brasil S.A.', cnpj_cpf: '98.765.432/0001-10', email: 'contato@suprimentosbr.com', phone: '(11) 2233-4455', contact_person: 'Ana Paula', created_at: new Date().toISOString() },
];

let localProducts = [
  {
    id: 'prod-1',
    sku: 'ELE-001',
    name: 'Teclado Mecânico RGB',
    description: 'Teclado mecânico com switches azuis e retroiluminação RGB',
    category_id: 'cat-3',
    supplier_id: 'sup-1',
    quantity: 25,
    min_quantity: 10,
    unit_cost: 120.00,
    sale_price: 249.90,
    unit_measure: 'UN',
    location: 'Prateleira A-12',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-2',
    sku: 'ELE-002',
    name: 'Mouse Óptico Sem Fio 1600 DPI',
    description: 'Mouse ergonômico wireless com receptor USB',
    category_id: 'cat-3',
    supplier_id: 'sup-1',
    quantity: 8,
    min_quantity: 15, // Low stock!
    unit_cost: 35.00,
    sale_price: 79.90,
    unit_measure: 'UN',
    location: 'Prateleira A-14',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-3',
    sku: 'ESC-001',
    name: 'Papel Sulfite A4 75g (Pacote 500fls)',
    description: 'Papel de alta alvura para impressões do dia a dia',
    category_id: 'cat-2',
    supplier_id: 'sup-2',
    quantity: 0, // Out of stock!
    min_quantity: 20,
    unit_cost: 22.50,
    sale_price: 32.90,
    unit_measure: 'CX',
    location: 'Depósito 2 - Setor B',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-4',
    sku: 'ESC-002',
    name: 'Cadeira Ergonômica de Escritório',
    description: 'Cadeira presidente com ajuste lombar e braços reguláveis',
    category_id: 'cat-2',
    supplier_id: 'sup-2',
    quantity: 14,
    min_quantity: 5,
    unit_cost: 450.00,
    sale_price: 890.00,
    unit_measure: 'UN',
    location: 'Showroom 1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod-5',
    sku: 'EMB-001',
    name: 'Caixa de Papelão 30x20x15cm (Fardo c/ 25)',
    description: 'Caixas reforçadas para e-commerce e envios',
    category_id: 'cat-4',
    supplier_id: 'sup-2',
    quantity: 45,
    min_quantity: 10,
    unit_cost: 42.00,
    sale_price: 75.00,
    unit_measure: 'PACOTE',
    location: 'Depósito 1 - Prateleira F',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let localMovements = [
  {
    id: 'mov-1',
    product_id: 'prod-1',
    product_name: 'Teclado Mecânico RGB',
    product_sku: 'ELE-001',
    type: 'ENTRADA' as const,
    quantity: 30,
    unit_price: 120.00,
    total_price: 3600.00,
    reason: 'Compra inicial de estoque - NF 4421',
    user_name: 'Administrador',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'mov-2',
    product_id: 'prod-1',
    product_name: 'Teclado Mecânico RGB',
    product_sku: 'ELE-001',
    type: 'SAIDA' as const,
    quantity: 5,
    unit_price: 249.90,
    total_price: 1249.50,
    reason: 'Venda Pedido #1029',
    user_name: 'Atendente Vendas',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'mov-3',
    product_id: 'prod-2',
    product_name: 'Mouse Óptico Sem Fio 1600 DPI',
    product_sku: 'ELE-002',
    type: 'SAIDA' as const,
    quantity: 12,
    unit_price: 79.90,
    total_price: 958.80,
    reason: 'Venda Pedido #1033',
    user_name: 'Atendente Vendas',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

let pgPool: pg.Pool | null = null;
let mysqlPool: mysql.Pool | null = null;
let currentMode: 'postgres' | 'mysql' | 'local_fallback' = 'local_fallback';
let dbConnectionError: string | undefined = undefined;

export function getDbConfigFromEnv(): DbConfig {
  const host = process.env.DB_HOST || process.env.DATABASE_HOST || '';
  const portStr = process.env.DB_PORT || process.env.DATABASE_PORT || '5432';
  const database = process.env.DB_NAME || process.env.DATABASE_NAME || '';
  const user = process.env.DB_USER || process.env.DATABASE_USER || '';
  const password = process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '';
  const typeStr = (process.env.DB_TYPE || 'postgres').toLowerCase();
  const type: 'postgres' | 'mysql' = typeStr.includes('mysql') ? 'mysql' : 'postgres';

  return {
    host: host.trim(),
    port: parseInt(portStr, 10) || (type === 'mysql' ? 3306 : 5432),
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
    try {
      const pool = new pg.Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      });

      // Test connection
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      pgPool = pool;
      currentMode = 'postgres';

      // Auto create tables for PostgreSQL
      await autoCreatePgTables(pool);

      return {
        connected: true,
        mode: 'postgres',
        host: config.host,
        port: config.port || 5432,
        database: config.database,
        user: config.user,
        message: `Conectado com sucesso ao servidor PostgreSQL (${config.host}:${config.port}/${config.database})`
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
        message: `Falha ao conectar ao PostgreSQL no IP ${config.host}:${config.port}. Operando em modo local.`,
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
        connectTimeout: 5000,
        waitForConnections: true,
        connectionLimit: 10
      });

      const [rows] = await pool.query('SELECT 1');
      mysqlPool = pool;
      currentMode = 'mysql';

      // Auto create tables for MySQL
      await autoCreateMysqlTables(pool);

      return {
        connected: true,
        mode: 'mysql',
        host: config.host,
        port: config.port || 3306,
        database: config.database,
        user: config.user,
        message: `Conectado com sucesso ao servidor MySQL (${config.host}:${config.port}/${config.database})`
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
        message: `Falha ao conectar ao MySQL no IP ${config.host}:${config.port}. Operando em modo local.`,
        error: dbConnectionError
      };
    }
  }
}

async function autoCreatePgTables(pool: pg.Pool) {
  try {
    await pool.query(`
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
      );
    `);

    // Check if empty, seed if so
    const countRes = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log('Semeando dados iniciais no PostgreSQL...');
      for (const cat of localCategories) {
        await pool.query(
          'INSERT INTO categories (id, name, description, color, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
          [cat.id, cat.name, cat.description, cat.color, cat.created_at]
        );
      }
      for (const sup of localSuppliers) {
        await pool.query(
          'INSERT INTO suppliers (id, name, cnpj_cpf, email, phone, contact_person, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
          [sup.id, sup.name, sup.cnpj_cpf, sup.email, sup.phone, sup.contact_person, sup.created_at]
        );
      }
      for (const prod of localProducts) {
        await pool.query(
          `INSERT INTO products (id, sku, name, description, category_id, supplier_id, quantity, min_quantity, unit_cost, sale_price, unit_measure, location, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT DO NOTHING`,
          [
            prod.id, prod.sku, prod.name, prod.description, prod.category_id, prod.supplier_id,
            prod.quantity, prod.min_quantity, prod.unit_cost, prod.sale_price, prod.unit_measure,
            prod.location, prod.created_at, prod.updated_at
          ]
        );
      }
      for (const mov of localMovements) {
        await pool.query(
          `INSERT INTO movements (id, product_id, product_name, product_sku, type, quantity, unit_price, total_price, reason, user_name, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING`,
          [
            mov.id, mov.product_id, mov.product_name, mov.product_sku, mov.type,
            mov.quantity, mov.unit_price, mov.total_price, mov.reason, mov.user_name, mov.created_at
          ]
        );
      }
    }
  } catch (err) {
    console.error('Erro ao criar tabelas no PostgreSQL:', err);
  }
}

async function autoCreateMysqlTables(pool: mysql.Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(32) DEFAULT '#3b82f6',
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

    const [rows]: any = await pool.query('SELECT COUNT(*) as cnt FROM products');
    if (rows && rows[0] && rows[0].cnt === 0) {
      console.log('Semeando dados iniciais no MySQL...');
      for (const cat of localCategories) {
        await pool.query('INSERT IGNORE INTO categories (id, name, description, color) VALUES (?, ?, ?, ?)', [cat.id, cat.name, cat.description, cat.color]);
      }
      for (const sup of localSuppliers) {
        await pool.query('INSERT IGNORE INTO suppliers (id, name, cnpj_cpf, email, phone, contact_person) VALUES (?, ?, ?, ?, ?, ?)', [sup.id, sup.name, sup.cnpj_cpf, sup.email, sup.phone, sup.contact_person]);
      }
      for (const prod of localProducts) {
        await pool.query(
          `INSERT IGNORE INTO products (id, sku, name, description, category_id, supplier_id, quantity, min_quantity, unit_cost, sale_price, unit_measure, location)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [prod.id, prod.sku, prod.name, prod.description, prod.category_id, prod.supplier_id, prod.quantity, prod.min_quantity, prod.unit_cost, prod.sale_price, prod.unit_measure, prod.location]
        );
      }
      for (const mov of localMovements) {
        await pool.query(
          `INSERT IGNORE INTO movements (id, product_id, product_name, product_sku, type, quantity, unit_price, total_price, reason, user_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [mov.id, mov.product_id, mov.product_name, mov.product_sku, mov.type, mov.quantity, mov.unit_price, mov.total_price, mov.reason, mov.user_name]
        );
      }
    }
  } catch (err) {
    console.error('Erro ao criar tabelas no MySQL:', err);
  }
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
