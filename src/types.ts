export type StockStatus = 'NORMAL' | 'LOW' | 'OUT_OF_STOCK';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj_cpf?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  category_color?: string;
  supplier_id?: string;
  supplier_name?: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number;
  sale_price: number;
  unit_measure: string; // UN, KG, L, CX, M, PACOTE
  location?: string; // e.g. Prateleira A2, Corredor 3
  created_at: string;
  updated_at: string;
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE';

export interface Movement {
  id: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  type: MovementType;
  quantity: number;
  unit_price: number;
  total_price: number;
  reason: string;
  user_name: string;
  created_at: string;
}

export interface StockKpis {
  totalItemsCount: number; // total unique SKUs
  totalQuantity: number; // total units in stock
  totalStockCostValue: number; // total cost R$
  totalStockSaleValue: number; // total potential sale R$
  lowStockCount: number;
  outOfStockCount: number;
  recentMovementsCount: number;
}

export interface DbConfigStatus {
  connected: boolean;
  mode: 'postgres' | 'mysql' | 'local_fallback';
  host?: string;
  port?: number | string;
  database?: string;
  user?: string;
  message: string;
  error?: string;
  tablesStatus?: {
    products: boolean;
    categories: boolean;
    suppliers: boolean;
    movements: boolean;
  };
}
