import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowUpDown, Plus, Search, Calendar, User, FileText } from 'lucide-react';
import { Product, Movement, MovementType } from '../types';

interface MovementsViewProps {
  products: Product[];
  movements: Movement[];
  onRecordMovement: (data: {
    product_id: string;
    type: MovementType;
    quantity: number;
    unit_price: number;
    reason: string;
    user_name: string;
  }) => Promise<void>;
  preselectedType?: 'ENTRADA' | 'SAIDA';
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  products,
  movements,
  onRecordMovement,
  preselectedType = 'ENTRADA'
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [movementType, setMovementType] = useState<MovementType>(preselectedType);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [userName, setUserName] = useState<string>('Operador');
  const [submitting, setSubmitting] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const p = products.find(prod => prod.id === productId);
    if (p) {
      setUnitPrice(movementType === 'ENTRADA' ? p.unit_cost : p.sale_price);
    }
  };

  const handleTypeChange = (type: MovementType) => {
    setMovementType(type);
    if (selectedProduct) {
      setUnitPrice(type === 'ENTRADA' ? selectedProduct.unit_cost : selectedProduct.sale_price);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Selecione um produto');
      return;
    }
    if (quantity <= 0) {
      alert('Informe uma quantidade válida');
      return;
    }

    setSubmitting(true);
    try {
      await onRecordMovement({
        product_id: selectedProductId,
        type: movementType,
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
        reason: reason || (movementType === 'ENTRADA' ? 'Entrada em estoque' : 'Saída de estoque'),
        user_name: userName || 'Operador'
      });

      // Reset form
      setSelectedProductId('');
      setQuantity(1);
      setUnitPrice(0);
      setReason('');
      alert('Movimentação registrada com sucesso!');
    } catch (err: any) {
      alert('Erro ao registrar movimentação: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMovements = movements.filter(m =>
    m.product_name.toLowerCase().includes(searchHistory.toLowerCase()) ||
    m.reason.toLowerCase().includes(searchHistory.toLowerCase()) ||
    (m.product_sku && m.product_sku.toLowerCase().includes(searchHistory.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 5 Cols: Register Movement Form */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-indigo-600" />
            Nova Movimentação
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Lançamento direto de entrada, saída ou ajuste de inventário</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Movement Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipo de Movimentação</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleTypeChange('ENTRADA')}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  movementType === 'ENTRADA'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Entrada
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('SAIDA')}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  movementType === 'SAIDA'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Saída
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('AJUSTE')}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  movementType === 'AJUSTE'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Ajuste
              </button>
            </div>
          </div>

          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Selecione o Produto *</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
              required
            >
              <option value="">-- Escolha um produto --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} (Estoque Atual: {p.quantity} {p.unit_measure})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Price Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade ({selectedProduct?.unit_measure || 'UN'}) *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preço Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
          </div>

          {/* Total Value Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Valor Total da Operação:</span>
            <span className="font-extrabold text-base text-emerald-600">
              {formatCurrency(quantity * unitPrice)}
            </span>
          </div>

          {/* Reason / Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo / Observação</label>
            <input
              type="text"
              placeholder={movementType === 'ENTRADA' ? 'Ex: Compra NF 1234, Devolução de cliente' : 'Ex: Venda Pedido #99, Perda, Uso interno'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Responsible Operator */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Operador Responsável</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${
              movementType === 'ENTRADA'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : movementType === 'SAIDA'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {submitting ? 'Registrando...' : `Confirmar ${movementType === 'ENTRADA' ? 'Entrada' : movementType === 'SAIDA' ? 'Saída' : 'Ajuste'}`}
          </button>
        </form>
      </div>

      {/* Right 7 Cols: Movement History Table */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Histórico de Movimentações</h2>
            <p className="text-xs text-slate-500">Auditoria de entradas, saídas e ajustes efetuados</p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar histórico..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-100 text-[11px] uppercase tracking-widest font-bold">
                <th className="py-2.5 px-3">Data/Hora</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Produto</th>
                <th className="py-2.5 px-3 text-center">Qtd</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(mov => (
                  <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap font-medium">
                      {formatDate(mov.created_at)}
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          mov.type === 'ENTRADA'
                            ? 'bg-emerald-100 text-emerald-700'
                            : mov.type === 'SAIDA'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {mov.type}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {mov.product_name}
                      {mov.product_sku && (
                        <span className="block text-[10px] font-mono text-slate-400">{mov.product_sku}</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                      {mov.quantity}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                      {formatCurrency(mov.total_price)}
                    </td>

                    <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-[150px] truncate">
                      {mov.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
