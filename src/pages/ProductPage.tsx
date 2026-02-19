import React, { useEffect, useState } from 'react';
import { ShoppingCart, Heart, Share2, ChevronLeft, Star, Shield, Truck, RotateCcw, MessageCircle, ZoomIn } from 'lucide-react';
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
  active?: boolean;
  tags?: string[];
}

function ProductPageContent() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

  // Pegar o slug da URL: /produto/nome-do-produto
  const slug = window.location.pathname.replace('/produto/', '').replace(/\/$/, '');

  useEffect(() => {
    if (!slug) { setError(true); setLoading(false); return; }
    fetch(`/api/products?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        const list = data.products || data || [];
        const found = Array.isArray(list) ? list[0] : null;
        if (found) { setProduct(found); setLoading(false); }
        else { setError(true); setLoading(false); }
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    const price = product.price_sale ?? product.price_original ?? 0;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price,
        price_pix: product.price_pix,
        image: product.images?.[0] || product.image_url,
        sku: product.sku || '',
      });
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleBuyWhatsApp = () => {
    if (!product) return;
    const price = product.price_sale ?? product.price_original ?? 0;
    const msg = `Olá! Tenho interesse em comprar:\n\n*${product.name}*\nSKU: ${product.sku || 'N/A'}\nPreço: R$ ${price.toFixed(2)}\nQuantidade: ${quantity}\n\nPoderia me ajudar?`;
    window.open(`https://wa.me/5594981796065?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-6xl">😕</div>
        <h1 className="text-2xl font-bold text-gray-800">Produto não encontrado</h1>
        <p className="text-gray-500 text-center">O produto que você procura não está disponível ou foi removido.</p>
        <a href="/" className="mt-4 bg-gold text-white px-6 py-3 rounded-full font-semibold hover:bg-gold/90 transition-colors">
          Voltar para a loja
        </a>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);
  const price = product.price_sale ?? product.price_original ?? 0;
  const hasDiscount = product.price_original && product.price_sale && product.price_sale < product.price_original;
  const discountPct = hasDiscount ? Math.round((1 - (product.price_sale! / product.price_original!)) * 100) : 0;
  const installments = product.installments_max || 3;
  const installmentValue = price / installments;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <a href="/" className="hover:text-gold transition-colors">Início</a>
            <span>/</span>
            {product.category && (
              <>
                <a href={`/categoria/${product.category.toLowerCase()}`} className="hover:text-gold transition-colors capitalize">{product.category}</a>
                <span>/</span>
              </>
            )}
            <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gold transition-colors mb-6 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            
            {/* Galeria de Imagens */}
            <div className="p-6 lg:p-8 bg-gray-50 flex flex-col gap-4">
              {/* Imagem Principal */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-inner group cursor-zoom-in">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ZoomIn className="w-16 h-16" />
                  </div>
                )}
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    -{discountPct}%
                  </div>
                )}
                {product.featured && (
                  <div className="absolute top-4 right-4 bg-gold text-white text-xs font-bold px-2 py-1 rounded-full">
                    DESTAQUE
                  </div>
                )}
              </div>
              {/* Miniaturas */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-gold shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações do Produto */}
            <div className="p-6 lg:p-8 flex flex-col gap-5">
              
              {/* Categoria e Marca */}
              <div className="flex items-center gap-3 flex-wrap">
                {product.category && (
                  <span className="text-xs font-semibold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                )}
                {product.brand && (
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                    {product.brand}
                  </span>
                )}
              </div>

              {/* Nome */}
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              {/* Avaliação */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <span className="text-sm text-gray-500">(Novo)</span>
              </div>

              {/* Preços */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {hasDiscount && (
                  <p className="text-sm text-gray-400 line-through">
                    De: {formatCurrency(product.price_original!)}
                  </p>
                )}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">{formatCurrency(price)}</span>
                  {hasDiscount && (
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Economize {formatCurrency(product.price_original! - price)}
                    </span>
                  )}
                </div>
                {product.price_pix && (
                  <p className="text-base font-semibold text-green-700">
                    <span className="bg-green-100 px-2 py-0.5 rounded text-sm">PIX</span>{' '}
                    {formatCurrency(product.price_pix)} <span className="text-sm font-normal text-green-600">(5% de desconto)</span>
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  ou <span className="font-semibold text-gray-700">{installments}x de {formatCurrency(installmentValue)}</span> sem juros
                </p>
              </div>

              {/* Descrição */}
              {product.description && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Descrição</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* SKU e Estoque */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {product.sku && <span>SKU: <span className="font-medium text-gray-700">{product.sku}</span></span>}
                {product.stock !== undefined && (
                  <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}
                  </span>
                )}
              </div>

              {/* Quantidade */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Quantidade:</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600 font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-semibold text-gray-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600 font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold transition-all shadow-sm ${
                    addedToCart
                      ? 'bg-green-500 text-white'
                      : product.stock === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gold text-white hover:bg-gold/90 active:scale-95'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addedToCart ? 'Adicionado! ✓' : 'Adicionar ao Carrinho'}
                </button>
                <button
                  onClick={handleBuyWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 active:scale-95 transition-all shadow-sm"
                >
                  <MessageCircle className="w-5 h-5" />
                  Comprar via WhatsApp
                </button>
              </div>

              {/* Garantias */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                <div className="flex flex-col items-center gap-1 text-center">
                  <Shield className="w-6 h-6 text-gold" />
                  <span className="text-xs text-gray-600">Garantia</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <Truck className="w-6 h-6 text-gold" />
                  <span className="text-xs text-gray-600">Entrega Brasil</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <RotateCcw className="w-6 h-6 text-gold" />
                  <span className="text-xs text-gray-600">Troca Fácil</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white font-sans text-gray-main selection:bg-gold selection:text-white">
        <Header />
        <main>
          <ProductPageContent />
        </main>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
