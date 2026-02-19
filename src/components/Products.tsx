import React, { useState, useEffect } from 'react';
import { Glasses, Sun, User, Trophy, Shield, ShoppingCart, Star, Tag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description?: string;
  price_original: number;
  price_sale?: number;
  price_pix?: number;
  installments_max?: number;
  main_image_url?: string;
  featured: boolean;
  is_new: boolean;
  is_promotion: boolean;
  frame_shape?: string;
  gender?: string;
  categories?: { name: string };
}

const categoryIcons: Record<string, React.ReactNode> = {
  'grau': <Glasses className="w-16 h-16 text-gray-400" />,
  'solar': <Sun className="w-16 h-16 text-yellow-400" />,
  'infantil': <User className="w-16 h-16 text-pink-400" />,
  'esportivo': <Trophy className="w-16 h-16 text-green-500" />,
  'seguranca': <Shield className="w-16 h-16 text-gray-500" />,
};

function formatCurrency(value: number) {
  return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '';
}

function ProductCard({ product }: { product: Product }) {
  const whatsappLink = `https://wa.me/5594981796065?text=Olá!%20Tenho%20interesse%20no%20produto%20*${encodeURIComponent(product.name)}*%20(R$%20${product.price_sale || product.price_original}).%20Pode%20me%20ajudar?`;
  const hasDiscount = product.price_sale && product.price_sale < product.price_original;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price_sale! / product.price_original) * 100)
    : 0;

  return (
    <article className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
      {/* Imagem */}
      <div className="relative bg-gray-50 h-52 flex items-center justify-center overflow-hidden group-hover:bg-beige-light/20 transition-colors">
        {product.main_image_url ? (
          <img
            src={product.main_image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`flex items-center justify-center w-full h-full ${product.main_image_url ? 'hidden' : ''}`}>
          {categoryIcons['grau']}
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.is_new && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">NOVO</span>
          )}
          {product.is_promotion && hasDiscount && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-{discountPct}%</span>
          )}
          {product.featured && (
            <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> DESTAQUE
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex flex-col flex-1">
        {product.categories?.name && (
          <span className="text-xs text-gold uppercase tracking-widest font-semibold mb-1">
            {product.categories.name}
          </span>
        )}
        <h3 className="font-serif text-lg font-bold text-gray-main mb-2 line-clamp-2">
          {product.name}
        </h3>
        {product.short_description && (
          <p className="text-sm text-gray-secondary mb-3 line-clamp-2">{product.short_description}</p>
        )}

        {/* Preços */}
        <div className="mt-auto">
          {hasDiscount && (
            <div className="text-sm text-gray-400 line-through">{formatCurrency(product.price_original)}</div>
          )}
          <div className="text-2xl font-bold text-gray-main">
            {formatCurrency(product.price_sale || product.price_original)}
          </div>
          {product.price_pix && (
            <div className="text-sm text-green-600 font-medium flex items-center gap-1 mt-1">
              <Tag className="w-3 h-3" />
              {formatCurrency(product.price_pix)} no PIX
            </div>
          )}
          {product.installments_max && product.installments_max > 1 && (
            <div className="text-xs text-gray-secondary mt-1">
              ou {product.installments_max}x de {formatCurrency((product.price_sale || product.price_original) / product.installments_max)}
            </div>
          )}
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 px-4 bg-transparent border-2 border-gray-200 text-gray-main rounded-lg hover:border-gold hover:bg-gold hover:text-white transition-all font-medium text-sm"
        >
          <ShoppingCart className="w-4 h-4" />
          Consultar / Comprar
        </a>
      </div>
    </article>
  );
}

// Card de fallback estático quando não há produtos cadastrados
function StaticProductCard({ title, price, icon }: { title: string; price: string; icon: React.ReactNode }) {
  const whatsappLink = "https://wa.me/5594981796065?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20produtos.";
  return (
    <article className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="bg-gray-50 h-48 flex items-center justify-center group-hover:bg-beige-light/30 transition-colors">
        <div className="transform group-hover:scale-110 transition-transform duration-500">{icon}</div>
      </div>
      <div className="p-6 text-center">
        <h3 className="font-serif text-xl font-bold text-gray-main mb-2">{title}</h3>
        <div className="text-gold font-bold text-lg mb-4">A partir de {price}</div>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
          className="inline-block w-full py-3 px-4 bg-transparent border-2 border-gray-200 text-gray-main rounded-lg hover:border-gold hover:bg-gold hover:text-white transition-all font-medium">
          Consultar Disponibilidade
        </a>
      </div>
    </article>
  );
}

const staticProducts = [
  { id: 1, title: 'Óculos de Grau Premium', price: 'R$ 199', icon: <Glasses className="w-12 h-12 text-gray-main" /> },
  { id: 2, title: 'Óculos de Sol Polarizado', price: 'R$ 149', icon: <Sun className="w-12 h-12 text-gold" /> },
  { id: 4, title: 'Óculos Infantis', price: 'R$ 129', icon: <User className="w-12 h-12 text-pink-400" /> },
  { id: 5, title: 'Óculos Esportivos', price: 'R$ 179', icon: <Trophy className="w-12 h-12 text-green-500" /> },
  { id: 6, title: 'Óculos de Segurança', price: 'R$ 99', icon: <Shield className="w-12 h-12 text-gray-500" /> },
];

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/products?active=true&featured=true&limit=12')
      .then(r => r.json())
      .then(data => {
        const list = data.products || data || [];
        setProducts(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

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

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : error || products.length === 0 ? (
          // Fallback: exibir produtos estáticos se não houver produtos cadastrados
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {staticProducts.map(p => (
              <StaticProductCard key={p.id} title={p.title} price={p.price} icon={p.icon} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="text-center mt-12">
            <a
              href="https://wa.me/5594981796065?text=Olá!%20Gostaria%20de%20ver%20todos%20os%20produtos%20disponíveis."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-4 px-10 bg-gold text-white font-semibold rounded-full hover:bg-gold/90 transition-colors shadow-md"
            >
              Ver Todos os Produtos
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
