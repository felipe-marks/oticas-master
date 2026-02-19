import React, { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { Dashboard } from './Dashboard';
import { Products } from './Products';
import { Orders } from './Orders';
import { Promotions } from './Promotions';
import { Customers } from './Customers';
import { SiteSettings } from './SiteSettings';

// Páginas placeholder para funcionalidades futuras
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-gray-400 text-sm mt-1">Esta seção estará disponível em breve</p>
    </div>
  );
}

function AdminContent() {
  const { isAuthenticated, loading } = useAdminAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return <AdminLogin />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products />;
      case 'orders': return <Orders />;
      case 'promotions': return <Promotions />;
      case 'customers': return <Customers />;
      case 'settings': return <SiteSettings />;
      case 'categories': return <ComingSoon title="Categorias" />;
      case 'appointments': return <ComingSoon title="Agendamentos" />;
      case 'newsletter': return <ComingSoon title="Newsletter" />;
      case 'banners': return <ComingSoon title="Banners e Slides" />;
      case 'reports': return <ComingSoon title="Relatórios" />;
      default: return <Dashboard />;
    }
  };

  return (
    <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </AdminLayout>
  );
}

export function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminContent />
    </AdminAuthProvider>
  );
}
