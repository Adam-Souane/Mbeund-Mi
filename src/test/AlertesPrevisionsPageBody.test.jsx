import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AlertesPrevisionsPageBody from '../citizen/pages/AlertesPrevisionsPageBody';
import * as useAlertesModule from '../shared/hooks/useAlertes';
import * as useSignalementsModule from '../shared/hooks/useSignalements';

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
  useAlertesRecentes: vi.fn(() => ({
    data: {
      results: [
        { id: 1, niveau: 'orange', message: 'Alerte forte pluie', zone_nom: 'Thiaroye Gare', timestamp: '2026-10-07T10:00:00Z' }
      ]
    },
    isLoading: false,
  })),
}));

vi.mock('../shared/hooks/useSignalements', () => ({
  useSignalementsApercu: vi.fn(() => ({
    data: {
      results: [
        {
          id: 101,
          description: 'Passage piéton submergé devant le marché',
          categorie: 'inondation',
          niveau_eau_estime: 'modere',
          valide: true,
          citoyen_quartier: 'Thiaroye Gare',
          date_creation: '2026-10-07T11:00:00Z',
        },
      ],
    },
    isLoading: false,
  })),
}));

vi.mock('../shared/hooks/usePrevisions', () => ({
  usePrevisions: () => ({
    data: {
      results: [
        { id: 1, temperature_c: 29, precipitation_mm: 3.2, vitesse_vent: 20, humidity_percent: 75, date_prevision: '2026-10-07' }
      ]
    },
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

  it('affiche les alertes et prévisions citoyen ainsi que la vigilance citoyenne', () => {
    renderWithProviders(<AlertesPrevisionsPageBody />);

    expect(screen.getByText(/Prévisions & alertes/i)).toBeInTheDocument();
    expect(screen.getByText('Alerte forte pluie')).toBeInTheDocument();
    expect(screen.getByText(/Passage piéton submergé devant le marché/i)).toBeInTheDocument();
    expect(screen.getByText(/Prévisions des 7 prochains jours/i)).toBeInTheDocument();
  });

  it('permet de filtrer entre tous, alertes officielles et vigilance citoyenne', () => {
    renderWithProviders(<AlertesPrevisionsPageBody />);

    // Filtrer par alertes officielles
    const alertesBtn = screen.getByRole('button', { name: /Alertes officielles/i });
    fireEvent.click(alertesBtn);
    expect(screen.getByText('Alerte forte pluie')).toBeInTheDocument();
    expect(screen.queryByText(/Passage piéton submergé devant le marché/i)).not.toBeInTheDocument();

    // Filtrer par vigilance citoyenne
    const signalementsBtn = screen.getByRole('button', { name: /Vigilance citoyenne/i });
    fireEvent.click(signalementsBtn);
    expect(screen.getByText(/Passage piéton submergé devant le marché/i)).toBeInTheDocument();
    expect(screen.queryByText('Alerte forte pluie')).not.toBeInTheDocument();
  });

  it('affiche la carte de sérénité quand aucune alerte ni signalement n’est actif', () => {
    vi.spyOn(useAlertesModule, 'useAlertesRecentes').mockReturnValue({
      data: { results: [] },
      isLoading: false,
    });
    vi.spyOn(useSignalementsModule, 'useSignalementsApercu').mockReturnValue({
      data: { results: [] },
      isLoading: false,
    });

    renderWithProviders(<AlertesPrevisionsPageBody />);

    expect(screen.getByText(/Vigilance calme/i)).toBeInTheDocument();
    expect(screen.getByText(/Vigilance Verte · Situation calme/i)).toBeInTheDocument();
    expect(screen.getByText(/Urgences Sapeurs-Pompiers/i)).toBeInTheDocument();
  });
});
