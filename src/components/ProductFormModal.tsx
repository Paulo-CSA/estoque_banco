import React, { useState, useEffect } from 'react';
import { X, Package, Tag, Building, DollarSign, MapPin, Plus } from 'lucide-react';
import { Product, Category, Supplier } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  productToEdit?: Product | null;
  categories: Category[];
  suppliers: Supplier[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
  categories,
  suppliers
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [minQuantity, setMinQuantity] = useState(5);
  const [unitCost, setUnitCost] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [unitMeasure, setUnitMeasure] = useState('UN');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku || '');
      setName(productToEdit.name || '');
      setDescription(productToEdit.description || '');
      setCategoryId(productToEdit.category_id || '');
      setSupplierId(productToEdit.supplier_id || '');
      setQuantity(productToEdit.quantity || 0);
      setMinQuantity(productToEdit.min_quantity || 5);
      setUnitCost(productToEdit.unit_cost || 0);
      setSalePrice(productToEdit.sale_price || 0);
      setUnitMeasure(productToEdit.unit_measure || 'UN');
      setLocation(productToEdit.location || '');
    } else {
      setSku('SKU-' + Math.floor(1000 + Math.random() * 9000));
      setName('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setSupplierId(suppliers[0]?.id || '');
      setQuantity(0);
      setMinQuantity(5);
      setUnitCost(0);
      setSalePrice(0);
      setUnitMeasure('UN');
      setLocation('');
    }
  }, [productToEdit, isOpen, categories, suppliers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        sku,
        name,
        description,
        category_id: categoryId || null,
        supplier_id: supplierId || null,
        quantity: Number(quantity),
        min_quantity: Number(minQuantity),
        unit_cost: Number(unitCost),
        sale_price: Number(salePrice),
        unit_measure: unitMeasure,
        location
      });
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar produto: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl p-6 text-slate-900 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {productToEdit ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* SKU */}
            <div className="sm:col-span-4">
              <label className="block font-semibold text-slate-700 mb-1">SKU / Código *</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-indigo-500 font-medium"
                required
              />
            </div>

            {/* Product Name */}
            <div className="sm:col-span-8">
              <label className="block font-semibold text-slate-700 mb-1">Nome do Produto *</label>
              <input
                type="text"
                placeholder="Ex: Teclado Mecânico RGB Wireless"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Especificações técnicas ou observações..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category & Supplier Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="">Sem Categoria</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fornecedor</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="">Sem Fornecedor</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantities & Unit Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {!productToEdit && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estoque Inicial</label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estoque Mínimo (Alerta)</label>
              <input
                type="number"
                min="0"
                value={minQuantity}
                onChange={(e) => setMinQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unidade de Medida</label>
              <select
                value={unitMeasure}
                onChange={(e) => setUnitMeasure(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="UN">UN (Unidade)</option>
                <option value="CX">CX (Caixa)</option>
                <option value="KG">KG (Quilograma)</option>
                <option value="L">L (Litro)</option>
                <option value="M">M (Metro)</option>
                <option value="PACOTE">PACOTE</option>
              </select>
            </div>
          </div>

          {/* Pricing & Location Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Preço Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Preço Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold text-emerald-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Localização no Galpão</label>
              <input
                type="text"
                placeholder="Ex: Prateleira B-04"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              {submitting ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
