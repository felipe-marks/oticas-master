import React from 'react';
import { Instagram, Phone, MapPin, CreditCard, ShieldCheck, Lock, Heart } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  const whatsappLink = "https://wa.me/5594981796065";
  const instagramLink = "https://instagram.com/oticasmaster.pbs";

  return (
    <footer className="bg-gray-900 text-white border-t-4 border-gold">
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Logo className="h-10 w-10 text-gold" />
              <span className="font-serif text-2xl font-bold text-gold">Óticas Master</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sua visão, nossa paixão. Oferecendo qualidade premium em óptica e um atendimento que você confia em Parauapebas.
            </p>
            <div className="flex gap-4 pt-2">
              <a 
                href={whatsappLink} 
                target="_blank" 
                rel="noreferrer"
                className="bg-gray-800 hover:bg-gold p-3 rounded-full transition-colors group"
                aria-label="WhatsApp"
              >
                <Phone className="w-5 h-5 text-gray-300 group-hover:text-white" />
              </a>
              <a 
                href={instagramLink} 
                target="_blank" 
                rel="noreferrer"
                className="bg-gray-800 hover:bg-gold p-3 rounded-full transition-colors group"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-gray-300 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Institutional */}
          <div>
            <h4 className="font-serif text-lg font-bold text-gold mb-6">Institucional</h4>
            <ul className="space-y-3">
              {['Sobre Nós', 'Nossas Lojas', 'Política de Privacidade', 'Trocas e Devoluções', 'Trabalhe Conosco'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm hover:translate-x-1 inline-block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-bold text-gold mb-6">Atendimento</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span>Rua Costa e Silva, Q06, L02, Bairro Esplanada, Parauapebas, PA</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="w-5 h-5 text-gold shrink-0" />
                <div className="flex flex-col">
                  <span>(94) 98179-6065</span>
                  <span className="text-xs text-gray-500">Seg a Sex: 8h às 18h</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Security & Payment */}
          <div>
            <h4 className="font-serif text-lg font-bold text-gold mb-6">Segurança e Pagamento</h4>
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Lock className="w-4 h-4 text-green-500" />
                <span>Site 100% Seguro</span>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 block mb-2">Formas de Pagamento</span>
                <div className="flex flex-wrap gap-2">
                   {/* Simulated Payment Icons */}
                   <div className="bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded h-6 flex items-center">VISA</div>
                   <div className="bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded h-6 flex items-center">MASTER</div>
                   <div className="bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded h-6 flex items-center">ELO</div>
                   <div className="bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded h-6 flex items-center">PIX</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Óticas Master. CNPJ: 45.657.100/0001-23.
          </p>
          <div className="flex items-center gap-2 text-gray-600 text-xs">
             <span>Desenvolvido com</span>
             <Heart className="w-3 h-3 text-red-500 fill-current" />
             <span>por TechVision</span>
          </div>
        </div>
      </div>
    </footer>
  );
};