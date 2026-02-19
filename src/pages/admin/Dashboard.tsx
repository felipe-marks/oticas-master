import React, { useEffect, useState } from 'react';
import {
  DollarSign, ShoppingCart, Package, Users,
  TrendingUp, TrendingDown, AlertTriangle, Calendar, Mail
} from 'lucide-react';

interface DashboardData {
  revenue: { this_month: number; last_month: number; growth_percent: number; orders_count: number };
  orders: { pending: number; this_month: number };
  products: { total: number; low_stock: number; low_stock_items: any[] };
  customers: { total: number; new_this_month: number };
  newsletter: { total: number };
  appointments: { pending: number };
  recent_orders: any[];
}

function StatCard({ title, value, subtitle, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}% em relação ao mês anterior
        </div>
      )}
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente', confirmed: 'Confirmado', processing: 'Em preparo',
  shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado',
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('admin_session') || '{}');
    fetch('/api/admin?resource=dashboard', {
      headers: { Authorization: `Bearer ${session.token}` }
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return <div className="text-center text-gray-500 py-12">Erro ao carregar dados</div>;

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Receita do Mês"
          value={formatCurrency(data.revenue.this_month)}
          subtitle={`${data.revenue.orders_count} pedidos pagos`}
          icon={DollarSign}
          color="bg-green-500"
          trend={data.revenue.growth_percent}
        />
        <StatCard
          title="Pedidos Pendentes"
          value={data.orders.pending}
          subtitle={`${data.orders.this_month} pedidos este mês`}
          icon={ShoppingCart}
          color="bg-amber-500"
        />
        <StatCard
          title="Produtos Ativos"
          value={data.products.total}
          subtitle={data.products.low_stock > 0 ? `⚠ ${data.products.low_stock} com estoque baixo` : 'Estoque OK'}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="Clientes"
          value={data.customers.total}
          subtitle={`+${data.customers.new_this_month} novos este mês`}
          icon={Users}
          color="bg-purple-500"
        />
      </div>

      {/* Segunda linha */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Newsletter"
          value={data.newsletter.total}
          subtitle="Assinantes ativos"
          icon={Mail}
          color="bg-pink-500"
        />
        <StatCard
          title="Agendamentos"
          value={data.appointments.pending}
          subtitle="Aguardando confirmação"
          icon={Calendar}
          color="bg-teal-500"
        />
        <StatCard
          title="Estoque Baixo"
          value={data.products.low_stock}
          subtitle="Produtos com menos de 5 unidades"
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Pedidos Recentes</h3>
          {data.recent_orders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhum pedido ainda</p>
          ) : (
            <div className="space-y-3">
              {data.recent_orders.map(order => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">#{order.order_number}</p>
                    <p className="text-xs text-gray-400">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(order.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produtos com estoque baixo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Alerta de Estoque Baixo</h3>
          {data.products.low_stock_items.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-400 text-sm">Todos os produtos com estoque OK</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.products.low_stock_items.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm text-gray-700 truncate flex-1 mr-2">{p.name}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${p.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.stock_quantity === 0 ? 'Sem estoque' : `${p.stock_quantity} un.`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
