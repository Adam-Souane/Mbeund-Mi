import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ChatPageBody from '../citizen/pages/ChatPageBody';
import * as chatEndpoints from '../api/endpoints/chat';

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => <div data-testid="citizen-shell">{children}</div>,
}));

vi.mock('../shared/hooks/useZones', () => ({
  useZones: () => ({
    data: {
      features: [
        { id: 1, properties: { quartier: 'Thiaroye Gare', niveau_risque: 'rouge', score_risque_moyen: 85 } },
      ],
    },
  }),
}));

vi.mock('../shared/hooks/usePrevisions', () => ({
  usePrevisions: () => ({
    data: {
      results: [
        { cumul_pluie_24h_mm: 45, date_heure: '2026-10-07T12:00:00Z' },
      ],
    },
  }),
}));

vi.mock('../api/endpoints/chat', () => ({
  askNdam: vi.fn(),
}));

function renderWithProviders(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ChatPageBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    chatEndpoints.askNdam.mockResolvedValue({
      reply: 'Réponse de test NDAM',
    });
  });

  it('affiche le message d accueil de NDAM', () => {
    renderWithProviders(<ChatPageBody />);

    expect(screen.getByText(/Bonjour, je suis NDAM/i)).toBeInTheDocument();
    expect(screen.getByText('Quel est le niveau de risque actuel ?')).toBeInTheDocument();
  });

  it('envoie une question quand l utilisateur clique sur une suggestion', async () => {
    renderWithProviders(<ChatPageBody />);

    const suggestionBtn = screen.getByText('Quel est le niveau de risque actuel ?');
    fireEvent.click(suggestionBtn);

    await waitFor(() => {
      expect(chatEndpoints.askNdam.mock.calls[0][0]).toBe('Quel est le niveau de risque actuel ?');
      expect(screen.getByText('Réponse de test NDAM')).toBeInTheDocument();
    });
  });

  it('envoie une question personnalisée via le formulaire', async () => {
    renderWithProviders(<ChatPageBody />);

    const input = screen.getByPlaceholderText(/Écrivez votre question/i);
    fireEvent.change(input, { target: { value: 'Comment faire un signalement ?' } });

    const form = input.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(chatEndpoints.askNdam.mock.calls[0][0]).toBe('Comment faire un signalement ?');
    });
  });
});
