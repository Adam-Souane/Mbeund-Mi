import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import StatistiquesPage from '../autorite/pages/StatistiquesPage';

vi.mock('../autorite/desktop/AutoriteShell', () => ({
  default: ({ children }) => <div data-testid="autorite-shell">{children}</div>,
}));

vi.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({ darkMode: false }),
}));

vi.mock('../shared/hooks/useZones', () => ({
  useZones: () => ({
    isLoading: false,
    data: {
      features: [
        {
          id: 1,
          properties: {
            quartier: 'Thiaroye Gare',
            niveau_risque: 'rouge',
            score_risque_moyen: 0.85,
            seuil_rouge: 0.85,
          },
        },
        {
          id: 2,
          properties: {
            quartier: 'Médina Gounass',
            niveau_risque: 'orange',
            score_risque_moyen: 0.65,
            seuil_rouge: 0.80,
          },
        },
      ],
    },
  }),
}));

vi.mock('../shared/hooks/useAlertes', () => ({
  useAlertesRecentes: () => ({
    isLoading: false,
    data: {
      count: 2,
      results: [
        { id: 10, niveau: 'rouge', message: 'Alerte rouge' },
        { id: 11, niveau: 'orange', message: 'Alerte orange' },
      ],
    },
  }),
}));

vi.mock('../shared/hooks/useHistoriqueRisque', () => ({
  useHistoriqueRisque: () => ({
    isLoading: false,
    data: {
      results: [
        { id: 1, date_calcul: '2026-11-04T12:00:00Z', score_risque: 0.75 },
      ],
    },
  }),
}));

vi.mock('../shared/hooks/useSignalements', () => ({
  useSignalementsApercu: () => ({
    data: {
      results: {
        features: [
          { id: 101, properties: { categorie: 'inondation', valide: true } },
          { id: 102, properties: { categorie: 'caniveau', valide: true } },
        ],
      },
    },
  }),
}));

vi.mock('../shared/hooks/usePrevisions', () => ({
  usePrevisions: () => ({
    data: {
      results: [
        { id: 1, precipitation_mm: 10.8, date_prevision: '2026-11-04' },
      ],
    },
  }),
}));

vi.mock('../shared/hooks/useVulnerabilite', () => ({
  useProfilsVulnerabilite: () => ({
    data: {
      results: [
        { id: 1, personne_mobilite_reduite: true, enfants_bas_age: 2, personnes_agees: 1 },
      ],
    },
  }),
}));

vi.mock('../shared/hooks/useRelaisQuartier', () => ({
  useRelaisQuartierListe: () => ({
    data: {
      results: [{ id: 1, verifie: true }],
    },
  }),
}));

// Mock ResponsiveContainer de recharts pour JSDOM
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  };
});

describe('StatistiquesPage', () => {
  it('affiche les 4 domaines de données différents (météo, terrain, humain, territorial) et leurs graphiques', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StatistiquesPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Titre et header
    expect(screen.getByText('Statistiques & Bilan')).toBeInTheDocument();
    expect(screen.getByText(/Observatoire Municipal · Thiaroye-sur-Mer/i)).toBeInTheDocument();

    // 4 KPIs représentatifs de 4 domaines différents
    expect(screen.getByText(/Pluviométrie Max/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Signalements Citoyens/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Personnes Recensées/i)).toBeInTheDocument();
    expect(screen.getByText(/Zone Plus Vulnérable/i)).toBeInTheDocument();

    // 4 Graphiques variés
    expect(screen.getByText(/Relevés Pluviométriques Journaliers/i)).toBeInTheDocument();
    expect(screen.getByText(/Signalements par Nature d'Incident/i)).toBeInTheDocument();
    expect(screen.getByText(/Recensement des Populations Vulnérables/i)).toBeInTheDocument();
    expect(screen.getByText(/Score de Risque Moyen par Secteur/i)).toBeInTheDocument();

    // Palmarès des zones
    expect(screen.getByText(/Palmarès de Vulnérabilité des Secteurs/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Thiaroye Gare/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Médina Gounass/i)).toBeInTheDocument();
  });
});
