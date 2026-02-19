import React, { createContext, useContext, useEffect, useState } from 'react';

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
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const stored = localStorage.getItem('admin_session');
      if (!stored) { setLoading(false); return; }

      try {
        const session = JSON.parse(stored);
        if (!session.token || session.expires_at <= Date.now()) {
          localStorage.removeItem('admin_session');
          setLoading(false);
          return;
        }

        // Validar o token fazendo uma chamada real à API
        const res = await fetch('/api/admin?action=dashboard', {
          headers: { Authorization: `Bearer ${session.token}` }
        });

        if (res.ok) {
          setAdmin(session.user);
        } else {
          // Token inválido — limpar e forçar novo login
          localStorage.removeItem('admin_session');
        }
      } catch {
        localStorage.removeItem('admin_session');
      }
      setLoading(false);
    };

    validateSession();
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

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider');
  return ctx;
}
