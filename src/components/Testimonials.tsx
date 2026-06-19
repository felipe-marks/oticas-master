import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Ana Paula Silva',
    role: 'Cliente desde 2026',
    text: 'O atendimento foi impecável! Me ajudaram a escolher a armação perfeita para o meu rosto. As lentes ficaram prontas super rápido.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Carlos Oliveira',
    role: 'Cliente',
    text: 'Preço justo e muita qualidade. Comprei meu óculos de sol com grau e ficou perfeito. Recomendo muito a Óticas Master.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Mariana Santos',
    role: 'Cliente',
    text: 'Amei a variedade de modelos infantis. Meu filho adorou o óculos novo e o atendimento com as crianças é super paciente.',
    rating: 5,
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-main mb-4">
            Quem compra, ama!
          </h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item) => (
            <div key={item.id} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow relative">
              <Quote className="absolute top-6 right-6 text-beige-light w-12 h-12 rotate-180" />
              <div className="flex gap-1 mb-4">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gold fill-current" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-6 leading-relaxed">
                "{item.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-main text-sm">{item.name}</h4>
                  <span className="text-xs text-gray-400">{item.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};