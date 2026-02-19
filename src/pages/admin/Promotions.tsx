import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Percent, Tag, Calendar } from 'lucide-react';

function getAuthHeader() {
  const s = JSON.parse(localStorage.getItem('admin_session') || '{}');
  return { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' };
}

const typeLabels: Record<string, string> = {
  percentage: 'Desconto %',
  fixed_amount: 'Desconto R$',
  free_shipping: 'Frete Grátis',
  buy_x_get_y: 'Leve X Pague Y',
};

interface PromoForm {
  name: string; description: string; type: string; value: string;
  code: string; min_order_value: string; max_uses: string;
  starts_at: string; ends_at: string; active: boolean;
  banner_text: string;
}

const emptyForm: PromoForm = {
  name: '', description: '', type: 'percentage', value: '',
  code: '', min_order_value: '', max_uses: '',
  starts_at: '', ends_at: '', active: true, banner_text: '',
};

export function Promotions() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPromotions = async () => {
    setLoading(true);
    const res = await fetch('/api/catalog?resource=promotions&active_only=false', { headers: getAuthHeader() });
    const data = await res.json();
    setPromotions(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchPromotions(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name || '', description: p.description || '', type: p.type || 'percentage',
      value: String(p.value || ''), code: p.code || '', min_order_value: String(p.min_order_value || ''),
      max_uses: String(p.max_uses || ''), starts_at: p.starts_at?.slice(0, 16) || '',
      ends_at: p.ends_at?.slice(0, 16) || '', active: p.active ?? true, banner_text: p.banner_text || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      const url = editing ? `/api/catalog?resource=promotions&id=${editing.id}` : '/api/promotions';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: getAuthHeader(), body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setShowModal(false);
      fetchPromotions();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const deletePromo = async (id: string, name: string) => {
    if (!confirm(`Remover a promoção "${name}"?`)) return;
    await fetch(`/api/promotions/${id}`, { method: 'DELETE', headers: getAuthHeader() });
    fetchPromotions();
  };

  const toggleActive = async (p: any) => {
    await fetch(`/api/catalog?resource=promotions&id=${p.id}`, {
      method: 'PATCH', headers: getAuthHeader(),
      body: JSON.stringify({ active: !p.active }),
    });
    fetchPromotions();
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Promoções e Cupons</h2>
          <p className="text-sm text-gray-500">{promotions.length} promoção(ões) cadastrada(s)</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nova Promoção
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 border-4 border-amber-600 border-t-transparent rounded-full" />
        </div>
      ) : promotions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
          <Percent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Nenhuma promoção cadastrada</p>
          <button onClick={openNew} className="mt-3 text-amber-600 text-sm hover:underline">Criar primeira promoção</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {promotions.map(p => (
            <div key={p.id} className={`bg-white rounded-xl border p-5 shadow-sm ${p.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {typeLabels[p.type] || p.type}
                  </span>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deletePromo(p.id, p.name)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Percent className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    {p.type === 'percentage' ? `${p.value}% de desconto` :
                     p.type === 'fixed_amount' ? `R$ ${p.value} de desconto` :
                     p.type === 'free_shipping' ? 'Frete grátis' : `${p.value}`}
                  </span>
                </div>
                {p.code && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{p.code}</span>
                  </div>
                )}
                {(p.starts_at || p.ends_at) && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatDate(p.starts_at)} → {formatDate(p.ends_at)}</span>
                  </div>
                )}
                {p.max_uses && (
                  <p className="text-xs text-gray-400">{p.uses_count}/{p.max_uses} usos</p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.active ? 'Ativa' : 'Inativa'}
                </span>
                <button onClick={() => toggleActive(p)}
                  className="text-xs text-gray-400 hover:text-amber-600 transition-colors">
                  {p.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{editing ? 'Editar Promoção' : 'Nova Promoção'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Promoção *</label>
                <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ex: Black Friday 2026" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Banner</label>
                <input type="text" value={form.banner_text} onChange={e => set('banner_text', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ex: 30% OFF em toda a loja!" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Desconto *</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor {form.type === 'percentage' ? '(%)' : '(R$)'}
                  </label>
                  <input type="number" step="0.01" min="0" required value={form.value} onChange={e => set('value', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código do Cupom</label>
                  <input type="text" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="DESCONTO20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pedido mínimo (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.min_order_value} onChange={e => set('min_order_value', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                  <input type="datetime-local" value={form.starts_at} onChange={e => set('starts_at', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                  <input type="datetime-local" value={form.ends_at} onChange={e => set('ends_at', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite de usos (deixe vazio para ilimitado)</label>
                <input type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ilimitado" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                <span className="text-sm text-gray-700">Promoção ativa</span>
              </label>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
                  {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar promoção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
