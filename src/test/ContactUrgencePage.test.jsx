import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ContactUrgencePage from '../autorite/pages/ContactUrgencePage';

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

vi.mock('../shared/hooks/useContactsAlerte', () => ({
  useContactsAlerte: () => ({
    data: {
      count: 2,
      results: [
        {
          id: 1,
          telephone: '+221 77 123 45 67',
          nom: 'Amadou Bâ',
          zone: 1,
          actif: true,
          date_inscription: '2026-10-15T00:00:00Z',
        },
        {
          id: 2,
          telephone: '+221 78 987 65 43',
          nom: 'Fatou Sow',
          zone: 1,
          actif: false,
          date_inscription: '2026-10-20T00:00:00Z',
        },
      ],
    },
    isLoading: false,
  }),
  useCreateContactAlerte: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteContactAlerte: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('ContactUrgencePage', () => {
  it('affiche le poste de commandement des urgences avec les lignes 24/7 et les contacts', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ContactUrgencePage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Contact & urgences')).toBeInTheDocument();
    expect(screen.getByText(/Sapeurs-Pompiers \(BNSP\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ONAS Assainissement/i)).toBeInTheDocument();
    expect(screen.getByText('+221 77 123 45 67')).toBeInTheDocument();
    expect(screen.getByText('Amadou Bâ')).toBeInTheDocument();
    expect(screen.getByText('Inscrire un riverain')).toBeInTheDocument();
  });
});

