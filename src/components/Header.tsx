import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, ShoppingCart, Heart, Search, User, ChevronRight } from 'lucide-react';
import { Logo } from './Logo';
import { TopBar } from './TopBar';
import { useCart } from '../contexts/CartContext';

const navItems = [
  { label: 'Início', href: '#home' },
  { label: 'Solar', href: '/categoria/solar' },
  { label: 'Grau', href: '/categoria/grau' },
  { label: 'Infantil', href: '/categoria/infantil' },
  { label: 'Lentes', href: '/categoria/lentes' },
  { label: 'Contato', href: '#contato' },
];

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems, toggleCart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const whatsappLink = "https://wa.me/5594981796065?text=Olá%20Óticas%20Master!%20Gostaria%20de%20agendar%20uma%20consulta.";

  return (
    <>
      <TopBar />
      {/* O header precisa de position relative para o menu mobile absolute funcionar */}
      <header
        className={`w-full transition-all duration-300 bg-white relative z-40 ${
          isScrolled ? 'shadow-md border-b border-gray-100' : 'border-b border-beige-light'
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
                <a href="/minha-conta" className="hidden sm:block hover:text-gold transition-colors" title="Minha Conta">
                  <User className="w-6 h-6" />
                </a>
                <button className="relative hover:text-gold transition-colors">
                  <Heart className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 bg-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">0</span>
                </button>
                {/* Botão do carrinho */}
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

        {/* Mobile Menu — dropdown absoluto abaixo do header */}
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
