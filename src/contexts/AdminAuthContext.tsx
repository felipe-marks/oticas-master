import React, { createContext, useContext, useEffect, useState } from 'react';

// Versão do schema de sessão — incrementar força logout de todos os tokens antigos
const SESSION_VERSION = 3;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  getToken: () => string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('admin_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        // Invalidar tokens de versões anteriores
        if (
          session.version === SESSION_VERSION &&
          session.token &&
          session.expires_at > Date.now() &&
          session.user
        ) {
          setAdmin(session.user);
        } else {
          // Token antigo ou expirado — limpar
          localStorage.removeItem('admin_session');
        }
      } catch {
        localStorage.removeItem('admin_session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) return { error: data.message || 'Credenciais inválidas' };

      const session = {
        version: SESSION_VERSION,
        user: data.admin,
        token: data.token,
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem('admin_session', JSON.stringify(session));
      setAdmin(data.admin);
      return {};
    } catch {
      return { error: 'Erro de conexão. Tente novamente.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_session');
    setAdmin(null);
  };

  const getToken = (): string | null => {
    try {
      const stored = localStorage.getItem('admin_session');
      if (!stored) return null;
      const session = JSON.parse(stored);
      return session.token || null;
    } catch {
      return null;
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated: !!admin, getToken }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider');
  return ctx;
}
