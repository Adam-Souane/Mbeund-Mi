import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import TableauDeBordPage from '../autorite/pages/TableauDeBordPage';

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
  }),
}));

vi.mock('../shared/hooks/usePredictions', () => ({
  usePredictions: () => ({
    data: [{ zone: { id: 1 }, niveau_eau_predit_cm: 25, confiance: 90 }],
  }),
}));

vi.mock('../shared/hooks/useAlertes', () => ({
  useAlertesRecentes: () => ({
    data: {
      count: 1,
      results: [
        { id: 10, niveau: 'rouge', message: 'Alerte forte inondation', zone: { quartier: 'Thiaroye Gare' } },
      ],
    },
  }),
}));

vi.mock('../shared/hooks/useSignalements', () => ({
  useSignalementsApercu: () => ({
    data: {
      results: {
        features: [
          { id: 101, properties: { categorie: 'inondation', description: 'Eau rue 5', valide: false } },
        ],
      },
    },
  }),
}));

describe('TableauDeBordPage', () => {
  it('affiche le tableau de bord avec KPI et alertes récentes', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TableauDeBordPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText(/Supervision temps réel/)).toBeInTheDocument();
    expect(screen.getByText('Alerte forte inondation')).toBeInTheDocument();
    expect(screen.getByText('Eau rue 5')).toBeInTheDocument();

  });
});
