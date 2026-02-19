import React from 'react';
import { ArrowRight, Calendar } from 'lucide-react';

export const Hero: React.FC = () => {
  const whatsappLink = "https://wa.me/5594981796065?text=Olá%20Óticas%20Master!%20Gostaria%20de%20agendar%20uma%20consulta.";

  return (
    <section 
      id="home" 
      className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden bg-gray-50"
    >
      {/* Background Image/Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-beige-light opacity-50"></div>
      
      {/* Decorative Circles */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-gold/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 text-center z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center slide-up">
          <span className="inline-block px-4 py-1 mb-6 text-sm font-semibold tracking-widest text-gold uppercase border border-gold/30 rounded-full bg-white shadow-sm">
            Nova Coleção 2026
          </span>
          
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-gray-main mb-6 leading-tight">
            Estilo que <br className="hidden md:block" />
            <span className="text-gold italic">Transforma</span>
          </h1>
          
          <p className="font-sans text-gray-secondary text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
            Descubra armações exclusivas e lentes de alta tecnologia.
            Consulte condições de entrega para sua região.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a 
              href={whatsappLink}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 min-w-[200px]"
            >
              <Calendar className="w-5 h-5" />
              Agendar Exame
            </a>
            <a 
              href="#produtos" 
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-main border border-gray-200 px-8 py-4 rounded-full font-bold text-lg transition-all hover:border-gold hover:text-gold min-w-[200px]"
            >
              Ver Coleção
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};