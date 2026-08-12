import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  initDatabaseConnection,
  getDbConfigFromEnv,
  getCategories,
  createCategory,
  deleteCategory,
  getSuppliers,
  createSupplier,
  deleteSupplier,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  recordMovement,
  getMovements,
  getKpis
} from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 7000;

  app.use(express.json());

  // Initialize DB Connection
  let dbStatus = await initDatabaseConnection();

  // API Routes

  // 1. Database Diagnostic & Connection Test API
  app.get('/api/db/status', async (req, res) => {
    // Re-verify current config from environment
    const config = getDbConfigFromEnv();
    res.json({
      ...dbStatus,
      envConfig: {
        host: config.host || '',
        port: config.port || 5432,
        database: config.database || '',
        user: config.user || '',
        type: config.type || 'postgres',
        hasPassword: Boolean(config.password)
      }
    });
  });

  app.post('/api/db/reconnect', async (req, res) => {
    try {
      // Reload .env file dynamically if changed
      dotenv.config({ override: true });
      dbStatus = await initDatabaseConnection();
      res.json({ success: true, dbStatus });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. KPIs API
  app.get('/api/kpis', async (req, res) => {
    try {
      const kpis = await getKpis();
      res.json(kpis);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Products API
  app.get('/api/products', async (req, res) => {
    try {
      const products = await getProducts();
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      if (!req.body.name) {
        return res.status(400).json({ error: 'Nome do produto é obrigatório' });
      }
      const product = await createProduct(req.body);
      res.status(201).json(product);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const product = await updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      await deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Quick quantity adjust API
  app.post('/api/products/:id/adjust', async (req, res) => {
    try {
      const { type, quantity, reason, unit_price, user_name } = req.body;
      const products = await getProducts();
      const product = products.find(p => p.id === req.params.id);

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      const qty = Number(quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: 'Quantidade inválida' });
      }

      const unitPrice = Number(unit_price) || (type === 'ENTRADA' ? product.unit_cost : product.sale_price);

      const movement = await recordMovement({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        type: type as 'ENTRADA' | 'SAIDA' | 'AJUSTE',
        quantity: qty,
        unit_price: unitPrice,
        total_price: qty * unitPrice,
        reason: reason || 'Ajuste rápido de estoque',
        user_name: user_name || 'Operador'
      });

      res.json({ success: true, movement });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Categories API
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await getCategories();
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      if (!req.body.name) {
        return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
      }
      const category = await createCategory(req.body);
      res.status(201).json(category);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      await deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Suppliers API
  app.get('/api/suppliers', async (req, res) => {
    try {
      const suppliers = await getSuppliers();
      res.json(suppliers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/suppliers', async (req, res) => {
    try {
      if (!req.body.name) {
        return res.status(400).json({ error: 'Nome do fornecedor é obrigatório' });
      }
      const supplier = await createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/suppliers/:id', async (req, res) => {
    try {
      await deleteSupplier(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Movements API
  app.get('/api/movements', async (req, res) => {
    try {
      const movements = await getMovements();
      res.json(movements);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/movements', async (req, res) => {
    try {
      const { product_id, type, quantity, unit_price, reason, user_name } = req.body;
      const products = await getProducts();
      const product = products.find(p => p.id === product_id);

      if (!product) {
        return res.status(400).json({ error: 'Produto não encontrado' });
      }

      const qty = Number(quantity);
      if (!qty || qty <= 0) {
        return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
      }

      const price = Number(unit_price) || (type === 'ENTRADA' ? product.unit_cost : product.sale_price);

      const movement = await recordMovement({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        type: type as 'ENTRADA' | 'SAIDA' | 'AJUSTE',
        quantity: qty,
        unit_price: price,
        total_price: qty * price,
        reason: reason || (type === 'ENTRADA' ? 'Entrada manual' : 'Saída manual'),
        user_name: user_name || 'Operador'
      });

      res.status(201).json(movement);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware / Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Servidor] Controle de Estoque rodando na porta ${PORT}`);
  });
}

startServer();
