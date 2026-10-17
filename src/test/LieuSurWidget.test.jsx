import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LieuSurWidget from '../citizen/components/LieuSurWidget';

vi.mock('../shared/hooks/useRefuges', () => ({
  useRefuges: () => ({
    data: {
      features: [
        {
          id: 1,
          properties: {
            nom: 'Centre de Santé de Thiaroye',
            type_refuge: 'centre_sante',
            quartier: 'Thiaroye Gare',
            capacite_personnes: 200,
          },
          geometry: {
            coordinates: [-17.3825, 14.7455],
          },
        },
      ],
    },
  }),
}));

describe('LieuSurWidget', () => {
  it('affiche le lieu sûr le plus proche et le bouton d’itinéraire d’évacuation', () => {
    render(
      <MemoryRouter>
        <LieuSurWidget userQuartier="Thiaroye Gare" />
      </MemoryRouter>
    );

    expect(screen.getByText(/Lieu sûr le plus proche/i)).toBeInTheDocument();
    expect(screen.getByText('Centre de Santé de Thiaroye')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Itinéraire d’évacuation/i })).toBeInTheDocument();
  });
});
