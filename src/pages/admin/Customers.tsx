import React, { useEffect, useRef, useState } from 'react';
import { Search, Users, Phone, Mail, X, MapPin, CreditCard, Heart, ShoppingBag, User, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

function getAuthHeader() {
  const s = JSON.parse(localStorage.getItem('admin_session') || '{}');
  return { Authorization: `Bearer ${s.token}` };
}

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '—';
}
function formatCurrency(v: number) {
  return v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
}

// Modal de confirmação de exclusão
function ConfirmDeleteModal({
  customer,
  onConfirm,
  onCancel,
  loading,
}: {
  customer: { id: string; name: string; email: string };
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Excluir cliente</h3>
            <p className="text-xs text-gray-500">Esta ação não pode ser desfeita</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          Você está prestes a excluir a conta de:
        </p>
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm font-semibold text-gray-800">{customer.name}</p>
          <p className="text-xs text-gray-500">{customer.email}</p>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Serão excluídos: dados pessoais, endereços, cartões e favoritos.<br />
          <strong>Pedidos realizados serão preservados</strong> no histórico da loja.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {loading ? 'Excluindo...' : 'Excluir conta'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerDetail({
  customerId,
  onClose,
  onDelete,
}: {
  customerId: string;
  onClose: () => void;
  onDelete: (id: string, name: string, email: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'dados' | 'enderecos' | 'pedidos' | 'cartoes' | 'favoritos'>('dados');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/customers?id=${customerId}`, { headers: getAuthHeader() })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [customerId]);

  const tabs = [
    { key: 'dados', label: 'Dados', icon: User },
    { key: 'enderecos', label: 'Endereços', icon: MapPin },
    { key: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
    { key: 'cartoes', label: 'Cartões', icon: CreditCard },
    { key: 'favoritos', label: 'Favoritos', icon: Heart },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-800 font-bold text-lg">
              {data?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">{data?.name || 'Carregando...'}</h2>
              <p className="text-xs text-gray-500">{data?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={() => onDelete(data.id, data.name, data.email)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
                title="Excluir cliente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    tab === key
                      ? 'border-amber-600 text-amber-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {key === 'enderecos' && data?.addresses?.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{data.addresses.length}</span>
                  )}
                  {key === 'pedidos' && data?.orders?.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{data.orders.length}</span>
                  )}
                  {key === 'cartoes' && data?.cards?.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{data.cards.length}</span>
                  )}
                  {key === 'favoritos' && data?.favorites?.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{data.favorites.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Conteúdo das abas */}
            <div className="flex-1 p-6">

              {/* Aba: Dados */}
              {tab === 'dados' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="Nome completo" value={data?.name} />
                    <InfoField label="E-mail" value={data?.email} />
                    <InfoField label="Telefone" value={data?.phone || '—'} />
                    <InfoField label="CPF" value={data?.cpf || '—'} />
                    <InfoField label="Gênero" value={data?.gender || '—'} />
                    <InfoField label="Nascimento" value={data?.birthdate ? formatDate(data.birthdate) : '—'} />
                    <InfoField label="Newsletter" value={data?.newsletter ? 'Inscrito' : 'Não inscrito'} />
                    <InfoField label="Cadastro" value={formatDate(data?.created_at)} />
                  </div>
                  {/* Aviso se não tem pedidos */}
                  {data?.orders?.length === 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700">Este cliente ainda não realizou nenhuma compra.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Aba: Endereços */}
              {tab === 'enderecos' && (
                <div className="space-y-3">
                  {data?.addresses?.length === 0 ? (
                    <EmptyState icon={MapPin} text="Nenhum endereço cadastrado" />
                  ) : (
                    data.addresses.map((addr: any) => (
                      <div key={addr.id} className="border border-gray-100 rounded-xl p-4 space-y-1">
                        {addr.label && (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{addr.label}</span>
                        )}
                        <p className="text-sm font-medium text-gray-800 mt-1">
                          {addr.rua}{addr.numero ? `, ${addr.numero}` : ''}{addr.complemento ? ` - ${addr.complemento}` : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {addr.bairro && `${addr.bairro}, `}{addr.cidade} - {addr.estado}
                        </p>
                        <p className="text-xs text-gray-400">CEP: {addr.cep}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Aba: Pedidos */}
              {tab === 'pedidos' && (
                <div className="space-y-3">
                  {data?.orders?.length === 0 ? (
                    <EmptyState icon={ShoppingBag} text="Nenhum pedido realizado" />
                  ) : (
                    data.orders.map((order: any) => (
                      <div key={order.id} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Pedido #{order.id?.slice(0, 8)}</p>
                          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-800">{formatCurrency(order.total)}</p>
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Aba: Cartões */}
              {tab === 'cartoes' && (
                <div className="space-y-3">
                  {data?.cards?.length === 0 ? (
                    <EmptyState icon={CreditCard} text="Nenhum cartão salvo" />
                  ) : (
                    data.cards.map((card: any) => (
                      <div key={card.id} className="border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {card.card_brand} •••• {card.last_four}
                          </p>
                          <p className="text-xs text-gray-500">{card.holder_name} · Validade: {card.expiry_month}/{card.expiry_year}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Aba: Favoritos */}
              {tab === 'favoritos' && (
                <div className="space-y-3">
                  {data?.favorites?.length === 0 ? (
                    <EmptyState icon={Heart} text="Nenhum produto favoritado" />
                  ) : (
                    data.favorites.map((fav: any) => (
                      <div key={fav.id} className="border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                        {fav.product_image ? (
                          <img src={fav.product_image} alt={fav.product_name} className="w-12 h-12 object-cover rounded-lg" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Heart className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800">{fav.product_name || `Produto #${fav.product_id}`}</p>
                          {fav.product_price && (
                            <p className="text-xs text-amber-600 font-medium">{formatCurrency(fav.product_price)}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    shipped: 'bg-blue-100 text-blue-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {map[status] || status}
    </span>
  );
}

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const isMounted = useRef(true);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchCustomers(currentPage: number, currentSearch: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '20' });
      if (currentSearch) params.append('search', currentSearch);
      const res = await fetch(`/api/customers?${params}`, { headers: getAuthHeader() });
      const data = await res.json();
      if (isMounted.current) {
        setCustomers(data.customers || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch {
      if (isMounted.current) { setCustomers([]); setTotal(0); }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    isMounted.current = true;
    fetchCustomers(1, '');
    return () => { isMounted.current = false; };
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    fetchCustomers(page, search);
  }, [page]);

  function handleSearch(value: string) {
    setSearch(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setPage(1);
      fetchCustomers(1, value);
    }, 400);
  }

  function handleDeleteRequest(id: string, name: string, email: string) {
    setSelectedId(null); // Fecha o painel de detalhes
    setDeleteTarget({ id, name, email });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers?id=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchCustomers(page, search); // Recarrega a lista
      }
    } catch {}
    finally { setDeleting(false); }
  }

  async function handleCleanup() {
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const res = await fetch('/api/customers?action=cleanup', {
        method: 'POST',
        headers: getAuthHeader(),
      });
      const data = await res.json();
      setCleanupResult(data.message || 'Limpeza concluída');
      if (data.deleted > 0) fetchCustomers(page, search);
    } catch {
      setCleanupResult('Erro ao executar limpeza');
    } finally {
      setCleanupLoading(false);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      {/* Painel de detalhes */}
      {selectedId && (
        <CustomerDetail
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onDelete={handleDeleteRequest}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteTarget && (
        <ConfirmDeleteModal
          customer={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Clientes</h2>
          <p className="text-sm text-gray-500">{total} cliente{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        {/* Botão de limpeza automática */}
        <div className="flex items-center gap-3">
          {cleanupResult && (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">{cleanupResult}</span>
          )}
          <button
            onClick={handleCleanup}
            disabled={cleanupLoading}
            title="Excluir contas criadas há mais de 1 ano sem nenhuma compra"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cleanupLoading ? 'animate-spin' : ''}`} />
            Limpeza automática
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-amber-600 border-t-transparent rounded-full" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Cliente</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Contato</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Cadastro</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(c => (
                  <tr
                    key={c.id}
                    className="hover:bg-amber-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedId(c.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-400 md:hidden">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />{c.email}
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />{c.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedId(c.id); }}
                          className="text-xs text-amber-600 hover:text-amber-800 font-medium hover:underline"
                        >
                          Ver detalhes →
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteRequest(c.id, c.name, c.email); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Próxima</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
