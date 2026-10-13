import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PredictionsDashboard from '../autorite/pages/PredictionsDashboard';

vi.mock('../autorite/desktop/AutoriteShell', () => ({
  default: ({ children }) => <div data-testid="autorite-shell">{children}</div>,
}));

vi.mock('../shared/hooks/useZones', () => ({
  useZones: () => ({
    data: {
      features: [
        { id: 1, properties: { quartier: 'Thiaroye Gare', niveau_risque: 'rouge', score_risque_moyen: 85 } },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('../shared/hooks/usePrevisions', () => ({
  usePrevisions: () => ({
    data: { results: [] },
    isLoading: false,
  }),
}));

vi.mock('../shared/hooks/useAlertes', () => ({
  useAlertesRecentes: () => ({
    data: { results: [] },
    isLoading: false,
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

describe('PredictionsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le tableau de bord des prédictions IA', () => {
    renderWithProviders(<PredictionsDashboard />);

    expect(screen.getByText(/Dashboard Prédictions/i)).toBeInTheDocument();
    expect(screen.getByText('Thiaroye Gare')).toBeInTheDocument();
  });
});
