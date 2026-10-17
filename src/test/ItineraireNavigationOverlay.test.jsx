import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ItineraireNavigationOverlay from '../citizen/components/ItineraireNavigationOverlay';

describe('ItineraireNavigationOverlay', () => {
  const mockItineraire = {
    distance_km: 1.2,
    temps_marche_min: 16,
    zone_arrivee: {
      id: 2,
      quartier: 'Thiaroye Gare',
      niveau_risque: 'vert',
    },
    instructions: [
      {
        ordre: 1,
        direction: 'depart',
        instruction: 'Départ depuis votre position actuelle',
        ruelle: 'Ruelle 4',
        distance_m: 50,
      },
      {
        ordre: 2,
        direction: 'droite',
        instruction: 'Tourner à droite vers l’école publique',
        ruelle: 'Rue du Marché',
        distance_m: 120,
      },
      {
        ordre: 3,
        direction: 'arrivee',
        instruction: 'Arrivée en zone sûre : Thiaroye Gare',
        ruelle: 'Thiaroye Gare',
        distance_m: 0,
      },
    ],
  };

  it('ne rend rien si aucune donnée itinéraire n’est fournie', () => {
    const { container } = render(<ItineraireNavigationOverlay itineraireData={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('affiche le bandeau initial sur la carte avec le bouton Suivre l’itinéraire', () => {
    const onStart = vi.fn();
    const onClose = vi.fn();

    render(
      <ItineraireNavigationOverlay
        itineraireData={mockItineraire}
        isNavigating={false}
        onStartNavigation={onStart}
        onClose={onClose}
      />
    );

    expect(screen.getByText(/Itinéraire sécurisé prêt/i)).toBeInTheDocument();
    expect(screen.getByText('Vers Thiaroye Gare')).toBeInTheDocument();
    expect(screen.getByText('1.2 km')).toBeInTheDocument();

    const btnSuivre = screen.getByRole('button', { name: /Suivre l’itinéraire/i });
    expect(btnSuivre).toBeInTheDocument();

    fireEvent.click(btnSuivre);
    expect(onStart).toHaveBeenCalledTimes(1);

    const btnFermer = screen.getByTitle(/Fermer l'itinéraire/i);
    fireEvent.click(btnFermer);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('affiche le guidage pas-à-pas en direct lorsque isNavigating est vrai', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    const onClose = vi.fn();

    const { rerender } = render(
      <ItineraireNavigationOverlay
        itineraireData={mockItineraire}
        isNavigating={true}
        currentStepIndex={0}
        onPrevStep={onPrev}
        onNextStep={onNext}
        onClose={onClose}
      />
    );

    expect(screen.getByText(/Guidage en direct/i)).toBeInTheDocument();
    expect(screen.getByText('Étape 1 sur 3')).toBeInTheDocument();
    expect(screen.getByText('Départ depuis votre position actuelle')).toBeInTheDocument();

    // Bouton Précédent désactivé à la première étape
    const btnPrev = screen.getByRole('button', { name: /Précédent/i });
    expect(btnPrev).toBeDisabled();

    // Passer à l'étape suivante
    const btnNext = screen.getByRole('button', { name: /Étape suivante/i });
    fireEvent.click(btnNext);
    expect(onNext).toHaveBeenCalledTimes(1);

    // Rerender à la dernière étape
    rerender(
      <ItineraireNavigationOverlay
        itineraireData={mockItineraire}
        isNavigating={true}
        currentStepIndex={2}
        onPrevStep={onPrev}
        onNextStep={onNext}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Étape 3 sur 3')).toBeInTheDocument();
    expect(screen.getByText(/Arrivée en zone sûre/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Arrivé en zone sûre · Terminer/i })).toBeInTheDocument();
  });
});
