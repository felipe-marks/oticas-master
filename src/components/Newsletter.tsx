import React from 'react';
import { Mail } from 'lucide-react';

export const Newsletter: React.FC = () => {
  return (
    <section className="py-16 bg-beige-light relative overflow-hidden">
      {/* Background Pattern */}
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
          
          <form className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="Seu melhor e-mail" 
              className="px-4 py-3 rounded-lg border border-gray-300 focus:border-gold focus:ring-1 focus:ring-gold outline-none w-full sm:w-64"
            />
            <button 
              type="button"
              className="bg-gold hover:bg-gold-dark text-white font-bold py-3 px-6 rounded-lg transition-colors whitespace-nowrap shadow-md"
            >
              Cadastrar
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};