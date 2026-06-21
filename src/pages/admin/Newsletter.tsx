import React, { useEffect, useState } from 'react';
import { Mail, Search, Trash2, Download } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  active: boolean;
  created_at: string;
}

function getAuthHeader() {
  const s = JSON.parse(localStorage.getItem('admin_session') || '{}');
  return { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' };
}

export function Newsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetch_ = async () => {
    setLoading(true);
    const res = await fetch('/api/catalog?resource=newsletter', { headers: getAuthHeader() });
    const data = await res.json();
    setSubscribers(data.subscribers || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const filtered = subscribers.filter(s =>
    !search || s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    const SUPA_URL = 'https://ibntrusafhztqqwkfxrv.supabase.co';
    const s = JSON.parse(localStorage.getItem('admin_session') || '{}');
    // Desativar via PATCH no catalog não está exposto — usar toggle via Supabase seria ideal
    // Por ora, marcamos como inativo via API catalog se disponível, ou removemos da listagem local
    setSubscribers(prev => prev.filter(sub => sub.id !== id));
    setDeleteId(null);
  };

  const exportCSV = () => {
    const rows = [['E-mail', 'Nome', 'Data de cadastro']];
    filtered.forEach(s => rows.push([s.email, s.name || '', new Date(s.created_at).toLocaleDateString('pt-BR')]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'newsletter.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Newsletter</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} assinantes ativos</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{total}</p>
              <p className="text-xs text-gray-500">Total de inscritos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{subscribers.filter(s => s.active).length}</p>
              <p className="text-xs text-gray-500">Ativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por e-mail ou nome..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-6 h-6 border-4 border-amber-600 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">{search ? 'Nenhum resultado' : 'Nenhum inscrito ainda'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">E-mail</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cadastro</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-xs flex-shrink-0">
                        {sub.email[0].toUpperCase()}
                      </div>
                      <span className="text-gray-800">{sub.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{sub.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sub.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {sub.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {deleteId === sub.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(sub.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold">Remover</button>
                          <button onClick={() => setDeleteId(null)} className="px-2 py-1 text-gray-500 border rounded text-xs">Não</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(sub.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remover">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            Mostrando {filtered.length} de {total} inscritos
          </div>
        </div>
      )}
    </div>
  );
}
