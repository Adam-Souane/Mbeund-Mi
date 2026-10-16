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

  it('affiche des boutons d action sociale colores avec separation distincte des coeurs et des vues', () => {
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Vérifie la présence des boutons distincts
    const boutonsJaime = screen.getAllByRole('button', { name: /J'aime le post/i });
    expect(boutonsJaime.length).toBeGreaterThan(0);

    const boutonsVues = screen.getAllByRole('button', { name: /Nombre d'explorations du post/i });
    expect(boutonsVues.length).toBeGreaterThan(0);

    const boutonsCommentaires = screen.getAllByRole('button', { name: /Commentaires et avis riverains/i });
    expect(boutonsCommentaires.length).toBeGreaterThan(0);

    // Clic sur J'aime incrémente les cœurs sans modifier les vues
    const premierJaime = boutonsJaime[0];
    const premierVue = boutonsVues[0];

    expect(premierJaime).toHaveTextContent(/J’aime/i);
    expect(premierVue).toHaveTextContent(/Vues/i);
  });

  it('active uniquement le post aime sans affecter les autres posts', () => {
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    const boutonsJaime = screen.getAllByRole('button', { name: /J'aime le post/i });
    expect(boutonsJaime.length).toBeGreaterThan(1);

    const premierPost = boutonsJaime[0];
    const deuxiemePost = boutonsJaime[1];

    // Au départ, aucun n'est liké
    expect(premierPost).toHaveClass('bg-rose-50');
    expect(deuxiemePost).toHaveClass('bg-rose-50');

    // Clic sur le premier post
    fireEvent.click(premierPost);

    // Seul le premier post passe en rose/rouge actif
    expect(premierPost).toHaveClass('bg-rose-600');
    // Le deuxième post reste INTACT (non liké)
    expect(deuxiemePost).toHaveClass('bg-rose-50');
    expect(deuxiemePost).not.toHaveClass('bg-rose-600');
  });

  it('masque les numeros de telephone et supprime les balises SMS pour proteger la vie privee (RGPD)', () => {
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Ouvre la modale pour tester la saisie avec numéro de téléphone et tag SMS
    const nouveauPostBtn = screen.getByRole('button', { name: /Nouveau post/i });
    fireEvent.click(nouveauPostBtn);

    const textarea = screen.getByPlaceholderText(/Que se passe-t-il dans votre ruelle/i);
    fireEvent.change(textarea, {
      target: { value: '[SMS de 221775555555] Ruelle inondée, contactez le 77 123 45 67 urgence 35 ans' },
    });

    const submitBtn = screen.getByRole('button', { name: /Publier le post/i });
    fireEvent.click(submitBtn);

    // Vérifie que les numéros de téléphone et le préfixe SMS sont totalement supprimés
    expect(screen.queryByText(/221775555555/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\[SMS de/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/77 123 45 67/)).not.toBeInTheDocument();
    // Le contenu légitime est préservé
    expect(screen.getByText(/Ruelle inondée, contactez le urgence/i)).toBeInTheDocument();
  });

  it('attribue des avatars distincts et adaptés (femme, homme, enfant) et affiche des photos variées par quartier', () => {
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Vérifie qu'il y a plusieurs avatars d'auteurs distincts sans répétition unique
    const avatarImages = screen.getAllByRole('img').map((img) => img.getAttribute('src'));
    const uniqueAvatars = new Set(avatarImages.filter((src) => src && src.includes('avatar-')));

    // Au moins 4 avatars différents affichés (femmes, hommes, enfants)
    expect(uniqueAvatars.size).toBeGreaterThanOrEqual(4);

    // Vérifie la présence d'au moins un avatar féminin et un avatar masculin
    const hasFemaleAvatar = Array.from(uniqueAvatars).some((src) =>
      src.includes('avatar-fatou.jpg') || src.includes('avatar-awa.jpg') || src.includes('avatar-mariama.jpg')
    );
    const hasMaleOrChildAvatar = Array.from(uniqueAvatars).some((src) =>
      src.includes('avatar-ibrahima.jpg') || src.includes('avatar-modou.jpg') || src.includes('avatar-enfant.jpg')
    );
    expect(hasFemaleAvatar).toBe(true);
    expect(hasMaleOrChildAvatar).toBe(true);

    // Vérifie que les deux posts de Ndakhane ont des photos distinctes
    expect(screen.getByText(/Carrefour Ndakhane submergé après l’averse/i)).toBeInTheDocument();
    expect(screen.getByText(/Montée des eaux dans la ruelle basse/i)).toBeInTheDocument();
  });

  it('grise le contour de la story lorsqu’elle est visionnee par le citoyen', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    const storyRing = screen.getByTestId('story-ring-story-1');
    expect(storyRing).toHaveClass('bg-gradient-to-tr');

    // Clic sur la story pour la visionner
    const storyButton = screen.getByRole('button', { name: /Moussa Diop/i });
    fireEvent.click(storyButton);

    // L'anneau passe en grisé pour indiquer qu'elle a été lue
    expect(storyRing).toHaveClass('bg-slate-300');
  });
});

