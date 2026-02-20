import React, { useState, useEffect, createContext, useContext } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { CartProvider } from '../contexts/CartContext';
import {
  User, Package, LogOut, Eye, EyeOff, Mail, Lock, Phone,
  ChevronRight, Clock, CheckCircle, Truck, XCircle, AlertCircle,
  ShoppingBag, MapPin, Edit2, Save
} from 'lucide-react';

// ===== CONTEXTO DO CLIENTE =====
interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  token: string;
}

interface CustomerAuthContextType {
  user: CustomerUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType>({} as CustomerAuthContextType);

function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}

function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('oticas_customer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.token && parsed.exp > Date.now()) {
          setUser(parsed);
        } else {
          localStorage.removeItem('oticas_customer');
        }
      } catch { localStorage.removeItem('oticas_customer'); }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/customer?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao fazer login');
    const userData = { ...data.user, token: data.token, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
    setUser(userData);
    localStorage.setItem('oticas_customer', JSON.stringify(userData));
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await fetch('/api/customer?action=register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao criar conta');
    const userData = { ...data.user, token: data.token, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
    setUser(userData);
    localStorage.setItem('oticas_customer', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('oticas_customer');
  };

  return (
    <CustomerAuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

// ===== COMPONENTE DE LOGIN/CADASTRO =====
function AuthForm() {
  const { login, register } = useCustomerAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('Informe seu nome completo');
        if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres');
        await register(name, email, password, phone);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Entrar na minha conta' : 'Criar minha conta'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login' ? 'Acesse seus pedidos e histórico de compras' : 'Cadastre-se para acompanhar seus pedidos'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-sm"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone (opcional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(94) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gold text-white rounded-xl font-semibold hover:bg-gold/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                mode === 'login' ? 'Entrar' : 'Criar Conta'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <a href="/" className="text-gold hover:underline">← Voltar para a loja</a>
        </p>
      </div>
    </div>
  );
}

// ===== STATUS DOS PEDIDOS =====
const ORDER_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Aguardando confirmação', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: 'Confirmado', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <CheckCircle className="w-4 h-4" /> },
  processing: { label: 'Em preparação', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <Package className="w-4 h-4" /> },
  shipped: { label: 'Enviado', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Entregue', color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelado', color: 'text-red-600 bg-red-50 border-red-200', icon: <XCircle className="w-4 h-4" /> },
};

// ===== PAINEL DO CLIENTE =====
function CustomerDashboard() {
  const { user, logout } = useCustomerAuth();
  const [tab, setTab] = useState<'orders' | 'profile'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');

  useEffect(() => {
    if (!user?.token) return;
    fetch('/api/customer?action=orders', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => r.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : data.orders || []);
        setLoadingOrders(false);
      })
      .catch(() => setLoadingOrders(false));
  }, [user]);

  const tabs = [
    { id: 'orders', label: 'Meus Pedidos', icon: <Package className="w-4 h-4" /> },
    { id: 'profile', label: 'Meu Perfil', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da área do cliente */}
      <div className="bg-gray-main text-white py-8 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center text-white font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-gray-400">Bem-vindo(a) de volta,</p>
              <h1 className="font-bold text-lg">{user?.name}</h1>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs de navegação */}
        <div className="flex gap-2 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-gold text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Aba: Meus Pedidos */}
        {tab === 'orders' && (
          <div>
            {loadingOrders ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-32 animate-pulse border border-gray-100" />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum pedido ainda</h2>
                <p className="text-gray-500 mb-6">Você ainda não realizou nenhum pedido. Que tal explorar nossos produtos?</p>
                <a href="/" className="inline-block bg-gold text-white px-6 py-3 rounded-full font-semibold hover:bg-gold/90 transition-colors">
                  Ver Produtos
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => {
                  const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
                  return (
                    <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Pedido #{order.order_number || order.id?.slice(0,8).toUpperCase()}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="border-t border-gray-50 pt-3 mb-3">
                          {order.items.slice(0, 2).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 py-1.5">
                              {item.image_url && (
                                <img src={item.image_url} alt={item.product_name} className="w-10 h-10 object-contain bg-gray-50 rounded-lg" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                                <p className="text-xs text-gray-500">{item.quantity}x {Number(item.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-gray-400 mt-1">+{order.items.length - 2} item(s)</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div>
                          <p className="text-xs text-gray-400">Total</p>
                          <p className="font-bold text-gray-900">{Number(order.total_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        {order.tracking_code && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Código de rastreio</p>
                            <p className="text-sm font-mono font-semibold text-gold">{order.tracking_code}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Aba: Meu Perfil */}
        {tab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Meus Dados</h2>
              <button
                onClick={() => setEditProfile(!editProfile)}
                className="flex items-center gap-1.5 text-sm text-gold hover:text-gold/80 font-medium transition-colors"
              >
                {editProfile ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {editProfile ? 'Salvar' : 'Editar'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Nome completo</label>
                {editProfile ? (
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-sm"
                  />
                ) : (
                  <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-xl">{user?.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">E-mail</label>
                <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-xl flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user?.email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Telefone</label>
                {editProfile ? (
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    placeholder="(94) 99999-9999"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-sm"
                  />
                ) : (
                  <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-xl flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {user?.phone || 'Não informado'}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair da minha conta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== PÁGINA PRINCIPAL =====
function CustomerAreaContent() {
  const { user, loading } = useCustomerAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <CustomerDashboard /> : <AuthForm />;
}

export default function CustomerArea() {
  return (
    <CartProvider>
      <CustomerAuthProvider>
        <div className="min-h-screen bg-white font-sans text-gray-main selection:bg-gold selection:text-white">
          <Header />
          <main>
            <CustomerAreaContent />
          </main>
          <Footer />
          <CartDrawer />
        </div>
      </CustomerAuthProvider>
    </CartProvider>
  );
}
