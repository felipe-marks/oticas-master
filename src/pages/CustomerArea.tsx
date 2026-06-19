import { useState, useEffect, createContext, useContext } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { CartProvider } from '../contexts/CartContext';
import {
  User, Package, LogOut, Eye, EyeOff, Mail, Lock,
  Heart, MapPin, CreditCard, Shield, RotateCcw,
  AlertCircle, Edit2, Save, X, ChevronRight, Clock,
  CheckCircle, Truck, XCircle, ShoppingBag, Phone,
  Calendar, Users, FileText
} from 'lucide-react';

// ===== CONTEXTO DO CLIENTE =====
interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  token: string;
  exp: number;
}

interface CustomerAuthContextType {
  user: CustomerUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType>({} as CustomerAuthContextType);

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
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

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/customer?action=register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
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

// ===== FORMULÁRIO DE LOGIN/CADASTRO =====
function AuthForm() {
  const { login, register } = useCustomerAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('Informe seu nome completo');
        if (passwordStrength < 4) throw new Error('A senha não atende aos requisitos de segurança.');
        await register(name, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4 py-12">
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
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Entrar
            </button>
            <button onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Seu nome completo" required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-sm" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Ex: Senha@123' : 'Sua senha'} required
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-sm" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && password.length > 0 && (
              <div className="space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-2">Requisitos da senha:</p>
                {[
                  { check: passwordChecks.length, label: 'Mínimo 8 caracteres' },
                  { check: passwordChecks.upper, label: 'Pelo menos uma letra maiúscula' },
                  { check: passwordChecks.number, label: 'Pelo menos um número' },
                  { check: passwordChecks.symbol, label: 'Pelo menos um símbolo (!@#$%...)' },
                ].map(({ check, label }) => (
                  <div key={label} className={`flex items-center gap-2 text-xs ${check ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${check ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                      {check ? '✓' : '○'}
                    </span>
                    {label}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-gold text-white font-semibold rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ===== SEÇÃO: MEUS DADOS =====
function MeusDados({ user }: { user: CustomerUser }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [cpf, setCpf] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Buscar perfil completo do banco ao montar
  useEffect(() => {
    fetch('/api/customer?action=profile', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setName(data.name || '');
          setPhone(data.phone || '');
          setCpf(data.cpf || '');
          setGender(data.gender || '');
          setBirthdate(data.birthdate || '');
          setNewsletter(data.newsletter || false);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [user.token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/customer?action=profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ name, phone, cpf, gender, birthdate, newsletter }),
      });
      if (res.ok) {
        setSuccess(true);
        setEditing(false);
        setTimeout(() => setSuccess(false), 3000);
        const saved = localStorage.getItem('oticas_customer');
        if (saved) {
          const parsed = JSON.parse(saved);
          localStorage.setItem('oticas_customer', JSON.stringify({ ...parsed, name, phone }));
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const firstName = name.split(' ')[0] || '';
  const lastName = name.split(' ').slice(1).join(' ') || '';

  if (loadingProfile) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Meus Dados</h2>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Edit2 className="w-4 h-4" /> Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-60">
              <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle className="w-4 h-4" /> Dados salvos com sucesso!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Seu nome</label>
          {editing ? (
            <input type="text" value={firstName} onChange={e => setName(`${e.target.value} ${lastName}`.trim())}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
          ) : (
            <p className="text-sm text-gray-800 py-2.5 border-b border-gray-100">{firstName || '—'}</p>
          )}
        </div>

        {/* Sobrenome */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Sobrenome</label>
          {editing ? (
            <input type="text" value={lastName} onChange={e => setName(`${firstName} ${e.target.value}`.trim())}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
          ) : (
            <p className="text-sm text-gray-800 py-2.5 border-b border-gray-100">{lastName || '—'}</p>
          )}
        </div>

        {/* Email */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">E-mail</label>
          <p className="text-sm text-gray-800 py-2.5 border-b border-gray-100">{user.email}</p>
        </div>

        {/* CPF */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">CPF</label>
          {editing ? (
            <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
          ) : (
            <p className="text-sm text-gray-800 py-2.5 border-b border-gray-100">{cpf || '—'}</p>
          )}
        </div>

        {/* Gênero */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Gênero</label>
          {editing ? (
            <select value={gender} onChange={e => setGender(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold">
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Prefiro não informar</option>
            </select>
          ) : (
            <p className="text-sm text-gray-800 py-2.5 border-b border-gray-100">
              {gender === 'M' ? 'Masculino' : gender === 'F' ? 'Feminino' : gender === 'O' ? 'Prefiro não informar' : '—'}
            </p>
          )}
        </div>

        {/* Nascimento */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Nascimento</label>
          {editing ? (
            <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
          ) : (
            <p className="text-sm text-gray-800 py-2.5 border-b border-gray-100">{birthdate || '—'}</p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Telefone</label>
          {editing ? (
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(94) 99999-9999"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
          ) : (
            <p className="text-sm text-gray-800 py-2.5 border-b border-gray-100">{phone || '—'}</p>
          )}
        </div>
      </div>

      {/* Newsletter */}
      <div className="mt-8 p-4 border border-gray-200 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Newsletter</h3>
        <p className="text-xs text-gray-500 mb-3">Você quer receber e-mails com promoções e novidades da Óticas Master?</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} className="mt-0.5 w-4 h-4 accent-gold rounded" />
          <span className="text-xs text-gray-600">Aceito receber comunicações promocionais e de marketing da Óticas Master. Você pode cancelar a qualquer momento.</span>
        </label>
      </div>
    </div>
  );
}

// ===== SEÇÃO: MEUS PEDIDOS =====
function MeusPedidos({ user }: { user: CustomerUser }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer?action=orders', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.token]);

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Aguardando', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: Clock },
    confirmed: { label: 'Confirmado', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: CheckCircle },
    preparing: { label: 'Em Preparo', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: Package },
    shipped: { label: 'Enviado', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: Truck },
    delivered: { label: 'Entregue', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Meus Pedidos</h2>
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Você ainda não fez nenhum pedido</p>
          <p className="text-gray-400 text-sm mt-1">Explore nosso catálogo e encontre o óculos perfeito!</p>
          <a href="/" className="inline-block mt-4 px-6 py-2.5 bg-gold text-white rounded-xl text-sm font-semibold hover:bg-gold/90 transition-colors">Ver Produtos</a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <div key={order.id} className="border border-gray-200 rounded-xl p-4 hover:border-gold/40 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Pedido #{order.order_number || order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" /> {status.label}
                  </span>
                </div>
                {order.items?.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.image_url && <img src={item.image_url} alt={item.product_name} className="w-12 h-12 object-cover rounded-lg border border-gray-100" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{item.product_name}</p>
                          <p className="text-xs text-gray-500">{item.quantity}x — R$ {Number(item.unit_price).toFixed(2).replace('.', ',')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-900">Total: R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}</p>
                  {order.tracking_code && (
                    <p className="text-xs text-gray-500">Rastreio: <span className="font-mono font-semibold text-gray-700">{order.tracking_code}</span></p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== SEÇÃO: FAVORITOS =====
function Favoritos({ user }: { user: CustomerUser }) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer?action=favorites', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(data => { setFavorites(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.token]);

  const handleRemove = async (productId: string) => {
    try {
      await fetch('/api/customer?action=favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ product_id: productId }),
      });
      setFavorites(prev => prev.filter(f => f.product_id !== productId));
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Favoritos</h2>
      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Você ainda não tem favoritos</p>
          <p className="text-gray-400 text-sm mt-1">Clique no coração nos produtos para salvá-los aqui</p>
          <a href="/" className="inline-block mt-4 px-6 py-2.5 bg-gold text-white rounded-xl text-sm font-semibold hover:bg-gold/90 transition-colors">Explorar Produtos</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favorites.map(fav => (
            <div key={fav.id} className="border border-gray-200 rounded-xl p-4 flex gap-4 hover:border-gold/40 transition-colors">
              {fav.product_image && <img src={fav.product_image} alt={fav.product_name} className="w-20 h-20 object-cover rounded-lg border border-gray-100" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{fav.product_name || 'Produto'}</p>
                {fav.product_price && <p className="text-sm text-gold font-bold mt-1">R$ {Number(fav.product_price).toFixed(2).replace('.', ',')}</p>}
                <div className="flex gap-2 mt-2">
                  {fav.product_slug && <a href={`/produto/${fav.product_slug}`} className="text-xs text-gold hover:underline">Ver produto</a>}
                  <button onClick={() => handleRemove(fav.product_id)} className="text-xs text-red-500 hover:underline">Remover</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== SEÇÃO: ENDEREÇOS =====
function Enderecos({ user }: { user: CustomerUser }) {
  const [adding, setAdding] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetch('/api/customer?action=addresses', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(data => { setAddresses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.token]);

  const buscarCep = async (valor: string) => {
    const cleanCep = valor.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setLoadingCep(true);
    setCepError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) { setCepError('CEP não encontrado'); return; }
      setRua(data.logradouro || '');
      setBairro(data.bairro || '');
      setCidade(data.localidade || '');
      setEstado(data.uf || '');
    } catch { setCepError('Erro ao buscar CEP'); }
    finally { setLoadingCep(false); }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setCep(valor);
    const cleanCep = valor.replace(/\D/g, '');
    if (cleanCep.length === 8) buscarCep(valor);
  };

  const handleSaveAddress = async () => {
    if (!cep || !rua || !numero || !cidade) {
      setSaveError('Preencha CEP, rua, número e cidade.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/customer?action=addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ cep, rua, numero, complemento, bairro, cidade, estado }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddresses(prev => [data, ...prev]);
        setAdding(false);
        setCep(''); setRua(''); setNumero(''); setComplemento(''); setBairro(''); setCidade(''); setEstado('');
      } else {
        setSaveError(data.message || `Erro ao salvar endereço (${res.status})`);
      }
    } catch (err: any) {
      setSaveError('Erro de conexão. Tente novamente.');
    } finally { setSaving(false); }
  };

  const handleRemove = async (id: string) => {
    try {
      await fetch('/api/customer?action=addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ id }),
      });
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Endereços</h2>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors">
            + Adicionar Endereço
          </button>
        )}
      </div>

      {addresses.length > 0 && (
        <div className="space-y-3 mb-6">
          {addresses.map(addr => (
            <div key={addr.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-xl hover:border-gold/40 transition-colors">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{addr.rua}, {addr.numero}{addr.complemento ? `, ${addr.complemento}` : ''}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{addr.bairro} — {addr.cidade}/{addr.estado}</p>
                  <p className="text-xs text-gray-400 mt-0.5">CEP: {addr.cep}</p>
                </div>
              </div>
              <button onClick={() => handleRemove(addr.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!adding && addresses.length === 0 && (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhum endereço cadastrado</p>
          <p className="text-gray-400 text-sm mt-1">Adicione um endereço para facilitar suas compras</p>
        </div>
      )}

      {adding && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Novo Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CEP *</label>
              <div className="relative">
                <input type="text" value={cep} onChange={handleCepChange}
                  placeholder="00000-000" maxLength={9}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
                {loadingCep && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Buscando...</span>}
              </div>
              {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Rua *</label>
              <input type="text" value={rua} onChange={e => setRua(e.target.value)} placeholder="Nome da rua"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Número *</label>
              <input type="text" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Ex: 123"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
              <input type="text" value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Apto, Bloco..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
              <input type="text" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cidade *</label>
              <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
              <input type="text" value={estado} onChange={e => setEstado(e.target.value)} placeholder="UF" maxLength={2}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
            </div>
          </div>
          {saveError && <p className="text-sm text-red-600 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">{saveError}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setAdding(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
            <button onClick={handleSaveAddress} disabled={!cep || !rua || !numero || !cidade || saving}
              className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Salvando...' : 'Salvar Endereço'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== SEÇÃO: CARTÕES =====
function Cartoes({ user }: { user: CustomerUser }) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardBrand, setCardBrand] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');

  useEffect(() => {
    fetch('/api/customer?action=cards', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(data => { setCards(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.token]);

  const handleSaveCard = async () => {
    if (!cardBrand || !lastFour || !holderName) return;
    setSaving(true);
    try {
      const res = await fetch('/api/customer?action=cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ card_brand: cardBrand, last_four: lastFour, holder_name: holderName, expiry_month: expiryMonth ? parseInt(expiryMonth) : null, expiry_year: expiryYear ? parseInt(expiryYear) : null }),
      });
      const data = await res.json();
      if (res.ok) {
        setCards(prev => [data, ...prev]);
        setAdding(false);
        setCardBrand(''); setLastFour(''); setHolderName(''); setExpiryMonth(''); setExpiryYear('');
      }
    } catch {}
    finally { setSaving(false); }
  };

  const handleRemove = async (id: string) => {
    try {
      await fetch('/api/customer?action=cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ id }),
      });
      setCards(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  const brandIcons: Record<string, string> = { visa: 'VISA', mastercard: 'MC', elo: 'ELO', amex: 'AMEX', hipercard: 'HIPER' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Cartões</h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors">
            + Adicionar Cartão
          </button>
        )}
      </div>

      {adding && (
        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Novo Cartão</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bandeira *</label>
              <select value={cardBrand} onChange={e => setCardBrand(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold">
                <option value="">Selecione</option>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="elo">Elo</option>
                <option value="amex">American Express</option>
                <option value="hipercard">Hipercard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Últimos 4 dígitos *</label>
              <input type="text" value={lastFour} onChange={e => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome no cartão *</label>
              <input type="text" value={holderName} onChange={e => setHolderName(e.target.value.toUpperCase())} placeholder="NOME COMO IMPRESSO NO CARTÃO"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mês de validade</label>
              <input type="number" value={expiryMonth} onChange={e => setExpiryMonth(e.target.value)} placeholder="MM" min={1} max={12}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ano de validade</label>
              <input type="number" value={expiryYear} onChange={e => setExpiryYear(e.target.value)} placeholder="AAAA" min={2024} max={2040}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setAdding(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
            <button onClick={handleSaveCard} disabled={!cardBrand || !lastFour || !holderName || saving}
              className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Salvando...' : 'Salvar Cartão'}</button>
          </div>
        </div>
      )}

      {cards.length === 0 && !adding ? (
        <div className="text-center py-16">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhum cartão cadastrado</p>
          <p className="text-gray-400 text-sm mt-1">Seus cartões salvos aparecerão aqui para compras mais rápidas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(card => (
            <div key={card.id} className="flex items-center justify-between border border-gray-200 rounded-xl p-4 hover:border-gold/40 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                  {brandIcons[card.card_brand] || card.card_brand?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {card.card_brand?.charAt(0).toUpperCase() + card.card_brand?.slice(1)} **** {card.last_four}
                  </p>
                  <p className="text-xs text-gray-500">{card.holder_name}{card.expiry_month && card.expiry_year ? ` • ${String(card.expiry_month).padStart(2, '0')}/${card.expiry_year}` : ''}</p>
                </div>
              </div>
              <button onClick={() => handleRemove(card.id)} className="text-xs text-red-500 hover:underline">Remover</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== SEÇÃO: MEU ACESSO =====
function MeuAcesso({ user }: { user: CustomerUser }) {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordChecks = {
    length: newPass.length >= 8,
    upper: /[A-Z]/.test(newPass),
    number: /[0-9]/.test(newPass),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPass),
  };
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (passwordStrength < 4) { setError('A nova senha não atende aos requisitos de segurança.'); return; }
    if (newPass !== confirmPass) { setError('As senhas não coincidem.'); return; }
    try {
      const res = await fetch('/api/customer?action=change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao alterar senha');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha. Tente novamente.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Meu Acesso</h2>
      <div className="max-w-md">
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">E-mail de acesso</p>
          <p className="text-sm font-semibold text-gray-800">{user.email}</p>
        </div>

        <h3 className="font-semibold text-gray-800 mb-4">Alterar Senha</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha atual</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showCurrent ? 'text' : 'password'} value={currentPass} onChange={e => setCurrentPass(e.target.value)}
                placeholder="Sua senha atual" required
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                placeholder="Ex: NovaSenha@123" required
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPass.length > 0 && (
              <div className="mt-2 space-y-1">
                {[
                  { check: passwordChecks.length, label: '8+ caracteres' },
                  { check: passwordChecks.upper, label: 'Maiúscula' },
                  { check: passwordChecks.number, label: 'Número' },
                  { check: passwordChecks.symbol, label: 'Símbolo' },
                ].map(({ check, label }) => (
                  <span key={label} className={`inline-flex items-center gap-1 mr-2 text-xs ${check ? 'text-green-600' : 'text-gray-400'}`}>
                    {check ? '✓' : '○'} {label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                placeholder="Repita a nova senha" required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold" />
            </div>
          </div>
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"><AlertCircle className="w-4 h-4" />{error}</div>}
          {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700"><CheckCircle className="w-4 h-4" />Senha alterada com sucesso!</div>}
          <button type="submit" className="w-full py-3 bg-gold text-white font-semibold rounded-xl hover:bg-gold/90 transition-colors">Alterar Senha</button>
        </form>
      </div>
    </div>
  );
}

// ===== SEÇÃO: DEVOLUÇÕES =====
function Devolucoes() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Devoluções</h2>
      <div className="text-center py-16">
        <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Nenhuma devolução solicitada</p>
        <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
          Caso precise devolver um produto, entre em contato conosco pelo WhatsApp ou acesse "Meus Pedidos" e solicite a devolução.
        </p>
        <a href="https://wa.me/5594981796065" target="_blank" rel="noopener noreferrer"
          className="inline-block mt-4 px-6 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
          Falar no WhatsApp
        </a>
      </div>
    </div>
  );
}

// ===== ÁREA DO CLIENTE LOGADO =====
function CustomerDashboard({ user }: { user: CustomerUser }) {
  const { logout } = useCustomerAuth();
  const [activeSection, setActiveSection] = useState('dados');

  const menuItems = [
    { id: 'dados', label: 'Meus Dados', icon: User },
    { id: 'favoritos', label: 'Favoritos', icon: Heart },
    { id: 'enderecos', label: 'Endereços', icon: MapPin },
    { id: 'pedidos', label: 'Meus Pedidos', icon: Package },
    { id: 'cartoes', label: 'Cartões', icon: CreditCard },
    { id: 'acesso', label: 'Meu Acesso', icon: Shield },
    { id: 'devolucoes', label: 'Devoluções', icon: RotateCcw },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'dados': return <MeusDados user={user} />;
      case 'favoritos': return <Favoritos user={user} />;
      case 'enderecos': return <Enderecos user={user} />;
      case 'pedidos': return <MeusPedidos user={user} />;
      case 'cartoes': return <Cartoes user={user} />;
      case 'acesso': return <MeuAcesso user={user} />;
      case 'devolucoes': return <Devolucoes />;
      default: return <MeusDados user={user} />;
    }
  };

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-gold" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Olá,</p>
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <nav className="divide-y divide-gray-50">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left ${
                        activeSection === item.id
                          ? 'bg-gold/5 text-gold border-l-2 border-gold'
                          : 'text-gray-700 hover:bg-gray-50 border-l-2 border-transparent'
                      }`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
                <button onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border-l-2 border-transparent text-left">
                  <LogOut className="w-4 h-4 shrink-0" />
                  Sair da Conta
                </button>
              </nav>
            </div>
          </aside>

          {/* Conteúdo principal */}
          <main className="flex-1 bg-white rounded-2xl border border-gray-100 p-6">
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  );
}

// ===== PÁGINA PRINCIPAL =====
export default function CustomerArea() {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <CartDrawer />
          <div className="flex-1">
            <CustomerAreaContent />
          </div>
          <Footer />
        </div>
      </CartProvider>
    </CustomerAuthProvider>
  );
}

function CustomerAreaContent() {
  const { user, loading } = useCustomerAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <CustomerDashboard user={user} /> : <AuthForm />;
}
