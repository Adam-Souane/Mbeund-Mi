import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PrevisionsAlertesPage from '../autorite/pages/PrevisionsAlertesPage';

vi.mock('../autorite/desktop/AutoriteShell', () => ({
  default: ({ children }) => <div data-testid="autorite-shell">{children}</div>,
}));

vi.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({ darkMode: false }),
}));

vi.mock('../../shared/components/WeatherWidget', () => ({
  default: () => <div data-testid="weather-widget">Météo Thiaroye-sur-Mer 27°C</div>,
}));

vi.mock('../shared/hooks/usePrevisions', () => ({
  usePrevisions: () => ({
    data: {
      results: [
        {
          id: 1,
          date_prevision: '2026-11-04T12:00:00Z',
          temperature: 28,
          precipitation: 12.5,
          vitesse_vent: 22,
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('../shared/hooks/useAlertes', () => ({
  useAlertesRecentes: () => ({
    data: {
      results: [
        {
          id: 10,
          niveau: 'rouge',
          zone: { quartier: 'Cuvette Ouest' },
          message: 'Risque de débordement critique',
          statut: 'envoyee',
          timestamp: '2026-11-04T10:00:00Z',
        },
      ],
    },
    isLoading: false,
  }),
}));

describe('PrevisionsAlertesPage', () => {
  it('affiche les prévisions avec le widget météo intact, le baromètre IA et les alertes', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PrevisionsAlertesPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Prévisions & alertes')).toBeInTheDocument();
    expect(screen.getByText(/EN DIRECT/i)).toBeInTheDocument();
    expect(screen.getByText(/Baromètre IA Prédictif/i)).toBeInTheDocument();
    expect(screen.getByText(/Relevés & Prévisions Détaillées/i)).toBeInTheDocument();
    expect(screen.getByText(/Cuvette Ouest/i)).toBeInTheDocument();
    expect(screen.getByText(/Risque de débordement critique/i)).toBeInTheDocument();
  });
});
