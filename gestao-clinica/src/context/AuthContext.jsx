import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest, readResponseData } from '@/lib/api';

const AUTH_TOKEN_KEY = 'medsystem.auth.token';

const AuthContext = createContext(null);

function clearStoredSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearStoredSession();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await apiRequest('/auth/me', { token });
        if (!response.ok) {
          throw new Error('Sessão inválida.');
        }
        const payload = await readResponseData(response);
        if (!active) return;
        setUser(payload?.user || null);
      } catch {
        if (!active) return;
        clearSession();
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async ({ email, senha }) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, senha },
    });
    const payload = await readResponseData(response);

    if (!response.ok) {
      const message = payload?.detail || payload?.message || 'Credenciais inválidas.';
      throw new Error(typeof message === 'string' ? message : 'Credenciais inválidas.');
    }

    localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
    setToken(payload.token);
    setUser(payload.user);
    return payload.user;
  }, []);

  const logout = useCallback(async () => {
    const currentToken = token || localStorage.getItem(AUTH_TOKEN_KEY);
    if (currentToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        token: currentToken,
      }).catch(() => {});
    }
    clearSession();
  }, [clearSession, token]);

  const apiFetch = useCallback(async (path, options = {}) => {
    const response = await apiRequest(path, {
      ...options,
      token,
    });

    if (response.status === 401 && token) {
      clearSession();
    }

    return response;
  }, [clearSession, token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        apiFetch,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
