import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AlertesPrevisionsPageBody from '../citizen/pages/AlertesPrevisionsPageBody';

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => <div data-testid="citizen-shell">{children}</div>,
}));

vi.mock('../shared/hooks/useAlertes', () => ({
  useAlertesListe: () => ({
    data: {
      results: [
        { id: 1, niveau: 'orange', message: 'Alerte forte pluie', zone_nom: 'Thiaroye Gare', timestamp: '2026-10-07T10:00:00Z' }
      ]
    },
    isLoading: false,
  }),
  useAlertesRecentes: () => ({
    data: {
      results: [
        { id: 1, niveau: 'orange', message: 'Alerte forte pluie', zone_nom: 'Thiaroye Gare', timestamp: '2026-10-07T10:00:00Z' }
      ]
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

describe('AlertesPrevisionsPageBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les alertes et prévisions citoyen', () => {
    renderWithProviders(<AlertesPrevisionsPageBody />);

    expect(screen.getByText(/Prévisions & alertes/i)).toBeInTheDocument();
    expect(screen.getByText('Alerte forte pluie')).toBeInTheDocument();
  });
});
