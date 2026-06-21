import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Package, Download } from 'lucide-react';

function getAuthHeader() {
  const s = JSON.parse(localStorage.getItem('admin_session') || '{}');
  return { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' };
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function Reports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30' | '90' | '365'>('30');

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      let all: Order[] = [];
      let page = 1;
      while (true) {
        const res = await fetch(`/api/orders?page=${page}&limit=50`, { headers: getAuthHeader() });
        const d = await res.json();
        all = [...all, ...(d.orders || [])];
        if (all.length >= (d.pagination?.total || 0)) break;
        page++;
      }
      setOrders(all);
      setLoading(false);
    };
    fetch_();
  }, []);

  const now = new Date();
  const cutoff = new Date(now.getTime() - Number(period) * 24 * 60 * 60 * 1000);

  const filtered = orders.filter(o => new Date(o.created_at) >= cutoff);
  const paid = filtered.filter(o => o.payment_status === 'paid');

  const revenue = paid.reduce((s, o) => s + Number(o.total), 0);
  const avgTicket = paid.length > 0 ? revenue / paid.length : 0;
  const pending = filtered.filter(o => o.payment_status === 'pending').length;
  const cancelled = filtered.filter(o => o.status === 'cancelled').length;

  // Revenue by payment method
  const byMethod: Record<string, number> = {};
  paid.forEach(o => {
    const m = o.payment_method === 'pix' ? 'Pix' : 'Cartão';
    byMethod[m] = (byMethod[m] || 0) + Number(o.total);
  });

  // Revenue by month (last 6 months)
  const monthRevenue: Record<string, number> = {};
  paid.forEach(o => {
    const d = new Date(o.created_at);
    const key = `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
    monthRevenue[key] = (monthRevenue[key] || 0) + Number(o.total);
  });
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
  });
  const maxMonthRev = Math.max(...last6.map(k => monthRevenue[k] || 0), 1);

  const exportCSV = () => {
    const rows = [['Pedido', 'Cliente', 'Total', 'Pagamento', 'Status', 'Data']];
    filtered.forEach(o => rows.push([
      o.order_number, o.customer_name,
      Number(o.total).toFixed(2).replace('.', ','),
      o.payment_method === 'pix' ? 'Pix' : 'Cartão',
      o.status, new Date(o.created_at).toLocaleDateString('pt-BR')
    ]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `relatorio-${period}d.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Relatórios</h2>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral de vendas e pedidos</p>
        </div>
        <div className="flex items-center gap-2">
          {(['30', '90', '365'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${period === p ? 'bg-amber-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {p === '30' ? '30 dias' : p === '90' ? '3 meses' : '1 ano'}
            </button>
          ))}
          <button onClick={exportCSV} className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 border-4 border-amber-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Receita (pagos)', value: fmt(revenue), icon: DollarSign, color: 'bg-green-500', sub: `${paid.length} pedido${paid.length !== 1 ? 's' : ''} pago${paid.length !== 1 ? 's' : ''}` },
              { label: 'Ticket Médio', value: fmt(avgTicket), icon: TrendingUp, color: 'bg-blue-500', sub: 'por pedido pago' },
              { label: 'Total de Pedidos', value: String(filtered.length), icon: ShoppingCart, color: 'bg-amber-500', sub: `${pending} pendente${pending !== 1 ? 's' : ''}` },
              { label: 'Cancelados', value: String(cancelled), icon: Package, color: 'bg-red-400', sub: filtered.length > 0 ? `${((cancelled / filtered.length) * 100).toFixed(1)}% do total` : '—' },
            ].map(({ label, value, icon: Icon, color, sub }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{label}</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                  </div>
                  <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar chart - receita mensal */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">Receita por mês (últimos 6 meses)</h3>
              {maxMonthRev === 1 ? (
                <p className="text-gray-400 text-sm text-center py-6">Nenhum pedido pago ainda</p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {last6.map(key => {
                    const val = monthRevenue[key] || 0;
                    const h = Math.round((val / maxMonthRev) * 100);
                    return (
                      <div key={key} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-gray-500">{val > 0 ? fmt(val).replace('R$ ', 'R$') : ''}</span>
                        <div className="w-full bg-amber-500 rounded-t" style={{ height: `${Math.max(h, val > 0 ? 4 : 0)}%` }} />
                        <span className="text-[9px] text-gray-500 whitespace-nowrap">{key}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment method breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">Forma de pagamento</h3>
              {Object.keys(byMethod).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Nenhum pedido pago ainda</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(byMethod).map(([method, val]) => {
                    const pct = revenue > 0 ? (val / revenue) * 100 : 0;
                    return (
                      <div key={method}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{method}</span>
                          <span className="text-gray-500">{fmt(val)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent orders table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Pedidos no período ({filtered.length})</h3>
            </div>
            {filtered.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum pedido neste período</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Pedido</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Pagamento</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.slice(0, 20).map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-700">#{o.order_number}</td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{o.customer_name}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{fmt(Number(o.total))}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : o.payment_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {o.payment_status === 'paid' ? 'Pago' : o.payment_status === 'failed' ? 'Falhou' : 'Aguardando'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {new Date(o.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
