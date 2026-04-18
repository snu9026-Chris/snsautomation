'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  login: async () => null,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function checkCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('loopdrop-ui='));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(checkCookie);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        setIsLoggedIn(true);
        return null;
      }
      const data = await res.json();
      return data.error || '로그인 실패';
    } catch {
      return '네트워크 오류';
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
