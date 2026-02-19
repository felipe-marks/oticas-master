import React from 'react';
import { Glasses, Sun, User, Trophy, Shield } from 'lucide-react';
import { Product } from '../types';

const products: Product[] = [
  { id: 1, title: 'Óculos de Grau Premium', price: 'R$ 199+', icon: <Glasses className="w-12 h-12 text-gray-main" /> },
  { id: 2, title: 'Óculos de Sol Polarizado', price: 'R$ 149+', icon: <Sun className="w-12 h-12 text-gold" /> },
  { id: 4, title: 'Óculos Infantis', price: 'R$ 129+', icon: <User className="w-12 h-12 text-pink-400" /> },
  { id: 5, title: 'Óculos Esportivos', price: 'R$ 179+', icon: <Trophy className="w-12 h-12 text-green-500" /> },
  { id: 6, title: 'Óculos de Segurança', price: 'R$ 99+', icon: <Shield className="w-12 h-12 text-gray-500" /> },
];

export const Products: React.FC = () => {
  const whatsappLink = "https://wa.me/5594981796065?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20produtos.";

  return (
    <section id="produtos" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-gold uppercase tracking-widest text-sm font-semibold mb-2 block">Coleção 2026</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-main mb-4">
            Nossos Produtos
          </h2>
          <p className="text-gray-secondary max-w-xl mx-auto">
            Uma seleção cuidadosa das melhores armações e lentes para o seu estilo de vida.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <article 
              key={product.id}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group"
            >
              <div className="bg-gray-50 h-48 flex items-center justify-center relative overflow-hidden group-hover:bg-beige-light/30 transition-colors">
                 <div className="transform group-hover:scale-110 transition-transform duration-500">
                    {product.icon}
                 </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="font-serif text-xl font-bold text-gray-main mb-2">
                  {product.title}
                </h3>
                <div className="text-gold font-bold text-lg mb-4">
                  A partir de {product.price}
                </div>
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full py-3 px-4 bg-transparent border-2 border-gray-200 text-gray-main rounded-lg hover:border-gold hover:bg-gold hover:text-white transition-all font-medium"
                >
                  Consultar Disponibilidade
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};