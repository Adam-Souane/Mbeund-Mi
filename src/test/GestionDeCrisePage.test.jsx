import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import GestionDeCrisePage from '../autorite/pages/GestionDeCrisePage';
import client from '../api/client';

vi.mock('../autorite/desktop/AutoriteShell', () => ({
  default: ({ children }) => <div data-testid="autorite-shell">{children}</div>,
}));

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('../shared/hooks/useZones', () => ({
  useZones: () => ({
    data: {
      features: [
        { id: 1, properties: { quartier: 'Thiaroye Gare', niveau_risque: 'orange' } },
        { id: 2, properties: { quartier: 'Tally Diallo', niveau_risque: 'jaune' } },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('../shared/hooks/useAlertes', () => ({
  useAlertesListe: () => ({
    data: {
      results: [
        {
          id: 101,
          zone: 1,
          zone_nom: 'Thiaroye Gare',
          niveau: 'rouge',
          message: 'Eau montante à Thiaroye',
          statut: 'en_attente',
          timestamp: '2026-10-07T00:00:00Z',
        },
      ],
      count: 1,
    },
    isLoading: false,
    refetch: vi.fn(),
  }),
  useCreateAlerte: () => ({
    mutate: vi.fn((data, options) => {
      options?.onSuccess?.();
    }),
    isPending: false,
    isError: false,
  }),
  useUpdateAlerteStatut: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../shared/hooks/useEnregistrerTriageAppel', () => ({
  useEnregistrerTriageAppel: () => ({
    mutate: vi.fn(),
    isPending: false,
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

describe('GestionDeCrisePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre et les éléments majeurs de gestion de crise', () => {
    renderWithProviders(<GestionDeCrisePage />);

    expect(screen.getByText(/Gestion de Crise/i)).toBeInTheDocument();
    expect(screen.getByText(/Émettre une nouvelle alerte/i)).toBeInTheDocument();
    expect(screen.getByText('Thiaroye Gare')).toBeInTheDocument();
  });

  it('permet la saisie du formulaire d alerte', () => {
    renderWithProviders(<GestionDeCrisePage />);

    const textarea = screen.getByPlaceholderText(/Montée d'eau rapide signalée/i);
    fireEvent.change(textarea, { target: { value: 'Alerte maximale sur le secteur' } });

    expect(textarea.value).toBe('Alerte maximale sur le secteur');
  });
});
