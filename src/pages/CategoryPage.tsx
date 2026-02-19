import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ShoppingCart, MessageCircle, Sun, Glasses, User, Zap, Shield } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { CartProvider, useCart } from '../contexts/CartContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_original?: number;
  price_sale?: number;
  price_pix?: number;
  installments_max?: number;
  category?: string;
  brand?: string;
  sku?: string;
  stock?: number;
  images?: string[];
  image_url?: string;
  featured?: boolean;
}

const CATEGORY_META: Record<string, { label: string; description: string; icon: React.ReactNode; banner: string }> = {
  solar: {
    label: 'Óculos de Sol',
    description: 'Proteção UV e estilo para todos os momentos. Encontre o modelo perfeito para o seu rosto.',
    icon: <Sun className="w-8 h-8 text-gold" />,
    banner: 'from-amber-50 to-orange-50',
  },
  grau: {
    label: 'Óculos de Grau',
    description: 'Armações modernas e confortáveis para quem precisa de correção visual. Qualidade e elegância.',
    icon: <Glasses className="w-8 h-8 text-gold" />,
    banner: 'from-blue-50 to-indigo-50',
  },
  infantil: {
    label: 'Óculos Infantis',
    description: 'Óculos resistentes e coloridos para os pequenos. Segurança e diversão em um só produto.',
    icon: <User className="w-8 h-8 text-pink-400" />,
    banner: 'from-pink-50 to-purple-50',
  },
  lentes: {
    label: 'Lentes de Contato',
    description: 'Lentes de alta qualidade para visão perfeita sem óculos. Conforto o dia todo.',
    icon: <Zap className="w-8 h-8 text-gold" />,
    banner: 'from-teal-50 to-cyan-50',
  },
  esportivo: {
    label: 'Óculos Esportivos',
    description: 'Óculos desenvolvidos para alta performance. Ideal para corrida, ciclismo e esportes ao ar livre.',
    icon: <Shield className="w-8 h-8 text-green-500" />,
    banner: 'from-green-50 to-emerald-50',
  },
  acessorios: {
    label: 'Acessórios',
    description: 'Estojo, cordão, pano de limpeza e muito mais. Tudo para cuidar dos seus óculos.',
    icon: <ShoppingCart className="w-8 h-8 text-gold" />,
    banner: 'from-gray-50 to-slate-50',
  },
};

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const price = product.price_sale ?? product.price_original ?? 0;
  const hasDiscount = product.price_original && product.price_sale && product.price_sale < product.price_original;
  const discountPct = hasDiscount ? Math.round((1 - (product.price_sale! / product.price_original!)) * 100) : 0;
  const image = product.images?.[0] || product.image_url;
  const installments = product.installments_max || 3;

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, price, price_pix: product.price_pix, image, sku: product.sku || '' });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <article className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
      <a href={`/produto/${product.slug}`} className="block relative overflow-hidden bg-gray-50 aspect-square">
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <Glasses className="w-16 h-16" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-{discountPct}%</span>
        )}
        {product.featured && (
          <span className="absolute top-3 right-3 bg-gold text-white text-xs font-bold px-2 py-1 rounded-full">DESTAQUE</span>
        )}
      </a>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <a href={`/produto/${product.slug}`}>
          <h3 className="font-semibold text-gray-800 text-sm leading-tight hover:text-gold transition-colors line-clamp-2">{product.name}</h3>
        </a>
        {product.brand && <p className="text-xs text-gray-400">{product.brand}</p>}
        <div className="mt-auto pt-2">
          {hasDiscount && (
            <p className="text-xs text-gray-400 line-through">{(product.price_original!).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          )}
          <p className="text-lg font-bold text-gray-900">{price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          {product.price_pix && (
            <p className="text-xs text-green-600 font-semibold">{product.price_pix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} no PIX</p>
          )}
          <p className="text-xs text-gray-500">{installments}x de {(price / installments).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} s/ juros</p>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${added ? 'bg-green-500 text-white' : 'bg-gold text-white hover:bg-gold/90'}`}
          >
            <ShoppingCart className="w-4 h-4" />
            {added ? 'Adicionado!' : 'Comprar'}
          </button>
          <a
            href={`https://wa.me/5594981796065?text=${encodeURIComponent(`Olá! Tenho interesse em: *${product.name}* - ${price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>
      </div>
    </article>
  );
}

function CategoryPageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const rawCategory = window.location.pathname.replace('/categoria/', '').replace(/\/$/, '').toLowerCase();
  const meta = CATEGORY_META[rawCategory] || { label: rawCategory, description: '', icon: null, banner: 'from-gray-50 to-white' };

  useEffect(() => {
    fetch(`/api/products?active=true&limit=100`)
      .then(r => r.json())
      .then(data => {
        const list: Product[] = data.products || data || [];
        const filtered = list.filter(p => p.category?.toLowerCase() === rawCategory);
        setProducts(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [rawCategory]);

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return (a.price_sale ?? a.price_original ?? 0) - (b.price_sale ?? b.price_original ?? 0);
      if (sortBy === 'price_desc') return (b.price_sale ?? b.price_original ?? 0) - (a.price_sale ?? a.price_original ?? 0);
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner da Categoria */}
      <div className={`bg-gradient-to-r ${meta.banner} border-b border-gray-100`}>
        <div className="container mx-auto px-4 py-10 flex items-center gap-6">
          <div className="hidden sm:flex w-16 h-16 bg-white rounded-2xl shadow-sm items-center justify-center shrink-0">
            {meta.icon}
          </div>
          <div>
            <nav className="text-xs text-gray-400 mb-1">
              <a href="/" className="hover:text-gold">Início</a> / <span className="text-gray-600">{meta.label}</span>
            </nav>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900">{meta.label}</h1>
            {meta.description && <p className="text-gray-500 text-sm mt-1 max-w-xl">{meta.description}</p>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar nesta categoria..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-gold text-sm appearance-none cursor-pointer"
            >
              <option value="name">Ordenar: A-Z</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="flex items-center text-sm text-gray-500 sm:ml-auto">
            {loading ? 'Carregando...' : `${filtered.length} produto${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Grid de Produtos */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum produto encontrado</h2>
            <p className="text-gray-500 mb-6">
              {products.length === 0
                ? 'Esta categoria ainda não tem produtos cadastrados. Em breve teremos novidades!'
                : 'Tente uma busca diferente.'}
            </p>
            <a href="/" className="inline-block bg-gold text-white px-6 py-3 rounded-full font-semibold hover:bg-gold/90 transition-colors">
              Ver todos os produtos
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white font-sans text-gray-main selection:bg-gold selection:text-white">
        <Header />
        <main>
          <CategoryPageContent />
        </main>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
