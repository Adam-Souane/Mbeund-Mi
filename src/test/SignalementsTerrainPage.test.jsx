import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import SignalementsTerrainPage from '../autorite/pages/SignalementsTerrainPage';

vi.mock('../autorite/desktop/AutoriteShell', () => ({
  default: ({ children }) => <div data-testid="autorite-shell">{children}</div>,
}));

vi.mock('../shared/hooks/useSignalements', () => ({
  useSignalements: () => ({
    data: {
      count: 2,
      results: {
        features: [
          {
            id: 1,
            properties: {
              categorie: 'inondation',
              description: 'Eau stagnante Grand Yoff',
              date_creation: '2026-10-08T10:00:00Z',
              valide: false,
              citoyen_prenom: 'Moussa',
              citoyen_nom: 'Diop',
              citoyen_telephone: '+221771234567',
              citoyen_quartier: 'Grand Yoff',
              niveau_eau_estime: 'eleve',
            },
          },
          {
            id: 2,
            properties: {
              categorie: 'egouts',
              description: 'Canalisation bouchée',
              date_creation: '2026-10-08T09:00:00Z',
              valide: true,
              citoyen_prenom: 'Fatou',
              citoyen_nom: 'Sow',
            },
          },
        ],
      },
    },
    isLoading: false,
  }),
  useValiderSignalement: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  }),
}));

describe('SignalementsTerrainPage', () => {
  it('affiche la liste des signalements terrain avec les filtres', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SignalementsTerrainPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Signalements terrain')).toBeInTheDocument();
    expect(screen.getByText('Eau stagnante Grand Yoff')).toBeInTheDocument();
    expect(screen.getByText('Moussa Diop')).toBeInTheDocument();
    expect(screen.getByText('Valider')).toBeInTheDocument();
  });
});
