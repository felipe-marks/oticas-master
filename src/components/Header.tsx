import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Phone, ShoppingCart, Heart, Search, User, ChevronRight, Package, MapPin, CreditCard, Shield, RotateCcw, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { TopBar } from './TopBar';
import { useCart } from '../contexts/CartContext';

const navItems = [
  { label: 'Início', href: '/' },
  { label: 'Solar', href: '/categoria/solar' },
  { label: 'Grau', href: '/categoria/grau' },
  { label: 'Infantil', href: '/categoria/infantil' },
  { label: 'Lentes', href: '/categoria/lentes' },
  { label: 'Contato', href: '#contato' },
];

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [customerUser, setCustomerUser] = useState<{ name: string; email: string } | null>(null);
  const { totalItems, toggleCart } = useCart();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Verificar se cliente está logado
  const checkCustomerAuth = React.useCallback(() => {
    const saved = localStorage.getItem('oticas_customer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.token && parsed.exp > Date.now()) {
          setCustomerUser({ name: parsed.name, email: parsed.email });
        } else {
          localStorage.removeItem('oticas_customer');
          setCustomerUser(null);
        }
      } catch {
        localStorage.removeItem('oticas_customer');
        setCustomerUser(null);
      }
    } else {
      setCustomerUser(null);
    }
  }, []);

  useEffect(() => {
    checkCustomerAuth();
    // Escutar mudanças no localStorage (login/logout em outras abas)
    window.addEventListener('storage', checkCustomerAuth);
    // Verificar a cada 1 segundo para capturar login na mesma aba
    const interval = setInterval(checkCustomerAuth, 1000);
    return () => {
      window.removeEventListener('storage', checkCustomerAuth);
      clearInterval(interval);
    };
  }, [checkCustomerAuth]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('oticas_customer');
    setCustomerUser(null);
    setIsProfileOpen(false);
    window.location.href = '/';
  };

  const whatsappLink = "https://wa.me/5594981796065?text=Olá%20Óticas%20Master!%20Gostaria%20de%20agendar%20uma%20consulta.";

  const profileMenuItems = [
    { label: 'Meus Dados', href: '/minha-conta', icon: User },
    { label: 'Favoritos', href: '/minha-conta', icon: Heart },
    { label: 'Endereços', href: '/minha-conta', icon: MapPin },
    { label: 'Meus Pedidos', href: '/minha-conta', icon: Package },
    { label: 'Cartões', href: '/minha-conta', icon: CreditCard },
    { label: 'Meu Acesso', href: '/minha-conta', icon: Shield },
    { label: 'Devoluções', href: '/minha-conta', icon: RotateCcw },
  ];

  return (
    <>
      <TopBar />
      <header
        className={`w-full transition-all duration-300 bg-white relative z-40 ${
          isScrolled ? 'shadow-md border-b border-gray-100' : 'border-b border-gray-100'
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">

            {/* Left: Mobile Menu Button & Logo */}
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden text-gray-main hover:bg-gray-100 p-2 rounded-full transition-colors -ml-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <a href="/" className="flex items-center gap-2 group shrink-0">
                <Logo className="h-10 w-10 transition-transform group-hover:scale-105" />
                <div className="flex flex-col">
                  <span className="font-serif text-xl font-bold text-gray-main leading-none">Óticas</span>
                  <span className="font-serif text-xl font-bold text-gold leading-none">Master</span>
                </div>
              </a>
            </div>

            {/* Middle: Search Bar (Desktop) */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8 relative">
              <input
                type="text"
                placeholder="O que você procura hoje?"
                className="w-full pl-4 pr-12 py-2.5 rounded-full bg-gray-50 border border-gray-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-gold text-white p-1.5 rounded-full hover:bg-gold/90 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="hidden md:flex flex-col items-end text-sm">
                <span className="text-gray-500 text-xs">Atendimento</span>
                <a href={whatsappLink} className="font-bold text-gray-main hover:text-gold flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  (94) 98179-6065
                </a>
              </div>

              <div className="flex items-center gap-3 md:gap-4 text-gray-main">

                {/* Dropdown de Perfil */}
                <div className="relative hidden sm:block" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-1.5 hover:text-gold transition-colors group"
                    title="Minha Conta"
                  >
                    <User className="w-6 h-6" />
                    {customerUser && (
                      <span className="hidden md:block text-xs font-medium text-gray-600 group-hover:text-gold max-w-[80px] truncate">
                        {customerUser.name.split(' ')[0]}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-bold text-gray-900">Minha conta</p>
                        {customerUser && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{customerUser.email}</p>
                        )}
                      </div>

                      {customerUser ? (
                        <>
                          {profileMenuItems.map(item => {
                            const Icon = item.icon;
                            return (
                              <a
                                key={item.label}
                                href={item.href}
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gold transition-colors"
                              >
                                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                                {item.label}
                              </a>
                            );
                          })}
                          <div className="border-t border-gray-100">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4 shrink-0" />
                              Sair
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <a
                            href="/minha-conta"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-gold transition-colors"
                          >
                            <User className="w-4 h-4 text-gray-400" />
                            Entrar
                          </a>
                          <a
                            href="/minha-conta"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gold transition-colors border-t border-gray-50"
                          >
                            <User className="w-4 h-4 text-gray-400" />
                            Criar Conta
                          </a>
                          <div className="px-4 py-3 border-t border-gray-100">
                            <a
                              href="/minha-conta"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gold transition-colors"
                            >
                              <Package className="w-3.5 h-3.5" />
                              Meus Pedidos
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Favoritos */}
                <button className="relative hover:text-gold transition-colors">
                  <Heart className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 bg-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">0</span>
                </button>

                {/* Carrinho */}
                <button
                  onClick={toggleCart}
                  className="relative hover:text-gold transition-colors"
                  aria-label="Carrinho de compras"
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span className={`absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center transition-colors ${totalItems > 0 ? 'bg-gold' : 'bg-gray-400'}`}>
                    {totalItems}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Row */}
          <div className="hidden lg:flex items-center justify-center py-3 mt-2 border-t border-gray-100">
            <nav className="flex gap-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-gray-600 hover:text-gold uppercase tracking-wider transition-colors relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full" />
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-2xl z-50 overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="px-4 py-4 flex flex-col gap-1">
            {/* Mobile Search */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Buscar produtos..."
                className="w-full pl-4 pr-10 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-gold text-sm"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            {/* Nav Links */}
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center justify-between font-medium text-gray-800 py-3.5 px-2 border-b border-gray-50 hover:text-gold hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </a>
            ))}

            {/* Minha Conta no mobile */}
            <a
              href="/minha-conta"
              className="flex items-center justify-between font-medium text-gray-800 py-3.5 px-2 border-b border-gray-50 hover:text-gold hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {customerUser ? `Olá, ${customerUser.name.split(' ')[0]}` : 'Minha Conta'}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </a>

            {/* WhatsApp CTA */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex justify-center items-center gap-2 bg-green-600 text-white py-3.5 rounded-xl font-semibold shadow-sm active:scale-95 transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Phone className="w-5 h-5" />
              Falar no WhatsApp
            </a>
            <p className="text-center text-xs text-gray-400 mt-2 pb-2">
              (94) 98179-6065 — Parauapebas, PA
            </p>
          </div>
        </div>
      </header>
    </>
  );
};
