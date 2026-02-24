import React, { useState, useEffect } from 'react';
import {
  X, CreditCard, QrCode, ChevronRight, ChevronLeft,
  Lock, CheckCircle, AlertCircle, Loader2, Copy, Check,
  MapPin, User, Phone, Mail, FileText, ShoppingBag,
  Truck, Tag
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToken?: string;
}

type PaymentMethod = 'credit_card' | 'pix';
type Step = 'customer' | 'shipping' | 'payment' | 'confirmation';

interface CustomerData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

interface ShippingAddress {
  zip: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CardData {
  number: string;
  holder_name: string;
  exp_month: string;
  exp_year: string;
  security_code: string;
  installments: number;
}

function formatCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhone(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatCard(v: string) {
  return v.replace(/\D/g, '').slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatZip(v: string) {
  return v.replace(/\D/g, '').slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CheckoutModal({ isOpen, onClose, userToken }: CheckoutModalProps) {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState<Step>('customer');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [customer, setCustomer] = useState<CustomerData>({
    name: '', email: '', cpf: '', phone: '',
  });
  const [address, setAddress] = useState<ShippingAddress>({
    zip: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '',
  });
  const [card, setCard] = useState<CardData>({
    number: '', holder_name: '', exp_month: '', exp_year: '',
    security_code: '', installments: 1,
  });

  const [orderResult, setOrderResult] = useState<any>(null);
  const [loadingCep, setLoadingCep] = useState(false);

  const pixTotal = items.reduce((sum, i) => sum + (i.price_pix ?? i.price * 0.95) * i.quantity, 0);
  const shipping = subtotal >= 300 ? 0 : 25;
  const total = paymentMethod === 'pix' ? pixTotal + shipping : subtotal + shipping;

  // Carregar dados do cliente logado
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('oticas_customer');
      if (saved) {
        try {
          const u = JSON.parse(saved);
          setCustomer(prev => ({
            ...prev,
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
          }));
        } catch {}
      }
    }
  }, [isOpen]);

  // Buscar endereço pelo CEP
  const fetchCep = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        }));
      }
    } catch {} finally {
      setLoadingCep(false);
    }
  };

  const handleCepBlur = () => fetchCep(address.zip);

  const validateCustomer = () => {
    if (!customer.name.trim()) return 'Nome é obrigatório';
    if (!customer.email.includes('@')) return 'E-mail inválido';
    if (customer.cpf.replace(/\D/g, '').length !== 11) return 'CPF inválido';
    if (customer.phone.replace(/\D/g, '').length < 10) return 'Telefone inválido';
    return '';
  };

  const validateAddress = () => {
    if (address.zip.replace(/\D/g, '').length !== 8) return 'CEP inválido';
    if (!address.street.trim()) return 'Rua é obrigatória';
    if (!address.number.trim()) return 'Número é obrigatório';
    if (!address.city.trim()) return 'Cidade é obrigatória';
    if (!address.state.trim()) return 'Estado é obrigatório';
    return '';
  };

  const validateCard = () => {
    if (card.number.replace(/\s/g, '').length !== 16) return 'Número do cartão inválido';
    if (!card.holder_name.trim()) return 'Nome no cartão é obrigatório';
    if (!card.exp_month || !card.exp_year) return 'Data de validade inválida';
    if (card.security_code.length < 3) return 'CVV inválido';
    return '';
  };

  const goToStep = (next: Step) => {
    setError('');
    if (next === 'shipping') {
      const err = validateCustomer();
      if (err) { setError(err); return; }
    }
    if (next === 'payment') {
      const err = validateAddress();
      if (err) { setError(err); return; }
    }
    setStep(next);
  };

  const handleSubmitOrder = async () => {
    if (paymentMethod === 'credit_card') {
      const err = validateCard();
      if (err) { setError(err); return; }
    }

    setLoading(true);
    setError('');

    try {
      // 1. Criar pedido no PagBank
      const orderRes = await fetch('/api/payment?action=create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken || ''}`,
        },
        body: JSON.stringify({
          items: items.map(i => ({
            id: i.id,
            name: i.name,
            sku: i.sku,
            price: paymentMethod === 'pix' ? (i.price_pix ?? i.price * 0.95) : i.price,
            quantity: i.quantity,
          })),
          customer,
          shipping_address: address,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Erro ao criar pedido');
      }

      // 2. Se cartão, processar pagamento
      if (paymentMethod === 'credit_card' && orderData.pagbank_charge_id) {
        const payRes = await fetch('/api/payment?action=pay-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken || ''}`,
          },
          body: JSON.stringify({
            pagbank_charge_id: orderData.pagbank_charge_id,
            card: {
              number: card.number.replace(/\s/g, ''),
              holder_name: card.holder_name,
              exp_month: card.exp_month,
              exp_year: card.exp_year,
              security_code: card.security_code,
            },
            installments: card.installments,
          }),
        });

        const payData = await payRes.json();
        if (!payRes.ok) {
          throw new Error(payData.message || 'Pagamento recusado. Verifique os dados do cartão.');
        }
        orderData.card_status = payData.status;
      }

      setOrderResult(orderData);
      setStep('confirmation');
      clearCart();

    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const copyPix = async () => {
    if (orderResult?.pix?.qr_code) {
      await navigator.clipboard.writeText(orderResult.pix.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!isOpen) return null;

  const steps: { id: Step; label: string }[] = [
    { id: 'customer', label: 'Dados' },
    { id: 'shipping', label: 'Entrega' },
    { id: 'payment', label: 'Pagamento' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-green-600" />
            <h2 className="font-bold text-gray-900 text-base">Checkout Seguro</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator (apenas nas etapas antes da confirmação) */}
        {step !== 'confirmation' && (
          <div className="flex items-center px-5 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
            {steps.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s.id ? 'bg-gold text-white' :
                    steps.indexOf(steps.find(x => x.id === step)!) > idx ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {steps.indexOf(steps.find(x => x.id === step)!) > idx ? <Check className="w-3 h-3" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step === s.id ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
                    steps.indexOf(steps.find(x => x.id === step)!) > idx ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── STEP: DADOS DO CLIENTE ── */}
          {step === 'customer' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-gold" /> Seus Dados
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Nome completo *</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                      placeholder="Seu nome completo"
                      value={customer.name}
                      onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail *</label>
                    <input
                      type="email"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                      placeholder="seu@email.com"
                      value={customer.email}
                      onChange={e => setCustomer(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">CPF *</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                        placeholder="000.000.000-00"
                        value={customer.cpf}
                        onChange={e => setCustomer(p => ({ ...p, cpf: formatCPF(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Telefone *</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                        placeholder="(00) 00000-0000"
                        value={customer.phone}
                        onChange={e => setCustomer(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo do pedido */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> Resumo ({items.length} {items.length === 1 ? 'item' : 'itens'})
                </p>
                {items.slice(0, 3).map(item => (
                  <div key={item.id} className="flex justify-between text-xs text-gray-600 py-0.5">
                    <span className="truncate mr-2">{item.quantity}x {item.name}</span>
                    <span className="shrink-0 font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                {items.length > 3 && <p className="text-xs text-gray-400 mt-1">+ {items.length - 3} outros itens</p>}
              </div>
            </div>
          )}

          {/* ── STEP: ENDEREÇO ── */}
          {step === 'shipping' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" /> Endereço de Entrega
              </h3>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">CEP *</label>
                <div className="relative">
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                    placeholder="00000-000"
                    value={address.zip}
                    onChange={e => setAddress(p => ({ ...p, zip: formatZip(e.target.value) }))}
                    onBlur={handleCepBlur}
                  />
                  {loadingCep && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-gold" />}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Rua *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                  placeholder="Nome da rua"
                  value={address.street}
                  onChange={e => setAddress(p => ({ ...p, street: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Número *</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                    placeholder="123"
                    value={address.number}
                    onChange={e => setAddress(p => ({ ...p, number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Complemento</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                    placeholder="Apto, Bloco..."
                    value={address.complement}
                    onChange={e => setAddress(p => ({ ...p, complement: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Bairro</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                  placeholder="Bairro"
                  value={address.neighborhood}
                  onChange={e => setAddress(p => ({ ...p, neighborhood: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Cidade *</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                    placeholder="Cidade"
                    value={address.city}
                    onChange={e => setAddress(p => ({ ...p, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">UF *</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                    placeholder="PA"
                    maxLength={2}
                    value={address.state}
                    onChange={e => setAddress(p => ({ ...p, state: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              {/* Frete */}
              <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${shipping === 0 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span className="font-medium">{shipping === 0 ? 'Frete Grátis!' : 'Frete'}</span>
                </div>
                <span className="font-bold">{shipping === 0 ? 'GRÁTIS' : formatCurrency(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400 text-center">Frete grátis em compras acima de R$ 300</p>
              )}
            </div>
          )}

          {/* ── STEP: PAGAMENTO ── */}
          {step === 'payment' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gold" /> Forma de Pagamento
              </h3>

              {/* Seleção do método */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'pix' ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <QrCode className={`w-6 h-6 ${paymentMethod === 'pix' ? 'text-gold' : 'text-gray-400'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-bold ${paymentMethod === 'pix' ? 'text-gray-900' : 'text-gray-500'}`}>PIX</p>
                    <p className="text-xs text-green-600 font-medium">5% OFF</p>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'credit_card' ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`w-6 h-6 ${paymentMethod === 'credit_card' ? 'text-gold' : 'text-gray-400'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-bold ${paymentMethod === 'credit_card' ? 'text-gray-900' : 'text-gray-500'}`}>Cartão</p>
                    <p className="text-xs text-gray-400">Até 12x</p>
                  </div>
                </button>
              </div>

              {/* Dados do cartão */}
              {paymentMethod === 'credit_card' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Número do Cartão *</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold font-mono tracking-wider"
                      placeholder="0000 0000 0000 0000"
                      value={card.number}
                      onChange={e => setCard(p => ({ ...p, number: formatCard(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Nome no Cartão *</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold uppercase"
                      placeholder="NOME COMO NO CARTÃO"
                      value={card.holder_name}
                      onChange={e => setCard(p => ({ ...p, holder_name: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Mês *</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                        placeholder="MM"
                        maxLength={2}
                        value={card.exp_month}
                        onChange={e => setCard(p => ({ ...p, exp_month: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Ano *</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                        placeholder="AAAA"
                        maxLength={4}
                        value={card.exp_year}
                        onChange={e => setCard(p => ({ ...p, exp_year: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">CVV *</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                        placeholder="123"
                        maxLength={4}
                        value={card.security_code}
                        onChange={e => setCard(p => ({ ...p, security_code: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Parcelas</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold bg-white"
                      value={card.installments}
                      onChange={e => setCard(p => ({ ...p, installments: Number(e.target.value) }))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <option key={n} value={n}>
                          {n}x de {formatCurrency((subtotal + shipping) / n)} {n === 1 ? '(sem juros)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Info PIX */}
              {paymentMethod === 'pix' && (
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <QrCode className="w-10 h-10 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-green-800">Pague com PIX e economize 5%!</p>
                  <p className="text-xs text-green-600 mt-1">
                    Após confirmar, você receberá o QR Code para pagamento instantâneo.
                  </p>
                </div>
              )}

              {/* Resumo do total */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {paymentMethod === 'pix' && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Desconto PIX (5%)</span>
                    <span>-{formatCurrency(subtotal - pixTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Frete</span>
                  <span>{shipping === 0 ? 'GRÁTIS' : formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: CONFIRMAÇÃO ── */}
          {step === 'confirmation' && orderResult && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Pedido Realizado!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Pedido <span className="font-semibold text-gray-700">#{orderResult.order_number}</span>
                </p>
              </div>

              {/* QR Code PIX */}
              {orderResult.pix && (
                <div className="bg-green-50 rounded-2xl p-4 text-left">
                  <p className="text-sm font-bold text-green-800 mb-3 text-center flex items-center justify-center gap-2">
                    <QrCode className="w-4 h-4" /> Pague com PIX
                  </p>
                  {orderResult.pix.qr_code_image && (
                    <div className="flex justify-center mb-3">
                      <img src={orderResult.pix.qr_code_image} alt="QR Code PIX" className="w-40 h-40 rounded-lg border border-green-200" />
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-2.5 border border-green-200">
                    <p className="text-xs text-gray-500 mb-1.5">Código PIX Copia e Cola:</p>
                    <p className="text-xs font-mono text-gray-700 break-all leading-relaxed line-clamp-3">
                      {orderResult.pix.qr_code}
                    </p>
                  </div>
                  <button
                    onClick={copyPix}
                    className={`w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      copied ? 'bg-green-600 text-white' : 'bg-green-700 text-white hover:bg-green-800'
                    }`}
                  >
                    {copied ? <><Check className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar Código PIX</>}
                  </button>
                  <p className="text-xs text-green-600 text-center mt-2">
                    Válido por 24 horas. Após o pagamento, seu pedido será processado automaticamente.
                  </p>
                </div>
              )}

              {/* Cartão aprovado */}
              {paymentMethod === 'credit_card' && orderResult.card_status === 'PAID' && (
                <div className="bg-green-50 rounded-xl p-4">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-green-800">Pagamento Aprovado!</p>
                  <p className="text-xs text-green-600 mt-1">Seu pedido está sendo processado.</p>
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-3 text-left">
                <p className="text-xs text-blue-700 font-medium mb-1">📧 Confirmação por e-mail</p>
                <p className="text-xs text-blue-600">
                  Você receberá um e-mail de confirmação em <strong>{customer.email}</strong> com os detalhes do pedido.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-gold text-white rounded-xl font-bold hover:bg-gold/90 transition-colors"
              >
                Continuar Comprando
              </button>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer com botões de navegação */}
        {step !== 'confirmation' && (
          <div className="border-t border-gray-100 px-5 py-4 bg-white shrink-0">
            <div className="flex gap-3">
              {step !== 'customer' && (
                <button
                  onClick={() => setStep(step === 'payment' ? 'shipping' : 'customer')}
                  className="flex items-center gap-1.5 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
              )}
              {step === 'customer' && (
                <button
                  onClick={() => goToStep('shipping')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold text-white rounded-xl font-bold hover:bg-gold/90 transition-colors"
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {step === 'shipping' && (
                <button
                  onClick={() => goToStep('payment')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold text-white rounded-xl font-bold hover:bg-gold/90 transition-colors"
                >
                  Escolher Pagamento <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {step === 'payment' && (
                <button
                  onClick={handleSubmitOrder}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Confirmar Pedido — {formatCurrency(total)}</>
                  )}
                </button>
              )}
            </div>
            <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Pagamento 100% seguro via PagBank
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
