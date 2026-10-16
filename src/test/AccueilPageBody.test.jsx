import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AccueilPageBody from '../citizen/pages/AccueilPageBody';

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => <div data-testid="citizen-shell">{children}</div>,
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, prenom: 'Mamadou', nom: 'Diop', telephone: '+221771234567', quartier: 'Thiaroye Gare' },
    isAuthenticated: true,
  }),
}));

vi.mock('../shared/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    addNotification: vi.fn(),
  }),
}));

vi.mock('../shared/hooks/useZones', () => ({
  useZones: () => ({
    data: {
      features: [
        { id: 1, properties: { quartier: 'Thiaroye Gare', niveau_risque: 'rouge', score_risque_moyen: 80 } },
      ],
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('../shared/hooks/usePredictions', () => ({
  usePredictions: () => ({
    data: [],
  }),
}));

vi.mock('../shared/hooks/useAlertes', () => ({
  useAlertesRecentes: () => ({
    data: { results: [] },
  }),
}));

vi.mock('../shared/hooks/usePrevisions', () => ({
  usePrevisions: () => ({
    data: { results: [] },
  }),
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

describe('AccueilPageBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le message de bienvenue et les raccourcis citoyen', () => {
    renderWithProviders(<AccueilPageBody />);

    expect(screen.getByText(/Bonjour/i)).toBeInTheDocument();
    expect(screen.getAllByText('Thiaroye Gare').length).toBeGreaterThan(0);
    expect(screen.getByText('Signaler')).toBeInTheDocument();
    expect(screen.getByText('Carte')).toBeInTheDocument();
  });
});
