import React, { useState } from 'react';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Digite um e-mail válido.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/public?action=newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Cadastrado com sucesso! Verifique seu e-mail.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Erro ao cadastrar. Tente novamente.');
      }
    } catch {
      setStatus('error');
      setMessage('Erro ao conectar. Tente novamente.');
    }
  };

  return (
    <section className="py-16 bg-beige-light relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#B8860B_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 border border-gold/20">
          <div className="bg-gold/10 p-4 rounded-full text-gold shrink-0">
            <Mail className="w-10 h-10" />
          </div>

          <div className="text-center md:text-left flex-1">
            <h3 className="font-serif text-2xl font-bold text-gray-main mb-2">
              Ganhe 10% OFF na primeira compra
            </h3>
            <p className="text-gray-secondary">
              Cadastre-se para receber ofertas exclusivas, lançamentos e dicas de saúde visual.
            </p>
          </div>

          {status === 'success' ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 w-full md:w-auto">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-green-800 text-sm font-medium">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                  placeholder="Seu melhor e-mail"
                  className={`px-4 py-3 rounded-lg border outline-none transition-all w-full sm:w-64 ${
                    status === 'error'
                      ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                      : 'border-gray-300 focus:border-gold focus:ring-1 focus:ring-gold'
                  }`}
                />
                {status === 'error' && (
                  <p className="text-red-600 text-xs px-1">{message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-gold hover:bg-gold-dark disabled:opacity-60 text-white font-bold py-3 px-6 rounded-lg transition-colors whitespace-nowrap shadow-md flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...</>
                ) : 'Cadastrar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};