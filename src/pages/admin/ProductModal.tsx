import React, { useEffect, useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';

interface ProductModalProps {
  product: any | null;
  onClose: () => void;
  onSaved: () => void;
}

function getAuthHeader() {
  const s = JSON.parse(localStorage.getItem('admin_session') || '{}');
  return { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' };
}

export function ProductModal({ product, onClose, onSaved }: ProductModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(product?.main_image_url || '');

  const [form, setForm] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    short_description: product?.short_description || '',
    category_id: product?.category_id || '',
    price_original: product?.price_original || '',
    price_sale: product?.price_sale || '',
    price_pix: product?.price_pix || '',
    installments_max: product?.installments_max || 3,
    stock_quantity: product?.stock_quantity ?? 0,
    stock_min_alert: product?.stock_min_alert || 5,
    frame_material: product?.frame_material || '',
    frame_shape: product?.frame_shape || '',
    frame_color: product?.frame_color || '',
    lens_type: product?.lens_type || '',
    gender: product?.gender || 'unissex',
    active: product?.active ?? true,
    featured: product?.featured ?? false,
    is_new: product?.is_new ?? false,
    is_promotion: product?.is_promotion ?? false,
    track_stock: product?.track_stock ?? true,
  });

  useEffect(() => {
    fetch('/api/catalog?resource=categories').then(r => r.json()).then(setCategories);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('bucket', 'products');
    const s = JSON.parse(localStorage.getItem('admin_session') || '{}');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${s.token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Erro ao fazer upload da imagem');
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      let mainImageUrl = product?.main_image_url || '';
      if (imageFile) {
        const url = await uploadImage();
        if (url) mainImageUrl = url;
      }

      const payload = {
        ...form,
        main_image_url: mainImageUrl,
        price_original: Number(form.price_original),
        price_sale: form.price_sale ? Number(form.price_sale) : null,
        price_pix: form.price_pix ? Number(form.price_pix) : null,
        stock_quantity: Number(form.stock_quantity),
        installments_max: Number(form.installments_max),
        category_id: form.category_id || null,
      };

      const url = product ? `/api/products?id=${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeader(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Erro ao salvar produto');
      }

      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Produto</label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg transition-colors">
                {imagePreview ? 'Trocar foto' : 'Adicionar foto'}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Informações básicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
              <input
                type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Óculos Ray-Ban Aviador"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input
                type="text" required value={form.sku} onChange={e => set('sku', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: RB-3025-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={form.category_id} onChange={e => set('category_id', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Sem categoria</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              placeholder="Descreva o produto..."
            />
          </div>

          {/* Preços */}
          <div className="bg-amber-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Preços e Pagamento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Preço Original *</label>
                <input
                  type="number" step="0.01" min="0" required value={form.price_original}
                  onChange={e => set('price_original', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Preço Promocional</label>
                <input
                  type="number" step="0.01" min="0" value={form.price_sale}
                  onChange={e => set('price_sale', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Preço no PIX</label>
                <input
                  type="number" step="0.01" min="0" value={form.price_pix}
                  onChange={e => set('price_pix', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Parcelas sem juros</label>
              <select
                value={form.installments_max} onChange={e => set('installments_max', Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}x sem juros</option>)}
              </select>
            </div>
          </div>

          {/* Estoque */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
              <input
                type="number" min="0" value={form.stock_quantity}
                onChange={e => set('stock_quantity', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alerta de estoque mínimo</label>
              <input
                type="number" min="0" value={form.stock_min_alert}
                onChange={e => set('stock_min_alert', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Atributos ópticos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gênero</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="unissex">Unissex</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="infantil">Infantil</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Material da Armação</label>
              <input type="text" value={form.frame_material} onChange={e => set('frame_material', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Metal, Acetato..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cor da Armação</label>
              <input type="text" value={form.frame_color} onChange={e => set('frame_color', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Preto, Dourado..." />
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'active', label: 'Produto ativo' },
              { key: 'featured', label: 'Destacar na home' },
              { key: 'is_new', label: 'Novidade' },
              { key: 'is_promotion', label: 'Em promoção' },
              { key: 'track_stock', label: 'Controlar estoque' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form as any)[key]}
                  onChange={e => set(key, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Salvando...' : product ? 'Salvar alterações' : 'Criar produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
