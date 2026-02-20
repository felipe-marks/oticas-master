import React, { lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Categories } from './components/Categories';
import { Features } from './components/Features';
import { Products } from './components/Products';
import { Testimonials } from './components/Testimonials';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { Newsletter } from './components/Newsletter';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CartProvider } from './contexts/CartContext';
import { AdminApp } from './pages/admin/AdminApp';

// Lazy load para páginas de produto, categoria e área do cliente
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const CustomerArea = lazy(() => import('./pages/CustomerArea'));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Roteamento simples baseado em pathname
function Router() {
  const path = window.location.pathname;

  // Rota do painel admin
  if (path.startsWith('/admin')) {
    return <AdminApp />;
  }

  // Rota da área do cliente
  if (path.startsWith('/minha-conta')) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <CustomerArea />
      </Suspense>
    );
  }

  // Rota de produto individual: /produto/nome-do-produto
  if (path.startsWith('/produto/')) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ProductPage />
      </Suspense>
    );
  }

  // Rota de categoria: /categoria/solar, /categoria/grau, etc.
  if (path.startsWith('/categoria/')) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <CategoryPage />
      </Suspense>
    );
  }

  // Site principal (front-end público)
  return (
    <CartProvider>
      <div className="min-h-screen bg-white font-sans text-gray-main selection:bg-gold selection:text-white">
        <Header />
        <main>
          <Hero />
          <Products />
          <Categories />
          <Features />
          <Testimonials />
          <About />
          <Newsletter />
          <Contact />
        </main>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}

function App() {
  return <Router />;
}

export default App;
