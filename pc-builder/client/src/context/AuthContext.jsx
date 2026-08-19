import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  async function refreshMe() {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    refreshMe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      setUser,
      async login(payload) {
        const { data } = await api.post('/auth/login', payload);
        setUser(data.user);
        return data;
      },
      async register(payload) {
        const { data } = await api.post('/auth/register', payload);
        setUser(data.user);
        return data;
      },
      async logout() {
        await api.post('/auth/logout');
        setUser(null);
      },
    }),
    [user, ready]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
