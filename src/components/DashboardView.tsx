import React from 'react';
import { Package, DollarSign, AlertTriangle, XCircle, ArrowUpRight, ArrowDownLeft, Plus, ArrowUpDown, TrendingUp, Layers, ShoppingBag } from 'lucide-react';
import { Product, Movement, StockKpis, Category } from '../types';

interface DashboardViewProps {
  kpis: StockKpis | null;
  products: Product[];
  movements: Movement[];
  categories: Category[];
  onOpenAddProduct: () => void;
  onOpenMovementModal: (type: 'ENTRADA' | 'SAIDA') => void;
  onNavigateToProducts: (filter?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kpis,
  products,
  movements,
  categories,
  onOpenAddProduct,
  onOpenMovementModal,
  onNavigateToProducts
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group products by category
  const categoryStats = categories.map(cat => {
    const catProducts = products.filter(p => p.category_id === cat.id);
    const totalQty = catProducts.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = catProducts.reduce((sum, p) => sum + (p.quantity * p.unit_cost), 0);
    return {
      ...cat,
      count: catProducts.length,
      totalQty,
      totalValue
    };
  });

  // Low stock products
  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= p.min_quantity);
  const outOfStockProducts = products.filter(p => p.quantity === 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Action Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Painel de Gestão de Estoque</h2>
          <p className="text-slate-500 text-sm mt-1">
            Visão geral em tempo real de inventário, valorização e fluxo de entradas e saídas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onOpenMovementModal('ENTRADA')}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs text-xs"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Registrar Entrada</span>
          </button>

          <button
            onClick={() => onOpenMovementModal('SAIDA')}
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs text-xs"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Registrar Saída</span>
          </button>

          <button
            onClick={onOpenAddProduct}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items KPI */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs hover:border-slate-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total em Estoque</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-light tracking-tight text-slate-900">{kpis?.totalQuantity || 0} <span className="text-sm font-normal text-slate-400">un</span></div>
            <p className="text-xs text-slate-400 mt-1">
              Em <strong className="text-slate-700">{kpis?.totalItemsCount || 0}</strong> produtos cadastrados
            </p>
          </div>
        </div>

        {/* Total Stock Cost Value */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs hover:border-slate-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Valor de Custo</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-light tracking-tight text-slate-900">
              {formatCurrency(kpis?.totalStockCostValue || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Venda estimada: <strong className="text-slate-700">{formatCurrency(kpis?.totalStockSaleValue || 0)}</strong>
            </p>
          </div>
        </div>

        {/* Low Stock KPI */}
        <div
          onClick={() => onNavigateToProducts('low')}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs hover:border-amber-200 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Estoque Baixo</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-light tracking-tight text-amber-500">{kpis?.lowStockCount || 0} <span className="text-sm text-slate-400">itens</span></div>
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Abaixo do mínimo</span>
              <span className="text-indigo-600 font-medium text-[11px] group-hover:underline">Ver itens &rarr;</span>
            </p>
          </div>
        </div>

        {/* Out of Stock KPI */}
        <div
          onClick={() => onNavigateToProducts('out')}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs hover:border-rose-200 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sem Estoque</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-light tracking-tight text-rose-500">{kpis?.outOfStockCount || 0} <span className="text-sm text-slate-400">itens</span></div>
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Produtos zerados</span>
              <span className="text-indigo-600 font-medium text-[11px] group-hover:underline">Ver itens &rarr;</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Split: Category Breakdown & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Category Distribution & Critical Inventory List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Distribution Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Distribuição por Categoria</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">{categories.length} categorias</span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryStats.map(cat => (
                <div key={cat.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || '#4f46e5' }}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{cat.name}</h4>
                      <p className="text-xs text-slate-400">{cat.count} produtos | {cat.totalQty} un</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-600">{formatCurrency(cat.totalValue)}</div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Custo Total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Items Requiring Restock */}
          {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
            <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-slate-900 text-base">Itens que Requerem Reposição</h3>
                </div>
                <button
                  onClick={() => onNavigateToProducts('low')}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Ver todos os alertas &rarr;
                </button>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {[...outOfStockProducts, ...lowStockProducts].slice(0, 5).map(prod => (
                  <div key={prod.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <div className="font-medium text-slate-800 flex items-center gap-2">
                        <span>{prod.name}</span>
                        <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                          {prod.sku}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Local: {prod.location || 'Não especificado'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        {prod.quantity === 0 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] rounded uppercase font-bold">
                            Esgotado (0 un)
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded uppercase font-bold">
                            {prod.quantity} un (Mín: {prod.min_quantity})
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onOpenMovementModal('ENTRADA')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs"
                      >
                        Repor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Recent Movements Feed */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Atividade Recente</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">{movements.length} registros</span>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {movements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Nenhuma movimentação registrada.</p>
            ) : (
              movements.slice(0, 10).map(mov => (
                <div key={mov.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                        mov.type === 'ENTRADA'
                          ? 'bg-emerald-100 text-emerald-700'
                          : mov.type === 'SAIDA'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {mov.type} ({mov.quantity} un)
                    </span>
                    <span className="text-slate-400 text-[10px]">{formatDate(mov.created_at)}</span>
                  </div>

                  <div className="font-semibold text-slate-800 truncate">
                    {mov.product_name}
                  </div>

                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Total: <strong className="text-slate-800">{formatCurrency(mov.total_price)}</strong></span>
                    <span className="text-slate-400 italic truncate max-w-[140px]">{mov.reason}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
