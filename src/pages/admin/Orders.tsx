import React, { useEffect, useState } from 'react';
import { Search, Eye, ChevronDown, ShoppingCart } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};
const statusLabels: Record<string, string> = {
  pending: 'Pendente', confirmed: 'Confirmado', processing: 'Em preparo',
  shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado', refunded: 'Reembolsado',
};
const paymentLabels: Record<string, string> = {
  pending: 'Aguardando', paid: 'Pago', failed: 'Falhou', refunded: 'Reembolsado',
};
const paymentColors: Record<string, string> = {
  pending: 'text-yellow-600', paid: 'text-green-600', failed: 'text-red-600', refunded: 'text-gray-500',
};

function getAuthHeader() {
  const s = JSON.parse(localStorage.getItem('admin_session') || '{}');
  return { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' };
}

export function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (filterStatus) params.append('status', filterStatus);
    if (search) params.append('search', search);
    const res = await fetch(`/api/orders?${params}`, { headers: getAuthHeader() });
    const data = await res.json();
    setOrders(data.orders || []);
    setTotal(data.pagination?.total || 0);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [page, filterStatus]);
  useEffect(() => {
    const t = setTimeout(fetchOrders, 400);
    return () => clearTimeout(t);
  }, [search]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await fetch(`/api/orders?id=${id}`, {
      method: 'PATCH',
      headers: getAuthHeader(),
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    fetchOrders();
    if (selectedOrder?.id === id) setSelectedOrder((o: any) => ({ ...o, status }));
  };

  const formatCurrency = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Pedidos</h2>
          <p className="text-sm text-gray-500">{total} pedido{total !== 1 ? 's' : ''} no total</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Buscar por número ou cliente..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <select
          value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Todos os status</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-amber-600 border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Pedido</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Cliente</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Pagamento</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Data</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">#{order.order_number}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-700">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(order.total)}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-medium ${paymentColors[order.payment_status] || 'text-gray-500'}`}>
                        {paymentLabels[order.payment_status] || order.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <select
                          value={order.status}
                          onChange={e => updateStatus(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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

      {/* Modal detalhe do pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Pedido #{selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs">Cliente</p><p className="font-medium">{selectedOrder.customer_name}</p></div>
                <div><p className="text-gray-400 text-xs">E-mail</p><p className="font-medium">{selectedOrder.customer_email}</p></div>
                <div><p className="text-gray-400 text-xs">Telefone</p><p className="font-medium">{selectedOrder.customer_phone || '—'}</p></div>
                <div><p className="text-gray-400 text-xs">Pagamento</p><p className="font-medium capitalize">{selectedOrder.payment_method || '—'}</p></div>
                <div><p className="text-gray-400 text-xs">Subtotal</p><p className="font-medium">{formatCurrency(selectedOrder.subtotal)}</p></div>
                <div><p className="text-gray-400 text-xs">Desconto</p><p className="font-medium text-green-600">-{formatCurrency(selectedOrder.discount_amount)}</p></div>
                <div><p className="text-gray-400 text-xs">Frete</p><p className="font-medium">{formatCurrency(selectedOrder.shipping_amount)}</p></div>
                <div><p className="text-gray-400 text-xs font-bold">TOTAL</p><p className="font-bold text-amber-600 text-base">{formatCurrency(selectedOrder.total)}</p></div>
              </div>
              {selectedOrder.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Observações do cliente</p>
                  <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
