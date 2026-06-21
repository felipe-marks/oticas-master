import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  sort_order: number;
}

function getAuthHeader() {
  const s = JSON.parse(localStorage.getItem('admin_session') || '{}');
  return { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' };
}

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface FormState { name: string; slug: string; description: string; active: boolean; sort_order: number; }
const emptyForm: FormState = { name: '', slug: '', description: '', active: true, sort_order: 0 };

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetch_ = async () => {
    setLoading(true);
    const res = await fetch('/api/catalog?resource=categories', { headers: getAuthHeader() });
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: categories.length + 1 });
    setError('');
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', active: cat.active, sort_order: cat.sort_order });
    setError('');
    setShowForm(true);
  };

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: editing ? f.slug : slugify(name) }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome obrigatório'); return; }
    if (!form.slug.trim()) { setError('Slug obrigatório'); return; }
    setSaving(true);
    setError('');
    const body = { name: form.name.trim(), slug: form.slug.trim(), description: form.description, active: form.active, sort_order: Number(form.sort_order) };
    const url = editing ? `/api/catalog?resource=categories&id=${editing.id}` : '/api/catalog?resource=categories';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: getAuthHeader(), body: JSON.stringify(body) });
    if (res.ok) {
      setShowForm(false);
      fetch_();
    } else {
      const d = await res.json();
      setError(d.message || 'Erro ao salvar');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/catalog?resource=categories&id=${id}`, { method: 'DELETE', headers: getAuthHeader() });
    setDeleteId(null);
    fetch_();
  };

  const toggleActive = async (cat: Category) => {
    await fetch(`/api/catalog?resource=categories&id=${cat.id}`, {
      method: 'PUT', headers: getAuthHeader(),
      body: JSON.stringify({ ...cat, active: !cat.active }),
    });
    fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Categorias</h2>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} categorias cadastradas</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editing ? 'Editar Categoria' : 'Nova Categoria'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input value={form.name} onChange={e => handleNameChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Óculos de Sol" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                placeholder="Ex: solar" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Descrição opcional da categoria" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" min={0} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 text-amber-600 rounded" />
                <span className="text-sm font-medium text-gray-700">Categoria ativa</span>
              </label>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <Check className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-6 h-6 border-4 border-amber-600 border-t-transparent rounded-full" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">Nenhuma categoria cadastrada</p>
          <button onClick={openNew} className="mt-3 text-amber-600 hover:underline text-sm font-medium">Criar primeira categoria</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8"></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ordem</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-300"><GripVertical className="w-4 h-4" /></td>
                  <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.sort_order}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(cat)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.active ? 'Ativa' : 'Inativa'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {deleteId === cat.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(cat.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold">Confirmar</button>
                          <button onClick={() => setDeleteId(null)} className="px-2 py-1 text-gray-500 border rounded text-xs">Não</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
