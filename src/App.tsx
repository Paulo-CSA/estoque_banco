import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DbStatusBanner } from './components/DbStatusBanner';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { MovementsView } from './components/MovementsView';
import { CategoriesAndSuppliersView } from './components/CategoriesAndSuppliersView';
import { DbSettingsView } from './components/DbSettingsView';
import { ProductFormModal } from './components/ProductFormModal';
import { StockAdjustModal } from './components/StockAdjustModal';
import { Product, Category, Supplier, Movement, StockKpis, DbConfigStatus, MovementType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dbStatus, setDbStatus] = useState<DbConfigStatus | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [kpis, setKpis] = useState<StockKpis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter state for navigation from dashboard
  const [productsInitialFilter, setProductsInitialFilter] = useState<string>('all');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [movementPreselectedType, setMovementPreselectedType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');

  // Load all data from Backend API
  const loadData = useCallback(async () => {
    try {
      const [dbRes, prodRes, catRes, supRes, movRes, kpiRes] = await Promise.all([
        fetch('/api/db/status').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/movements').then(r => r.json()),
        fetch('/api/kpis').then(r => r.json())
      ]);

      setDbStatus(dbRes);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
      setCategories(Array.isArray(catRes) ? catRes : []);
      setSuppliers(Array.isArray(supRes) ? supRes : []);
      setMovements(Array.isArray(movRes) ? movRes : []);
      setKpis(kpiRes);
    } catch (err) {
      console.error('Erro ao carregar dados do servidor:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefreshDb = async () => {
    try {
      const res = await fetch('/api/db/reconnect', { method: 'POST' });
      const data = await res.json();
      if (data.dbStatus) {
        setDbStatus(data.dbStatus);
      }
      await loadData();
    } catch (err) {
      console.error('Erro ao reconectar banco:', err);
    }
  };

  // Product CRUD
  const handleSaveProduct = async (productData: any) => {
    if (productToEdit) {
      // Edit
      const res = await fetch(`/api/products/${productToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error('Falha ao atualizar produto');
    } else {
      // Create
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error('Falha ao criar produto');
    }
    await loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadData();
    } else {
      alert('Erro ao excluir produto');
    }
  };

  // Quick Stock Adjust
  const handleConfirmStockAdjust = async (adjustData: {
    type: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
    quantity: number;
    reason: string;
  }) => {
    if (!adjustProduct) return;
    const res = await fetch(`/api/products/${adjustProduct.id}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adjustData)
    });
    if (!res.ok) throw new Error('Falha ao realizar ajuste de estoque');
    await loadData();
  };

  // Record Movement
  const handleRecordMovement = async (data: {
    product_id: string;
    type: MovementType;
    quantity: number;
    unit_price: number;
    reason: string;
    user_name: string;
  }) => {
    const res = await fetch('/api/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'Falha ao registrar movimentação');
    }
    await loadData();
  };

  // Category CRUD
  const handleAddCategory = async (catData: { name: string; description?: string; color?: string }) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catData)
    });
    if (!res.ok) throw new Error('Falha ao criar categoria');
    await loadData();
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadData();
    }
  };

  // Supplier CRUD
  const handleAddSupplier = async (supData: { name: string; cnpj_cpf?: string; email?: string; phone?: string; contact_person?: string }) => {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supData)
    });
    if (!res.ok) throw new Error('Falha ao criar fornecedor');
    await loadData();
  };

  const handleDeleteSupplier = async (id: string) => {
    const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadData();
    }
  };

  // Navigation Helper
  const navigateToProductsWithFilter = (filter: string = 'all') => {
    setProductsInitialFilter(filter);
    setActiveTab('products');
  };

  const openMovementModalWithType = (type: 'ENTRADA' | 'SAIDA') => {
    setMovementPreselectedType(type);
    setActiveTab('movements');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
        onRefreshDb={handleRefreshDb}
      />

      {/* Database Status Banner */}
      <DbStatusBanner
        dbStatus={dbStatus}
        onOpenDbSettings={() => setActiveTab('db-settings')}
      />

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-slate-400">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Carregando dados do sistema...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                kpis={kpis}
                products={products}
                movements={movements}
                categories={categories}
                onOpenAddProduct={() => {
                  setProductToEdit(null);
                  setIsProductModalOpen(true);
                }}
                onOpenMovementModal={openMovementModalWithType}
                onNavigateToProducts={navigateToProductsWithFilter}
              />
            )}

            {activeTab === 'products' && (
              <ProductsView
                products={products}
                categories={categories}
                suppliers={suppliers}
                onOpenAddProduct={() => {
                  setProductToEdit(null);
                  setIsProductModalOpen(true);
                }}
                onEditProduct={(p) => {
                  setProductToEdit(p);
                  setIsProductModalOpen(true);
                }}
                onDeleteProduct={handleDeleteProduct}
                onQuickAdjustStock={(p) => setAdjustProduct(p)}
                initialFilter={productsInitialFilter}
              />
            )}

            {activeTab === 'movements' && (
              <MovementsView
                products={products}
                movements={movements}
                onRecordMovement={handleRecordMovement}
                preselectedType={movementPreselectedType}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesAndSuppliersView
                categories={categories}
                suppliers={suppliers}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddSupplier={handleAddSupplier}
                onDeleteSupplier={handleDeleteSupplier}
              />
            )}

            {activeTab === 'db-settings' && (
              <DbSettingsView
                dbStatus={dbStatus}
                onRefreshDb={handleRefreshDb}
              />
            )}
          </>
        )}
      </main>

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleSaveProduct}
        productToEdit={productToEdit}
        categories={categories}
        suppliers={suppliers}
      />

      {/* Quick Stock Adjust Modal */}
      <StockAdjustModal
        isOpen={Boolean(adjustProduct)}
        onClose={() => setAdjustProduct(null)}
        product={adjustProduct}
        onConfirmAdjust={handleConfirmStockAdjust}
      />
    </div>
  );
}
