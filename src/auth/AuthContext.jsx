import { createContext, useContext, useState, useCallback } from 'react';
import { obtainToken } from '../api/endpoints/auth';
import { decodeJwt } from './jwt';
import { getAccessToken, getRefreshToken, getUsername, setTokens, clearTokens } from './tokenStorage';

const AuthContext = createContext(null);

// Reprend la session depuis localStorage si un token y est encore présent
// (évite de renvoyer vers /login à chaque rechargement). Lu dès
// l'initialisation de l'état, et non dans un effet : le premier rendu connaît
// déjà la session, sans second rendu « déconnecté puis connecté ».
function sessionEnregistree() {
  const token = getAccessToken();
  if (!token) return { accessToken: null, role: null, username: null };
  return { accessToken: token, role: decodeJwt(token)?.role ?? null, username: getUsername() };
}

export function AuthProvider({ children }) {
  const [session] = useState(sessionEnregistree);
  const [accessToken, setAccessToken] = useState(session.accessToken);
  const [role, setRole] = useState(session.role);
  const [username, setUsername] = useState(session.username);
  // La session est lue de façon synchrone : elle est prête dès le premier rendu.
  const isReady = true;

  const login = useCallback(async ({ username, password }) => {
    const data = await obtainToken({ username, password });
    setTokens({ access: data.access, refresh: data.refresh, username });
    const payload = decodeJwt(data.access);
    setAccessToken(data.access);
    setRole(payload?.role ?? 'citoyen');
    setUsername(username);
    return payload?.role ?? 'citoyen';
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAccessToken(null);
    setRole(null);
    setUsername(null);
  }, []);

  const value = {
    accessToken,
    role,
    username,
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
