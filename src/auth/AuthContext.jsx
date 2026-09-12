import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { obtainToken } from '../api/endpoints/auth';
import { decodeJwt } from './jwt';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [role, setRole] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Au montage : reprend la session depuis localStorage si un token y est
  // encore présent (évite de renvoyer vers /login à chaque rechargement).
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const payload = decodeJwt(token);
      setAccessToken(token);
      setRole(payload?.role ?? null);
    }
    setIsReady(true);
  }, []);

  const login = useCallback(async ({ username, password }) => {
    const data = await obtainToken({ username, password });
    setTokens({ access: data.access, refresh: data.refresh });
    const payload = decodeJwt(data.access);
    setAccessToken(data.access);
    setRole(payload?.role ?? 'citoyen');
    return payload?.role ?? 'citoyen';
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAccessToken(null);
    setRole(null);
  }, []);

  const value = {
    accessToken,
    role,
    isAuthenticated: !!accessToken,
    isReady,
    login,
    logout,
    // Exposé pour un éventuel appel manuel (ex: après une longue période
    // d'inactivité) — l'intercepteur axios gère déjà le cas 401 lui-même.
    refreshTokenValue: getRefreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>.');
  return ctx;
}
