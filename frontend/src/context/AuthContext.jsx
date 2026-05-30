import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('atelier_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('atelier_token') || localStorage.getItem('token'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('atelier_token') || localStorage.getItem('token')));

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (active) {
          setUser(response.data.user);
          localStorage.setItem('atelier_user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        if (active) {
          logout();
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, [token]);

  function persistSession(data) {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('atelier_token', data.token);
    localStorage.setItem('token', data.token);
    localStorage.setItem('atelier_user', JSON.stringify(data.user));
  }

  async function login(credentials) {
    const response = await api.post('/auth/login', credentials);
    persistSession(response.data);
    return response.data;
  }

  async function register(payload) {
    const response = await api.post('/auth/register', payload);
    return response.data;
  }

  async function authenticateWithToken(nextToken) {
    if (!nextToken) {
      throw new Error('Authentication token is missing');
    }

    localStorage.setItem('atelier_token', nextToken);
    localStorage.setItem('token', nextToken);
    setToken(nextToken);

    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${nextToken}` },
      });
      const session = { token: nextToken, user: response.data.user };
      persistSession(session);
      return session;
    } catch (error) {
      logout();
      throw error;
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('atelier_token');
    localStorage.removeItem('token');
    localStorage.removeItem('atelier_user');
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === 'admin',
      login,
      register,
      authenticateWithToken,
      logout
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
