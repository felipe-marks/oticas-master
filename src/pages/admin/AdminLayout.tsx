import React, { useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  LayoutDashboard, Package, Tag, Percent, ShoppingCart,
  Users, Settings, LogOut, Menu, X, Bell, ChevronDown,
  Glasses, Calendar, Mail, Image, BarChart2
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'categories', label: 'Categorias', icon: Tag },
  { id: 'promotions', label: 'Promoções', icon: Percent },
  { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'appointments', label: 'Agendamentos', icon: Calendar },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
  { id: 'banners', label: 'Banners', icon: Image },
  { id: 'reports', label: 'Relatórios', icon: BarChart2 },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function AdminLayout({ children, currentPage, onNavigate }: AdminLayoutProps) {
  const { admin, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-30 transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
          <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Glasses className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Óticas Master</p>
            <p className="text-xs text-gray-400">Painel Admin</p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 flex-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-amber-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {admin?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{admin?.name}</p>
              <p className="text-xs text-gray-400 truncate">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800 capitalize">
            {navItems.find(n => n.id === currentPage)?.label || 'Painel'}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-600 hover:text-amber-700 font-medium hidden sm:block"
            >
              Ver site →
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
