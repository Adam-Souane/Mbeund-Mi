import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import RegistreCommunautairePage from '../autorite/pages/RegistreCommunautairePage';

vi.mock('../autorite/desktop/AutoriteShell', () => ({
  default: ({ children }) => <div data-testid="autorite-shell">{children}</div>,
}));

vi.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({ darkMode: false }),
}));

vi.mock('../shared/hooks/useZones', () => ({
  useZones: () => ({
    data: { features: [{ id: 1, properties: { quartier: 'Thiaroye Gare' } }] },
  }),
}));

vi.mock('../shared/hooks/useVulnerabilite', () => ({
  useProfilsVulnerabilite: () => ({
    data: {
      count: 1,
      results: [
        {
          id: 10,
          username: 'Aissatou Diallo',
          zone: 1,
          est_prioritaire: true,
          personne_mobilite_reduite: true,
          enfants_bas_age: 2,
          personnes_agees: 1,
          notes: 'Foyer au rez-de-chaussée',
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('../shared/hooks/useRelaisQuartier', () => ({
  useRelaisQuartierListe: () => ({
    data: {
      count: 1,
      results: [
        {
          id: 20,
          username: 'Modou Fall',
          zone: 1,
          verifie: false,
          date_inscription: '2026-10-01T00:00:00Z',
        },
      ],
    },
    isLoading: false,
  }),
  useVerifierRelais: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('RegistreCommunautairePage', () => {
  it('affiche le registre communautaire avec les profils et relais', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RegistreCommunautairePage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Registre communautaire')).toBeInTheDocument();
    expect(screen.getByText(/Aissatou Diallo/i)).toBeInTheDocument();
    expect(screen.getByText(/Modou Fall/i)).toBeInTheDocument();
    expect(screen.getByText(/Accréditer ✓/i)).toBeInTheDocument();
  });
});

