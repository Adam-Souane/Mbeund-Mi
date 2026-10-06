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

    render(<BarometreIAPredictive previsions={previsionsCalmes} />);

    expect(screen.getByText('Baromètre IA prédictive')).toBeInTheDocument();
    expect(screen.getByText('FAIBLE')).toBeInTheDocument();
    expect(
      screen.getByText(/Situation sous contrôle, continuez la surveillance/i)
    ).toBeInTheDocument();
  });

  it('calcule et affiche un niveau modéré avec vent moyen sans pluie', () => {
    const previsionsVenteuses = [
      { precipitation: 0, vitesse_vent: 8, temperature: 22 },
      { precipitation: 0, vitesse_vent: 10, temperature: 22 },
    ];

    render(<BarometreIAPredictive previsions={previsionsVenteuses} />);

    expect(screen.getByText('MODÉRÉ')).toBeInTheDocument();
    expect(
      screen.getByText(/Risque modéré : Maintenez une alerte active/i)
    ).toBeInTheDocument();
  });

  it('calcule et affiche un niveau critique sous de fortes précipitations', () => {
    const fortesPluies = [
      { precipitation: 35, vitesse_vent: 40, temperature: 28 },
      { precipitation: 45, vitesse_vent: 50, temperature: 27 },
    ];

    render(<BarometreIAPredictive previsions={fortesPluies} />);

    expect(screen.getByText('CRITIQUE')).toBeInTheDocument();
    expect(
      screen.getByText(/Préparez les mesures d’évacuation d’urgence/i)
    ).toBeInTheDocument();
  });

  it('gère correctement les prévisions nulles ou vides sans planter', () => {
    render(<BarometreIAPredictive previsions={[]} />);
    expect(screen.getByText('FAIBLE')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

describe('EtatsPage', () => {
  it('affiche le message d’accès réservé à l’administrateur', () => {
    render(
      <MemoryRouter>
        <AccesReserveAdmin />
      </MemoryRouter>
    );
    expect(
      screen.getByText('Accès réservé aux administrateurs')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cette page n’est accessible que pour les administrateurs du système.'
      )
    ).toBeInTheDocument();
  });

  it('affiche le message de chargement personnalisé', () => {
    render(
      <MemoryRouter>
        <PageEnChargement message="Synchronisation des capteurs..." />
      </MemoryRouter>
    );
    expect(
      screen.getByText('Synchronisation des capteurs...')
    ).toBeInTheDocument();
  });

  it('affiche le composant d’erreur avec son message', () => {
    render(
      <MemoryRouter>
        <PageEnErreur message="Impossible de charger le flux météo" />
      </MemoryRouter>
    );
    expect(screen.getByText('Erreur')).toBeInTheDocument();
    expect(
      screen.getByText('Impossible de charger le flux météo')
    ).toBeInTheDocument();
  });

  it('affiche l’état sans données avec message par défaut ou personnalisé', () => {
    const { rerender } = render(
      <MemoryRouter>
        <PageSansDonnees />
      </MemoryRouter>
    );
    expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <PageSansDonnees message="Aucun historique sur 72h" />
      </MemoryRouter>
    );
    expect(screen.getByText('Aucun historique sur 72h')).toBeInTheDocument();
  });
});
