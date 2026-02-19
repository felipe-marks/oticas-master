import React from 'react';
import { Award, Wallet, Users, ShieldCheck } from 'lucide-react';
import { Feature } from '../types';

const features: Feature[] = [
  {
    id: 1,
    title: "Qualidade Premium",
    description: "Marcas internacionais e produtos de alta qualidade para sua saúde visual.",
    icon: <Award className="w-8 h-8 text-gold" />
  },
  {
    id: 2,
    title: "Preços Acessíveis",
    description: "Ótimos preços sem comprometer a qualidade. Parcelamos em até 3x.",
    icon: <Wallet className="w-8 h-8 text-gold" />
  },
  {
    id: 3,
    title: "Atendimento Personalizado",
    description: "Equipe especializada pronta para ajudar você a encontrar o óculos perfeito.",
    icon: <Users className="w-8 h-8 text-gold" />
  },
  {
    id: 4,
    title: "Garantia e Assistência",
    description: "Garantia completa e assistência técnica especializada para seus óculos.",
    icon: <ShieldCheck className="w-8 h-8 text-gold" />
  }
];

export const Features: React.FC = () => {
  return (
    <section className="py-20 bg-gray-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-main mb-4">
            Por que escolher a Óticas Master?
          </h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.id}
              className="bg-white p-8 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-gold group"
            >
              <div className="bg-beige-light w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-main mb-3">
                {feature.title}
              </h3>
              <p className="font-sans text-gray-secondary leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};