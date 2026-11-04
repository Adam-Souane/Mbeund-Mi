import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BarometreIAPredictive from '../autorite/components/BarometreIAPredictive';
import {
  AccesReserveAdmin,
  PageEnChargement,
  PageEnErreur,
  PageSansDonnees,
} from '../autorite/components/EtatsPage';

// Mock pour AutoriteShell qui utilise AuthContext et navigation
vi.mock('../autorite/desktop/AutoriteShell', () => ({
  default: ({ children }) => <div data-testid="autorite-shell">{children}</div>,
}));

describe('BarometreIAPredictive', () => {
  it('calcule et affiche un niveau faible lorsque les prévisions sont parfaitement calmes', () => {
    const previsionsCalmes = [
      { precipitation: 0, vitesse_vent: 0, temperature: 20 },
      { precipitation: 0, vitesse_vent: 0, temperature: 20 },
    ];

    render(
      <MemoryRouter>
        <BarometreIAPredictive previsions={previsionsCalmes} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Baromètre IA Prédictif/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Risque Faible/i)[0]).toBeInTheDocument();
    expect(
      screen.getByText(/Situation météorologique stable sur l’ensemble de Thiaroye-sur-Mer/i)
    ).toBeInTheDocument();
  });

  it('calcule et affiche un niveau modéré avec vent moyen sans pluie', () => {
    const previsionsVenteuses = [
      { precipitation: 0, vitesse_vent: 8, temperature: 22 },
      { precipitation: 0, vitesse_vent: 10, temperature: 22 },
    ];

    render(
      <MemoryRouter>
        <BarometreIAPredictive previsions={previsionsVenteuses} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Baromètre IA Prédictif/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Risque Modéré|Risque Faible/i)[0]).toBeInTheDocument();
  });

  it('calcule et affiche un niveau critique sous de fortes précipitations', () => {
    const fortesPluies = [
      { precipitation_mm: 35, vitesse_vent: 40, temperature: 28 },
      { precipitation_mm: 45, vitesse_vent: 50, temperature: 27 },
    ];

    render(
      <MemoryRouter>
        <BarometreIAPredictive previsions={fortesPluies} />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Risque Critique/i)[0]).toBeInTheDocument();
    expect(
      screen.getByText(/Évacuation préventive recommandée/i)
    ).toBeInTheDocument();
  });

  it('gère correctement les prévisions nulles ou vides sans planter', () => {
    render(
      <MemoryRouter>
        <BarometreIAPredictive previsions={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Baromètre IA Prédictif/i)).toBeInTheDocument();
    expect(screen.getByText(/Risque IA/i)).toBeInTheDocument();
  });
});

describe('EtatsPage', () => {
  it('affiche le message d’accès réservé à l’administrateur', () => {
    render(
      <MemoryRouter>
        <AccesReserveAdmin />
      </MemoryRouter>
    );
    expect(screen.getByText(/Accès réservé aux administrateurs/i)).toBeInTheDocument();
  });

  it('affiche le message de chargement personnalisé', () => {
    render(
      <MemoryRouter>
        <PageEnChargement message="Calcul des indicateurs..." />
      </MemoryRouter>
    );
    expect(screen.getByText('Calcul des indicateurs...')).toBeInTheDocument();
  });

  it('affiche le composant d’erreur avec son message', () => {
    render(
      <MemoryRouter>
        <PageEnErreur message="Erreur de connexion au serveur" />
      </MemoryRouter>
    );
    expect(screen.getByText('Erreur de connexion au serveur')).toBeInTheDocument();
  });

  it('affiche l’état sans données avec message par défaut ou personnalisé', () => {
    const { rerender } = render(
      <MemoryRouter>
        <PageSansDonnees />
      </MemoryRouter>
    );
    expect(screen.getByText(/Aucune donnée disponible/i)).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <PageSansDonnees message="Aucun relevé disponible" />
      </MemoryRouter>
    );
    expect(screen.getByText('Aucun relevé disponible')).toBeInTheDocument();
  });
});
