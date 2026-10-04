import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const showToast = vi.fn();
const invalidateQueries = vi.fn();

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock('../shared/toast/ToastContext', () => ({ useToast: () => ({ showToast }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries }) }));

// Faux WebSocket : garde la dernière instance pour simuler le serveur.
class FauxWebSocket {
  static derniere = null;

  constructor(url, protocoles) {
    this.url = url;
    this.protocoles = protocoles;
    this.close = vi.fn();
    FauxWebSocket.derniere = this;
  }

  recevoir(message) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

describe('useAlertesSocket', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_WS_URL', 'wss://serveur/ws/alertes/');
    vi.stubGlobal('WebSocket', FauxWebSocket);
    localStorage.setItem('mbeund_access_token', 'jeton.de.test');
    showToast.mockClear();
    invalidateQueries.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  async function monter() {
    const { useAlertesSocket } = await import('../realtime/useAlertesSocket');
    return renderHook(() => useAlertesSocket());
  }

  it('transmet le jeton dans le sous-protocole, jamais dans l’URL', async () => {
    await monter();
    const socket = FauxWebSocket.derniere;
    expect(socket.url).toBe('wss://serveur/ws/alertes/');
    // Pas d'espace : « Bearer <jeton> » est refusé par les navigateurs
    expect(socket.protocoles).toEqual(['mbeund.jwt', 'jeton.de.test']);
  });

  it('affiche une nouvelle alerte et rafraîchit la liste', async () => {
    await monter();
    act(() =>
      FauxWebSocket.derniere.recevoir({
        type: 'alerte',
        data: { niveau: 'rouge', message: 'Montée des eaux', zone: { quartier: 'Thiaroye Gare' } },
      })
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['alertes'] });
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ categorie: 'alerte', niveau: 'rouge', message: 'Montée des eaux' })
    );
    expect(showToast.mock.calls[0][0].title).toContain('Thiaroye Gare');
  });

  it('traite les signalements et SMS citoyens, ignore les autres messages', async () => {
    await monter();
    act(() => FauxWebSocket.derniere.recevoir({ type: 'sms', data: { contenu_sms: 'Eau rue 10' } }));
    expect(showToast).toHaveBeenLastCalledWith(expect.objectContaining({ categorie: 'sms', message: 'Eau rue 10' }));
    act(() => FauxWebSocket.derniere.recevoir({ type: 'pong' }));
    act(() => FauxWebSocket.derniere.onmessage({ data: 'pas du JSON' }));
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it('ferme la connexion au démontage', async () => {
    const { unmount } = await monter();
    unmount();
    expect(FauxWebSocket.derniere.close).toHaveBeenCalled();
  });
});
