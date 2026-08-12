import React, { useState } from 'react';
import { Search, Plus, Download, Edit2, Trash2, ArrowUpDown, Filter, AlertTriangle, CheckCircle2, XCircle, MapPin, DollarSign, RefreshCw } from 'lucide-react';
import { Product, Category, Supplier } from '../types';

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onQuickAdjustStock: (product: Product) => void;
  initialFilter?: string;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  suppliers,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickAdjustStock,
  initialFilter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>(initialFilter || 'all');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Filtered product list
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;

    let matchesStatus = true;
    if (stockStatusFilter === 'low') {
      matchesStatus = p.quantity > 0 && p.quantity <= p.min_quantity;
    } else if (stockStatusFilter === 'out') {
      matchesStatus = p.quantity === 0;
    } else if (stockStatusFilter === 'normal') {
      matchesStatus = p.quantity > p.min_quantity;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Export to CSV function
  const handleExportCSV = () => {
    if (products.length === 0) return;

    const headers = ['SKU', 'Nome', 'Categoria', 'Fornecedor', 'Quantidade', 'Qtd Minima', 'Custo Unitario (R$)', 'Preco Venda (R$)', 'Valor Total Custo (R$)', 'Unidade', 'Localizacao'];
    const rows = products.map(p => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category_name || ''}"`,
      `"${p.supplier_name || ''}"`,
      p.quantity,
      p.min_quantity,
      p.unit_cost.toFixed(2),
      p.sale_price.toFixed(2),
      (p.quantity * p.unit_cost).toFixed(2),
      p.unit_measure,
      `"${p.location || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_estoque_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Catálogo de Produtos & Estoque</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie os itens do inventário, localizações e valores</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenAddProduct}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Produto</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, SKU ou prateleira..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">Todas as Categorias ({categories.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div className="md:col-span-4 flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setStockStatusFilter('all')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
              stockStatusFilter === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => setStockStatusFilter('normal')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
              stockStatusFilter === 'normal' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setStockStatusFilter('low')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
              stockStatusFilter === 'low' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-amber-600'
            }`}
          >
            Baixo
          </button>
          <button
            onClick={() => setStockStatusFilter('out')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
              stockStatusFilter === 'out' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-rose-600'
            }`}
          >
            Zerado
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-100 text-[11px] uppercase tracking-widest font-bold">
                <th className="py-3.5 px-4">SKU / Código</th>
                <th className="py-3.5 px-4">Produto</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Local</th>
                <th className="py-3.5 px-4 text-center">Quantidade</th>
                <th className="py-3.5 px-4 text-right">Custo Un.</th>
                <th className="py-3.5 px-4 text-right">Venda Un.</th>
                <th className="py-3.5 px-4 text-right">Valor Custo</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const totalCost = prod.quantity * prod.unit_cost;
                  const isOutOfStock = prod.quantity === 0;
                  const isLowStock = prod.quantity > 0 && prod.quantity <= prod.min_quantity;

                  const marginPct = prod.unit_cost > 0
                    ? (((prod.sale_price - prod.unit_cost) / prod.unit_cost) * 100).toFixed(0)
                    : '0';

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-400 text-xs">
                        {prod.sku}
                      </td>

                      {/* Product Name & Description */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{prod.name}</div>
                        {prod.description && (
                          <div className="text-xs text-slate-400 line-clamp-1">{prod.description}</div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        {prod.category_name ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{
                              backgroundColor: `${prod.category_color || '#4f46e5'}15`,
                              color: prod.category_color || '#4338ca',
                              border: `1px solid ${prod.category_color || '#4f46e5'}30`
                            }}
                          >
                            {prod.category_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {prod.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {prod.location}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Quantity & Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-bold text-slate-900 text-base">
                            {prod.quantity} <span className="text-xs font-normal text-slate-400">{prod.unit_measure}</span>
                          </span>
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded uppercase font-bold" title="Sem Estoque">
                              Esgotado
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded uppercase font-bold" title={`Abaixo do mínimo (${prod.min_quantity})`}>
                              Baixo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded uppercase font-bold" title="Estoque Normal">
                              Normal
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-4 text-right text-slate-600 font-medium">
                        {formatCurrency(prod.unit_cost)}
                      </td>

                      {/* Sale Price & Margin */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-semibold text-emerald-600">{formatCurrency(prod.sale_price)}</div>
                        <div className="text-[10px] text-slate-400">Margem: +{marginPct}%</div>
                      </td>

                      {/* Total Cost Value */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(totalCost)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Quick Adjust Button */}
                          <button
                            onClick={() => onQuickAdjustStock(prod)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-colors border border-indigo-100"
                            title="Ajuste Rápido de Estoque (+/-)"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => onEditProduct(prod)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200"
                            title="Editar Dados do Produto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (confirm(`Excluir o produto "${prod.name}" do estoque?`)) {
                                onDeleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition-colors border border-rose-100"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
