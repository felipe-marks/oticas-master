import React from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <section id="sobre" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-main mb-6">
              Sobre a <span className="text-gold">Óticas Master</span>
            </h2>
            <div className="space-y-4 text-gray-secondary font-sans leading-relaxed text-lg">
              <p>
                Localizada no coração de Parauapebas, a Óticas Master nasceu com o propósito de transformar a maneira como você cuida da sua visão.
              </p>
              <p>
                Não vendemos apenas óculos; entregamos autoestima, conforto e saúde visual. Nossa curadoria de produtos busca unir as últimas tendências da moda internacional com a tecnologia mais avançada em lentes.
              </p>
              <p>
                Nossa equipe é formada por especialistas apaixonados, prontos para oferecer uma consultoria completa, desde a escolha da armação ideal para o seu rosto até o ajuste técnico perfeito.
              </p>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100 flex items-center gap-4">
               <div className="flex flex-col">
                  <span className="font-serif text-3xl text-gold font-bold">100%</span>
                  <span className="text-sm text-gray-secondary uppercase tracking-wider">Satisfação</span>
               </div>
               <div className="w-px h-12 bg-gray-200"></div>
               <div className="flex flex-col">
                  <span className="font-serif text-3xl text-gold font-bold">Premium</span>
                  <span className="text-sm text-gray-secondary uppercase tracking-wider">Qualidade</span>
               </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="order-1 lg:order-2 flex flex-col gap-6">
            <div className="bg-beige-light/30 p-6 rounded-lg border-l-4 border-gold hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-gold/10 p-3 rounded-full text-gold">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-gray-main mb-2">Localização</h3>
                  <p className="text-gray-secondary">
                    Rua Costa e Silva, Quadra 06, Lote 02<br/>
                    Bairro Esplanada, Parauapebas, PA
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-beige-light/30 p-6 rounded-lg border-l-4 border-gold hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-gold/10 p-3 rounded-full text-gold">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-gray-main mb-2">Horário</h3>
                  <p className="text-gray-secondary">
                    Segunda a Sábado<br/>
                    8h às 18h (sob agendamento)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-beige-light/30 p-6 rounded-lg border-l-4 border-gold hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-gold/10 p-3 rounded-full text-gold">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-gray-main mb-2">Contato</h3>
                  <p className="text-gray-secondary">
                    WhatsApp: (94) 98179-6065<br/>
                    Instagram: @oticasmaster.pbs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};