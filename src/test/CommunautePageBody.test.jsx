import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CommunautePageBody from '../citizen/pages/CommunautePageBody';

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => <div data-testid="citizen-shell">{children}</div>,
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    username: 'Amadou Test',
    user: { prenom: 'Amadou', nom: 'Diallo' },
  }),
}));

vi.mock('../shared/hooks/useSignalements', () => ({
  useSignalementsApercu: () => ({
    data: {
      results: {
        features: [
          {
            properties: {
              id: 999,
              citoyen_prenom: 'Fatou',
              citoyen_nom: 'Sow',
              citoyen_quartier: 'Ndakhane',
              date_creation: '2026-10-16T12:00:00Z',
              categorie: 'Eau stagnante',
              description: 'Inondation ruelle 5',
              valide: true,
              photo: null,
            },
          },
        ],
      },
    },
    isLoading: false,
  }),
}));

describe('CommunautePageBody', () => {
  it('affiche le header, les stories 24h et le bouton Nouveau post à droite', () => {
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Header intact
    expect(screen.getByText(/Espace Communauté · Thiaroye/i)).toBeInTheDocument();

    // Stories avec badge éphémère 24h
    expect(screen.getByText(/Stories du terrain · En direct/i)).toBeInTheDocument();
    expect(screen.getByText(/Éphémère · Expire dans 24h/i)).toBeInTheDocument();

    // Bouton Nouveau post
    const nouveauPostBtn = screen.getByRole('button', { name: /Nouveau post/i });
    expect(nouveauPostBtn).toBeInTheDocument();
  });

  it('ouvre la popup modale de publication au clic sur Nouveau post et publie un message', () => {
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Au début la modale est fermée
    expect(screen.queryByText(/Nouveau post communautaire/i)).not.toBeInTheDocument();

    // Clic sur le bouton
    const nouveauPostBtn = screen.getByRole('button', { name: /Nouveau post/i });
    fireEvent.click(nouveauPostBtn);

    // La modale s'ouvre
    expect(screen.getByText(/Nouveau post communautaire/i)).toBeInTheDocument();
    expect(screen.getByText(/Publication durable · Visible plusieurs jours par les riverains/i)).toBeInTheDocument();

    // Remplissage du texte
    const textarea = screen.getByPlaceholderText(/Que se passe-t-il dans votre ruelle/i);
    fireEvent.change(textarea, { target: { value: 'Passage bloqué par les eaux à Ndakhane' } });

    // Soumission du post
    const submitBtn = screen.getByRole('button', { name: /Publier le post/i });
    fireEvent.click(submitBtn);

    // Le nouveau post s'affiche dans le fil
    expect(screen.getByText(/Passage bloqué par les eaux à Ndakhane/i)).toBeInTheDocument();
  });
});
