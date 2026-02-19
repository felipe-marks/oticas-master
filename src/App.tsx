import React from 'react';
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

// Roteamento simples baseado em pathname
function Router() {
  const path = window.location.pathname;

  // Rota do painel admin
  if (path.startsWith('/admin')) {
    return <AdminApp />;
  }

  // Site principal (front-end público)
  return (
    <CartProvider>
      <div className="min-h-screen bg-white font-sans text-gray-main selection:bg-gold selection:text-white">
        <Header />
        <main>
          <Hero />
          <Categories />
          <Features />
          <Products />
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