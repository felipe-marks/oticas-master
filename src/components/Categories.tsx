import React from 'react';
import { Sun, Glasses, Baby, ScanEye, Zap, Star } from 'lucide-react';

const categories = [
  { id: 1, label: 'Solar', href: '/categoria/solar', icon: <Sun className="w-8 h-8" />, color: 'bg-orange-100 text-orange-600' },
  { id: 2, label: 'Grau', href: '/categoria/grau', icon: <Glasses className="w-8 h-8" />, color: 'bg-blue-100 text-blue-600' },
  { id: 3, label: 'Infantil', href: '/categoria/infantil', icon: <Baby className="w-8 h-8" />, color: 'bg-pink-100 text-pink-500' },
  { id: 4, label: 'Lentes', href: '/categoria/lentes', icon: <ScanEye className="w-8 h-8" />, color: 'bg-purple-100 text-purple-600' },
  { id: 5, label: 'Promoções', href: '/categoria/promocoes', icon: <Zap className="w-8 h-8" />, color: 'bg-yellow-100 text-yellow-600' },
  { id: 6, label: 'Lançamentos', href: '/categoria/lancamentos', icon: <Star className="w-8 h-8" />, color: 'bg-green-100 text-green-600' },
];

export const Categories: React.FC = () => {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h3 className="text-center font-serif text-2xl font-bold text-gray-main mb-8 md:hidden">
          Navegue por Categorias
        </h3>
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          {categories.map((cat) => (
            <a 
              key={cat.id} 
              href={cat.href}
              className="flex flex-col items-center gap-3 group cursor-pointer"
            >
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center ${cat.color} shadow-sm group-hover:scale-110 transition-transform duration-300 border-2 border-transparent group-hover:border-gold`}>
                {cat.icon}
              </div>
              <span className="font-medium text-gray-main text-sm md:text-base group-hover:text-gold transition-colors">
                {cat.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};