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
              valide: false,
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

  it('filtre strictement le contenu selon les onglets Signalements terrain, Entraide & Mobilisation, et Résolus & Sécurisés', () => {
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // 1. Filtre par défaut : Tous les posts
    expect(screen.getByText(/Tous les posts/i)).toBeInTheDocument();

    // 2. Clic sur Signalements terrain
    const btnSignalements = screen.getByRole('button', { name: /Signalements terrain/i });
    fireEvent.click(btnSignalements);
    // Vérifie qu'un post de signalement est affiché
    expect(screen.getByText(/Montée des eaux dans la ruelle basse/i)).toBeInTheDocument();
    // Et qu'un post d'entraide ne s'y trouve pas
    expect(screen.queryByText(/Barricades de sacs de sable installées/i)).not.toBeInTheDocument();

    // 3. Clic sur Entraide & Mobilisation
    const btnEntraide = screen.getByRole('button', { name: /Entraide & Mobilisation/i });
    fireEvent.click(btnEntraide);
    // Le post d'entraide doit être visible
    expect(screen.getByText(/Barricades de sacs de sable installées/i)).toBeInTheDocument();
    // Et le post de signalement ne s'y trouve pas
    expect(screen.queryByText(/Montée des eaux dans la ruelle basse/i)).not.toBeInTheDocument();

    // 4. Clic sur Résolus & Sécurisés
    const btnResolus = screen.getByRole('button', { name: /Résolus & Sécurisés/i });
    fireEvent.click(btnResolus);
    // Le post résolu doit être visible
    expect(screen.getByText(/Passerelle surélevée opérationnelle/i)).toBeInTheDocument();
    // Et les autres ne doivent pas être visibles
    expect(screen.queryByText(/Montée des eaux dans la ruelle basse/i)).not.toBeInTheDocument();
  });
});
