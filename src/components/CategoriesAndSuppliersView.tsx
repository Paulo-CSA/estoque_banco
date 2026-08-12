import React, { useState } from 'react';
import { Tag, Users, Plus, Trash2, Building, Mail, Phone, UserCheck, ShieldAlert } from 'lucide-react';
import { Category, Supplier } from '../types';

interface CategoriesAndSuppliersViewProps {
  categories: Category[];
  suppliers: Supplier[];
  onAddCategory: (data: { name: string; description?: string; color?: string }) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddSupplier: (data: { name: string; cnpj_cpf?: string; email?: string; phone?: string; contact_person?: string }) => Promise<void>;
  onDeleteSupplier: (id: string) => Promise<void>;
}

export const CategoriesAndSuppliersView: React.FC<CategoriesAndSuppliersViewProps> = ({
  categories,
  suppliers,
  onAddCategory,
  onDeleteCategory,
  onAddSupplier,
  onDeleteSupplier
}) => {
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState('#4f46e5');
  const [addingCat, setAddingCat] = useState(false);

  const [supName, setSupName] = useState('');
  const [supCnpj, setSupCnpj] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supContact, setSupContact] = useState('');
  const [addingSup, setAddingSup] = useState(false);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setAddingCat(true);
    try {
      await onAddCategory({ name: catName, description: catDesc, color: catColor });
      setCatName('');
      setCatDesc('');
      setCatColor('#4f46e5');
    } catch (err: any) {
      alert('Erro ao criar categoria: ' + err.message);
    } finally {
      setAddingCat(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    setAddingSup(true);
    try {
      await onAddSupplier({
        name: supName,
        cnpj_cpf: supCnpj,
        email: supEmail,
        phone: supPhone,
        contact_person: supContact
      });
      setSupName('');
      setSupCnpj('');
      setSupEmail('');
      setSupPhone('');
      setSupContact('');
    } catch (err: any) {
      alert('Erro ao criar fornecedor: ' + err.message);
    } finally {
      setAddingSup(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Categories Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Categorias de Produtos</h2>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
            {categories.length} cadastradas
          </span>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleCreateCategory} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
          <h3 className="font-semibold text-slate-800 text-xs">Nova Categoria</h3>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-8">
              <input
                type="text"
                placeholder="Nome da categoria *"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                required
              />
            </div>
            <div className="sm:col-span-4 flex items-center space-x-2">
              <input
                type="color"
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                className="w-10 h-8 rounded border border-slate-200 bg-white cursor-pointer p-0.5"
                title="Cor do badge"
              />
              <span className="text-slate-500 text-[11px] font-medium">Cor Badge</span>
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={addingCat}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Categoria</span>
          </button>
        </form>

        {/* Categories List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Nenhuma categoria cadastrada.</p>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#4f46e5' }}
                  />
                  <div>
                    <h4 className="font-semibold text-slate-800">{cat.name}</h4>
                    {cat.description && (
                      <p className="text-slate-400 text-[11px]">{cat.description}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Remover categoria "${cat.name}"?`)) {
                      onDeleteCategory(cat.id);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  title="Excluir Categoria"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Suppliers Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Fornecedores</h2>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
            {suppliers.length} cadastrados
          </span>
        </div>

        {/* Add Supplier Form */}
        <form onSubmit={handleCreateSupplier} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
          <h3 className="font-semibold text-slate-800 text-xs">Novo Fornecedor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                placeholder="Razão Social / Nome *"
                value={supName}
                onChange={(e) => setSupName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="CNPJ / CPF"
                value={supCnpj}
                onChange={(e) => setSupCnpj(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="E-mail de contato"
                value={supEmail}
                onChange={(e) => setSupEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Telefone"
                value={supPhone}
                onChange={(e) => setSupPhone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Pessoa de Contato / Vendedor"
              value={supContact}
              onChange={(e) => setSupContact(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={addingSup}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Fornecedor</span>
          </button>
        </form>

        {/* Suppliers List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {suppliers.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Nenhum fornecedor cadastrado.</p>
          ) : (
            suppliers.map(sup => (
              <div key={sup.id} className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>{sup.name}</span>
                    {sup.cnpj_cpf && (
                      <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                        {sup.cnpj_cpf}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
                    {sup.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{sup.email}</span>}
                    {sup.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{sup.phone}</span>}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Remover fornecedor "${sup.name}"?`)) {
                      onDeleteSupplier(sup.id);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  title="Excluir Fornecedor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
