import { createContext, useContext, useState, useCallback } from 'react';
import { obtainToken } from '../api/endpoints/auth';
import { rattacherSignalementsAnonymes } from '../api/endpoints/signalements';
import { decodeJwt } from './jwt';
import { getAccessToken, getRefreshToken, getUsername, setTokens, clearTokens } from './tokenStorage';

const AuthContext = createContext(null);
export const ANONYMOUS_REPORTS_STORAGE_KEY = 'mbeund_mi_anonymous_report_ids';

export async function synchroniserSignalementsAnonymes() {
  try {
    const raw = localStorage.getItem(ANONYMOUS_REPORTS_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed) ? parsed : [];
    const ids = entries
      .map((item) => (typeof item === 'object' && item !== null ? item.id : item))
      .filter((id) => id != null && !String(id).startsWith('demo-'));
    if (!ids.length) return 0;
    const res = await rattacherSignalementsAnonymes(ids);
    localStorage.removeItem(ANONYMOUS_REPORTS_STORAGE_KEY);
    return res?.rattaches ?? ids.length;
  } catch {
    return 0;
  }
}

function deduireServiceDepuisIdentifiant(username, role, tokenService) {
  if (role === 'admin') return 'cod';
  if (tokenService && ['bnsp', 'onas', 'mairie', 'cod'].includes(tokenService)) {
    return tokenService;
  }
  const u = (username || '').toLowerCase();
  if (u.includes('onas') || u.includes('hydro') || u.includes('pomp')) return 'onas';
  if (u.includes('mairie') || u.includes('muni') || u.includes('relais')) return 'mairie';
  return 'bnsp';
}

// Reprend la session depuis localStorage si un token y est encore présent
// (évite de renvoyer vers /login à chaque rechargement). Lu dès
// l'initialisation de l'état, et non dans un effet : le premier rendu connaît
// déjà la session, sans second rendu « déconnecté puis connecté ».
function sessionEnregistree() {
  const token = getAccessToken();
  if (!token) return { accessToken: null, role: null, username: null, service: null };
  const payload = decodeJwt(token);
  const role = payload?.role ?? null;
  const username = getUsername();
  const service = role ? deduireServiceDepuisIdentifiant(username, role, payload?.service) : null;
  return { accessToken: token, role, username, service };
}

export function AuthProvider({ children }) {
  const [session] = useState(sessionEnregistree);
  const [accessToken, setAccessToken] = useState(session.accessToken);
  const [role, setRole] = useState(session.role);
  const [username, setUsername] = useState(session.username);
  const [service, setService] = useState(session.service);
  // La session est lue de façon synchrone : elle est prête dès le premier rendu.
  const isReady = true;

  const login = useCallback(async ({ username, password }) => {
    const data = await obtainToken({ username, password });
    setTokens({ access: data.access, refresh: data.refresh, username });
    const payload = decodeJwt(data.access);
    const resolvedRole = payload?.role ?? 'citoyen';
    const resolvedService = deduireServiceDepuisIdentifiant(username, resolvedRole, payload?.service);
    setAccessToken(data.access);
    setRole(resolvedRole);
    setUsername(username);
    setService(resolvedService);
    synchroniserSignalementsAnonymes();
    return resolvedRole;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAccessToken(null);
    setRole(null);
    setUsername(null);
    setService(null);
  }, []);

  const value = {
    accessToken,
    role,
    service,
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
  if (!ctx) {
    return {
      isAuthenticated: false,
      user: null,
      tokens: null,
      login: () => {},
      logout: () => {},
      refreshProfile: () => {},
      register: () => {},
      changePassword: () => {},
      synchroniserSignalementsAnonymes: () => {},
      updateProfileData: () => {},
    };
  }
  return ctx;
}
