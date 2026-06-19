import React, { useEffect, useState, useMemo } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ShoppingCart, MessageCircle, Sun, Glasses, User, Zap, Shield, X, Tag, Star } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { CartProvider, useCart } from '../contexts/CartContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price_original: number;
  price_sale?: number;
  price_pix?: number;
  installments_max?: number;
  category?: string;
  brand?: string;
  sku?: string;
  stock?: number;
  images?: string[];
  image_url?: string;
  main_image_url?: string;
  featured?: boolean;
  is_new?: boolean;
  is_promotion?: boolean;
  gender?: string;
  frame_shape?: string;
  categories?: { name: string; slug: string };
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
    label: 'Lentes de Grau',
    description: 'Escolha a lente ideal para montar seus óculos de grau. Lentes antirreflexo, fotossensíveis, progressivas e muito mais.',
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
  const image = product.main_image_url || product.images?.[0] || product.image_url;
  const installments = product.installments_max || 10;

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, price, price_pix: product.price_pix, image, sku: product.sku || product.slug });
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
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_new && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">NOVO</span>
          )}
          {hasDiscount && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{discountPct}%</span>
          )}
        </div>
        {product.featured && (
          <span className="absolute top-2 right-2 bg-gold text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star className="w-2.5 h-2.5" /> TOP
          </span>
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
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <Tag className="w-3 h-3" />{product.price_pix.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} no PIX
            </p>
          )}
          <p className="text-xs text-gray-500">{installments}x de {(price / installments).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${added ? 'bg-green-500 text-white' : 'bg-gold text-white hover:bg-gold/90'}`}
          >
            <ShoppingCart className="w-4 h-4" />
            {added ? '✓ Adicionado!' : 'Comprar'}
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
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros avançados
  const [filterGender, setFilterGender] = useState<string[]>([]);
  const [filterShape, setFilterShape] = useState<string[]>([]);
  const [filterPromo, setFilterPromo] = useState(false);
  const [filterNew, setFilterNew] = useState(false);
  const [priceMax, setPriceMax] = useState(2000);
  const [maxAvailable, setMaxAvailable] = useState(2000);

  const rawCategory = window.location.pathname.replace('/categoria/', '').replace(/\/$/, '').toLowerCase();
  const meta = CATEGORY_META[rawCategory] || { label: rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1), description: '', icon: null, banner: 'from-gray-50 to-white' };

  useEffect(() => {
    fetch(`/api/products?active=true&limit=100`)
      .then(r => r.json())
      .then(data => {
        const list: Product[] = data.products || data || [];
        const catFiltered = list.filter(p => {
          const catSlug = p.categories?.slug || p.category || '';
          return catSlug.toLowerCase() === rawCategory;
        });
        setProducts(catFiltered);
        if (catFiltered.length > 0) {
          const max = Math.max(...catFiltered.map(p => p.price_sale || p.price_original));
          const rounded = Math.ceil(max / 100) * 100 || 2000;
          setMaxAvailable(rounded);
          setPriceMax(rounded);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [rawCategory]);

  // Opções únicas disponíveis
  const availableGenders = useMemo(() => {
    const set = new Set(products.map(p => p.gender).filter(Boolean) as string[]);
    return Array.from(set);
  }, [products]);

  const availableShapes = useMemo(() => {
    const set = new Set(products.map(p => p.frame_shape).filter(Boolean) as string[]);
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.short_description?.toLowerCase().includes(q)
      );
    }
    if (filterGender.length > 0) list = list.filter(p => p.gender && filterGender.includes(p.gender));
    if (filterShape.length > 0) list = list.filter(p => p.frame_shape && filterShape.includes(p.frame_shape));
    if (filterPromo) list = list.filter(p => p.is_promotion);
    if (filterNew) list = list.filter(p => p.is_new);
    list = list.filter(p => (p.price_sale || p.price_original) <= priceMax);

    switch (sortBy) {
      case 'price_asc': list.sort((a, b) => (a.price_sale ?? a.price_original) - (b.price_sale ?? b.price_original)); break;
      case 'price_desc': list.sort((a, b) => (b.price_sale ?? b.price_original) - (a.price_sale ?? a.price_original)); break;
      case 'newest': list.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0)); break;
      case 'promotion': list.sort((a, b) => (b.is_promotion ? 1 : 0) - (a.is_promotion ? 1 : 0)); break;
      default: list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return list;
  }, [products, search, filterGender, filterShape, filterPromo, filterNew, priceMax, sortBy]);

  const activeFiltersCount = filterGender.length + filterShape.length + (filterPromo ? 1 : 0) + (filterNew ? 1 : 0) + (priceMax < maxAvailable ? 1 : 0);

  const clearFilters = () => {
    setFilterGender([]);
    setFilterShape([]);
    setFilterPromo(false);
    setFilterNew(false);
    setPriceMax(maxAvailable);
    setSearch('');
  };

  const toggleArr = (arr: string[], val: string, setter: (v: string[]) => void) =>
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

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
        {/* Barra de busca + controles */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar nesta categoria..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all ${showFilters || activeFiltersCount > 0 ? 'bg-gold text-white border-gold' : 'bg-white border-gray-200 text-gray-700 hover:border-gold'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className={`rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold ${showFilters || activeFiltersCount > 0 ? 'bg-white text-gold' : 'bg-gold text-white'}`}>
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="pl-4 pr-8 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-gold text-sm appearance-none cursor-pointer"
            >
              <option value="relevance">Relevância</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
              <option value="newest">Mais Novos</option>
              <option value="promotion">Em Promoção</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <p className="flex items-center text-sm text-gray-500 sm:ml-auto whitespace-nowrap">
            {loading ? 'Carregando...' : `${filtered.length} produto${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Painel de filtros avançados */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Preço máximo */}
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Preço máximo</h4>
              <div className="text-sm font-bold text-gold mb-2">
                até {priceMax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <input
                type="range"
                min={0}
                max={maxAvailable}
                step={50}
                value={priceMax}
                onChange={e => setPriceMax(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>R$ 0</span>
                <span>{maxAvailable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>

            {/* Gênero */}
            {availableGenders.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Gênero</h4>
                <div className="flex flex-col gap-2">
                  {availableGenders.map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filterGender.includes(g)}
                        onChange={() => toggleArr(filterGender, g, setFilterGender)}
                        className="accent-gold w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-600 capitalize group-hover:text-gold transition-colors">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Formato */}
            {availableShapes.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Formato</h4>
                <div className="flex flex-col gap-2">
                  {availableShapes.map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filterShape.includes(s)}
                        onChange={() => toggleArr(filterShape, s, setFilterShape)}
                        className="accent-gold w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-600 capitalize group-hover:text-gold transition-colors">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Destaques */}
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Destaques</h4>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={filterPromo} onChange={e => setFilterPromo(e.target.checked)} className="accent-gold w-4 h-4 rounded" />
                  <span className="text-sm text-gray-600 group-hover:text-gold transition-colors">Em promoção</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={filterNew} onChange={e => setFilterNew(e.target.checked)} className="accent-gold w-4 h-4 rounded" />
                  <span className="text-sm text-gray-600 group-hover:text-gold transition-colors">Novidades</span>
                </label>
              </div>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors">
                  <X className="w-3 h-3" /> Limpar todos
                </button>
              )}
            </div>
          </div>
        )}

        {/* Grid de Produtos */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum produto encontrado</h2>
            <p className="text-gray-500 mb-6">
              {products.length === 0
                ? 'Esta categoria ainda não tem produtos cadastrados. Em breve teremos novidades!'
                : 'Tente ajustar os filtros ou a busca.'}
            </p>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="inline-block bg-gold text-white px-6 py-3 rounded-full font-semibold hover:bg-gold/90 transition-colors mr-3">
                Limpar Filtros
              </button>
            )}
            <a href="/" className="inline-block border-2 border-gold text-gold px-6 py-3 rounded-full font-semibold hover:bg-gold hover:text-white transition-colors">
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
