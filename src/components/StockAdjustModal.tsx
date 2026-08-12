import React, { useState } from 'react';
import { X, ArrowUpDown, Plus, Minus } from 'lucide-react';
import { Product } from '../types';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirmAdjust: (data: {
    type: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
    quantity: number;
    reason: string;
    unit_price?: number;
  }) => Promise<void>;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirmAdjust
}) => {
  const [type, setType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [adjustQty, setAdjustQty] = useState(1);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustQty <= 0) return;

    setSubmitting(true);
    try {
      await onConfirmAdjust({
        type,
        quantity: Number(adjustQty),
        reason: reason || (type === 'ENTRADA' ? 'Entrada rápida de estoque' : 'Saída rápida de estoque')
      });
      onClose();
    } catch (err: any) {
      alert('Erro ao ajustar estoque: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const newExpectedQty = type === 'ENTRADA'
    ? product.quantity + Number(adjustQty)
    : Math.max(0, product.quantity - Number(adjustQty));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Ajuste Rápido de Estoque</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-slate-900 text-sm">{product.name}</div>
          <div className="text-slate-400 font-mono">SKU: {product.sku}</div>
          <div className="text-slate-600 font-medium">
            Estoque Atual: <strong className="text-emerald-600 font-bold">{product.quantity} {product.unit_measure}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Action Type Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Operação</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setType('ENTRADA')}
                className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  type === 'ENTRADA' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Plus className="w-4 h-4" />
                Adicionar (+)
              </button>
              <button
                type="button"
                onClick={() => setType('SAIDA')}
                className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  type === 'SAIDA' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Minus className="w-4 h-4" />
                Remover (-)
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Quantidade *</label>
            <input
              type="number"
              min="1"
              value={adjustQty}
              onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-base text-center focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Resulting Stock Preview Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Novo Estoque Previsto:</span>
            <span className="font-extrabold text-base text-slate-900">
              {newExpectedQty} {product.unit_measure}
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Motivo do Ajuste</label>
            <input
              type="text"
              placeholder={type === 'ENTRADA' ? 'Ex: Recebimento de fardo, Ajuste de contagem' : 'Ex: Venda no balcão, Produto danificado'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded-xl font-bold text-white transition-all shadow-xs ${
                type === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {submitting ? 'Salvando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
