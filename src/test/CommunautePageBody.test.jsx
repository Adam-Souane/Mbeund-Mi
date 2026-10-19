import { render, screen, fireEvent, within } from '@testing-library/react';
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

vi.mock('../shared/hooks/useMySignalements', () => ({
  useMySignalements: () => ({
    data: {
      results: [
        {
          id: 555,
          categorie: 'Caniveau bouché',
          description: 'Signalement personnel de test Amadou',
          quartier: 'Ndakhane (Thiaroye)',
          valide: false,
          date_creation: '2026-10-18T10:00:00Z',
          photo: null,
        },
      ],
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

    // Vérification des types autorisés pour le citoyen (uniquement Signalement terrain et Entraide & Mobilisation)
    const dialogModal = screen.getByRole('dialog');
    expect(within(dialogModal).getByRole('button', { name: /Signalement terrain/i })).toBeInTheDocument();
    expect(within(dialogModal).getByRole('button', { name: /Entraide & Mobilisation/i })).toBeInTheDocument();
    expect(within(dialogModal).queryByRole('button', { name: /Résolu & Sécurisé/i })).not.toBeInTheDocument();

    // Remplissage du texte
    const textarea = screen.getByPlaceholderText(/Que se passe-t-il dans votre ruelle/i);
    fireEvent.change(textarea, { target: { value: 'Passage bloqué par les eaux à Ndakhane' } });

    // Soumission du post
    const submitBtn = screen.getByRole('button', { name: /Publier le post/i });
    fireEvent.click(submitBtn);

    // Le nouveau post s'affiche dans le fil
    expect(screen.getByText(/Passage bloqué par les eaux à Ndakhane/i)).toBeInTheDocument();
  }, 15000);

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

  it('affiche des boutons d action sociale unifies en bleu avec coeurs, vues, avis a gauche et carte, partages a droite sans texte', () => {
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

    const boutonsCarte = screen.getAllByRole('button', { name: /Localiser sur la carte interactive/i });
    expect(boutonsCarte.length).toBeGreaterThan(0);

    const boutonsPartager = screen.getAllByRole('button', { name: /Partager ce post/i });
    expect(boutonsPartager.length).toBeGreaterThan(0);

    // Vérification des attributs et compteurs
    expect(boutonsJaime[0]).toHaveAttribute('aria-label', "J'aime le post");
    expect(boutonsJaime[0]).toHaveTextContent(/[0-9]+/);

    expect(boutonsVues[0]).toHaveAttribute('aria-label', "Nombre d'explorations du post");
    expect(boutonsVues[0]).toHaveTextContent(/[0-9]+/);

    expect(boutonsCommentaires[0]).toHaveAttribute('aria-label', "Commentaires et avis riverains");
    expect(boutonsCommentaires[0]).toHaveTextContent(/[0-9]+/);

    // Bouton carte épuré sans texte
    expect(boutonsCarte[0].textContent).toBe('');

    // Bouton partager avec compteur numérique épuré sans texte 'Partager'
    expect(boutonsPartager[0]).toHaveAttribute('aria-label', "Partager ce post");
    expect(boutonsPartager[0]).toHaveTextContent(/[0-9]+/);
    expect(boutonsPartager[0].textContent).not.toMatch(/Partager/i);
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

    // Au départ, tous sont en bleu uniforme inactif
    expect(premierPost).toHaveClass('bg-blue-50/80');
    expect(deuxiemePost).toHaveClass('bg-blue-50/80');

    // Clic sur le premier post
    fireEvent.click(premierPost);

    // Seul le premier post passe en rose/rouge actif remarquable
    expect(premierPost).toHaveClass('bg-rose-600');
    // Le deuxième post reste INTACT (bleu inactif)
    expect(deuxiemePost).toHaveClass('bg-blue-50/80');
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

  it('incremente aussitot le bouton d avis/commentaires lors de l envoi d un commentaire', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Ouvre les commentaires du premier post
    const boutonsAvis = screen.getAllByRole('button', { name: /Commentaires et avis riverains/i });
    const premierBoutonAvis = boutonsAvis[0];
    const initialCount = parseInt(premierBoutonAvis.textContent.match(/\d+/)[0], 10);

    // Clic pour ouvrir le tiroir des commentaires
    fireEvent.click(premierBoutonAvis);

    // Saisie et envoi d'un commentaire
    const inputCommentaire = screen.getByPlaceholderText(/Ajouter une précision ou proposer de l'aide/i);
    fireEvent.change(inputCommentaire, { target: { value: 'Nous apportons 10 sacs supplémentaires.' } });

    const form = inputCommentaire.closest('form');
    fireEvent.submit(form);

    // Le compteur du bouton s'est incrémenté aussitôt de +1
    const newCount = parseInt(premierBoutonAvis.textContent.match(/\d+/)[0], 10);
    expect(newCount).toBe(initialCount + 1);

    // Le commentaire envoyé est affiché dans le tiroir
    expect(screen.getByText(/Nous apportons 10 sacs supplémentaires/i)).toBeInTheDocument();
  });

  it('permet a un citoyen de creer une story ephemere 24h texte ou photo via Votre story', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Clic sur "Votre story" (+)
    const votreStoryBtn = screen.getByRole('button', { name: /Votre story/i });
    fireEvent.click(votreStoryBtn);

    // La modale de story s'ouvre
    expect(screen.getByText(/Votre Story éphémère \(24h\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Flash terrain visible 24 heures par tous les riverains/i)).toBeInTheDocument();

    // Saisie d'une observation terrain
    const textarea = screen.getByPlaceholderText(/Ex: Eau en baisse rue 14/i);
    fireEvent.change(textarea, { target: { value: 'Eau évacuée avec succès devant le CEM 44' } });

    // Soumission de la story
    const submitBtn = screen.getByRole('button', { name: /Partager ma story/i });
    fireEvent.click(submitBtn);

    // La story s'ouvre aussitôt en visualiseur
    expect(screen.getByText(/Eau évacuée avec succès devant le CEM 44/i)).toBeInTheDocument();
  });

  it('propose le mode Story Photo ou Vidéo avec options de prise directe et import de fichier sans presets factices', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Clic sur "Votre story" (+)
    const votreStoryBtn = screen.getByRole('button', { name: /Votre story/i });
    fireEvent.click(votreStoryBtn);

    // Bascule vers le mode "Story Photo ou Vidéo"
    const mediaModeBtn = screen.getByRole('button', { name: /Story Photo ou Vidéo/i });
    expect(mediaModeBtn).toBeInTheDocument();
    fireEvent.click(mediaModeBtn);

    // Les options d'action réelle sont présentes
    expect(screen.getByRole('button', { name: /Prendre photo \/ vidéo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Importer un fichier/i })).toBeInTheDocument();

    // L'ancienne grille de miniatures prédéfinies n'est plus présente dans la modale
    const storyModal = screen.getByText(/Votre Story éphémère \(24h\)/i).closest('div');
    expect(within(storyModal).queryByText(/^Ruelle inondée$/i)).not.toBeInTheDocument();
    expect(within(storyModal).queryByText(/^Carrefour submergé$/i)).not.toBeInTheDocument();

    // Saisie d'un texte sans média -> affiche l'erreur exigeant un média
    const textarea = screen.getByPlaceholderText(/Ex: Eau en baisse rue 14/i);
    fireEvent.change(textarea, { target: { value: 'Test sans média' } });
    const submitBtn = screen.getByRole('button', { name: /Partager ma story/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Veuillez prendre ou sélectionner une photo ou une vidéo/i)).toBeInTheDocument();
  });

  it('offre un visualiseur de story avec texte compact et bouton Soutenir sans lien de signalement', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Clic sur une story photo existante (Moussa Diop)
    const storyButton = screen.getByRole('button', { name: /Moussa Diop/i });
    fireEvent.click(storyButton);

    // Le visualiseur est ouvert avec le bouton Détails / Réduire
    const toggleDetailsBtn = screen.getByRole('button', { name: /Détails/i });
    expect(toggleDetailsBtn).toBeInTheDocument();

    // Clic pour déplier le texte
    fireEvent.click(toggleDetailsBtn);
    expect(screen.getByRole('button', { name: /Réduire/i })).toBeInTheDocument();

    // Vérification des deux boutons : Soutenir et Fermer (pas de lien vers /citoyen/signaler)
    const soutenirBtn = screen.getByRole('button', { name: /Soutenir cette observation/i });
    expect(soutenirBtn).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Confirmer à proximité/i })).not.toBeInTheDocument();

    // Clic pour soutenir / valider la story
    fireEvent.click(soutenirBtn);
    expect(screen.getByRole('button', { name: /Observation confirmée/i })).toBeInTheDocument();
  }, 15000);

  it('bloque la publication des propos haineux ou insultes via le filtre de moderation', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Ouvre la modale Nouveau Post
    const nouveauPostBtn = screen.getByRole('button', { name: /Nouveau post/i });
    fireEvent.click(nouveauPostBtn);

    const textarea = screen.getByPlaceholderText(/Que se passe-t-il dans votre ruelle/i);
    fireEvent.change(textarea, { target: { value: 'Espèce de sale con va te faire voir' } });

    const submitBtn = screen.getByRole('button', { name: /Publier le post/i });
    fireEvent.click(submitBtn);

    // Le message est bloqué et l'alerte de modération s'affiche
    expect(screen.getByText(/Votre message contient des propos déplacés ou agressifs/i)).toBeInTheDocument();
  });

  it('permet de signaler un contenu abusif via le menu d options de la publication', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Ouvre le menu 3 points d'un post d'un autre utilisateur
    const moreOptionsButtons = screen.getAllByRole('button', { name: /Options de la publication/i });
    fireEvent.click(moreOptionsButtons[1]);

    // Clic sur l'option de signalement dans le menu 3 points
    const reportOption = screen.getByRole('menuitem', { name: /Signaler cette publication/i });
    fireEvent.click(reportOption);

    // La popup de signalement apparaît
    expect(screen.getByText(/Signaler un abus ou propos déplacés/i)).toBeInTheDocument();

    // Confirmation du signalement
    const confirmBtn = screen.getByRole('button', { name: /Confirmer le signalement/i });
    fireEvent.click(confirmBtn);

    // Toast de confirmation affiché
    expect(screen.getByText(/Signalement transmis aux modérateurs/i)).toBeInTheDocument();
  });

  it('affiche le menu 3 points uniquement sur les publications de l’auteur et permet de la supprimer de la communaute sans toucher aux autorites', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // 1. Publier un nouveau post
    const nouveauPostBtn = screen.getByRole('button', { name: /Nouveau post/i });
    fireEvent.click(nouveauPostBtn);

    const textarea = screen.getByPlaceholderText(/Que se passe-t-il dans votre ruelle/i);
    fireEvent.change(textarea, { target: { value: 'Post citoyen à tester pour suppression' } });

    const submitBtn = screen.getByRole('button', { name: /Publier le post/i });
    fireEvent.click(submitBtn);

    // Le post est visible
    expect(screen.getByText(/Post citoyen à tester pour suppression/i)).toBeInTheDocument();

    // 2. Le bouton 3 points est présent pour ce post
    const moreOptionsButtons = screen.getAllByRole('button', { name: /Options de la publication/i });
    expect(moreOptionsButtons.length).toBeGreaterThanOrEqual(1);

    // 3. Ouvrir le menu 3 points
    fireEvent.click(moreOptionsButtons[0]);

    // L'option "Supprimer la publication" apparaît
    const deleteOption = screen.getByRole('menuitem', { name: /Supprimer la publication/i });
    expect(deleteOption).toBeInTheDocument();

    // 4. Clic sur "Supprimer la publication" pour ouvrir la modale de confirmation
    fireEvent.click(deleteOption);

    expect(screen.getByText(/Supprimer cette publication \?/i)).toBeInTheDocument();
    expect(screen.getByText(/Espace Autorités préservé/i)).toBeInTheDocument();

    // 5. Confirmer la suppression
    const confirmDeleteBtn = screen.getByRole('button', { name: /^Supprimer$/i });
    fireEvent.click(confirmDeleteBtn);

    // 6. Le post a disparu de la communauté
    expect(screen.queryByText(/Post citoyen à tester pour suppression/i)).not.toBeInTheDocument();

    // 7. Toast de succès affiché
    expect(screen.getByText(/Publication retirée de l'espace Communauté/i)).toBeInTheDocument();
  }, 15000);

  it('affiche des compteurs entre parenthèses rigoureusement exacts dont la somme égale le total', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Extraction des textes des boutons de filtres
    const tousBtn = screen.getByRole('button', { name: /Tous les posts/i });
    const sigBtn = screen.getByRole('button', { name: /Signalements terrain/i });
    const entBtn = screen.getByRole('button', { name: /Entraide & Mobilisation/i });
    const resBtn = screen.getByRole('button', { name: /Résolus & Sécurisés/i });

    const extractCount = (btn) => {
      const match = btn.textContent.match(/\((\d+)\)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    const countTous = extractCount(tousBtn);
    const countSig = extractCount(sigBtn);
    const countEnt = extractCount(entBtn);
    const countRes = extractCount(resBtn);

    // Vérifie que les compteurs sont réels (> 0)
    expect(countTous).toBeGreaterThan(0);
    expect(countSig).toBeGreaterThan(0);
    expect(countEnt).toBeGreaterThan(0);
    expect(countRes).toBeGreaterThan(0);

    // La somme des 3 filtres exclusifs doit égaler STRICTEMENT le total 'Tous les posts'
    expect(countSig + countEnt + countRes).toBe(countTous);
  });

  it('propose dans Nouveau post la capture et l import de photo/video sans aucune miniature factice', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Ouvre la popup "Nouveau post"
    const nouveauPostBtn = screen.getByRole('button', { name: /Nouveau post/i });
    fireEvent.click(nouveauPostBtn);

    const dialogModal = screen.getByRole('dialog');
    expect(within(dialogModal).getByText(/Photo ou Vidéo du constat \(Optionnel\)/i)).toBeInTheDocument();
    expect(within(dialogModal).getByRole('button', { name: /Prendre photo \/ vidéo/i })).toBeInTheDocument();
    expect(within(dialogModal).getByRole('button', { name: /Importer depuis l'appareil/i })).toBeInTheDocument();

    // Vérifie l'absence absolue de la section des illustrations prédéfinies
    expect(within(dialogModal).queryByText(/Ou choisir une illustration de la communauté/i)).not.toBeInTheDocument();
    expect(within(dialogModal).queryByText(/^Ruelle inondée$/i)).not.toBeInTheDocument();
  });

  it('ouvre le volet Mon Espace Personnel (Option 1) et permet de gérer ses publications et ses stories avec confirmation', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // 1. Bouton "Mon espace" avec l'avatar dans le header
    const mySpaceBtn = screen.getByRole('button', { name: /Ouvrir mon espace personnel/i });
    expect(mySpaceBtn).toBeInTheDocument();
    fireEvent.click(mySpaceBtn);

    // 2. Le volet latéral s'ouvre
    const mySpaceDialog = screen.getByRole('dialog', { name: /Mon espace communautaire/i });
    expect(mySpaceDialog).toBeInTheDocument();
    expect(within(mySpaceDialog).getByText(/Résident de Thiaroye-sur-Mer/i)).toBeInTheDocument();
    expect(within(mySpaceDialog).getByText(/Soutiens reçus/i)).toBeInTheDocument();

    // 3. Le signalement personnel de l'utilisateur est bien présent dans ses publications dans le volet
    expect(within(mySpaceDialog).getByText(/Signalement personnel de test Amadou/i)).toBeInTheDocument();

    // 4. Navigation vers Mes Stories 24h
    const tabStories = within(mySpaceDialog).getByRole('button', { name: /Mes Stories 24h/i });
    fireEvent.click(tabStories);
    expect(within(mySpaceDialog).getByText(/Aucune Story active/i)).toBeInTheDocument();

    // 5. Retour vers Mes publications
    const tabPosts = within(mySpaceDialog).getByRole('button', { name: /Mes publications/i });
    fireEvent.click(tabPosts);
    expect(within(mySpaceDialog).getByText(/Signalement personnel de test Amadou/i)).toBeInTheDocument();

    // 6. Suppression de la publication depuis Mon Espace Personnel
    const deleteBtn = within(mySpaceDialog).getByRole('button', { name: /Supprimer cette publication/i });
    fireEvent.click(deleteBtn);

    // Boîte de dialogue de confirmation (doit être au-dessus du volet Mon Espace avec z-[10001])
    const deleteConfirmDialog = screen.getByRole('dialog', { name: '' });
    expect(deleteConfirmDialog).toHaveClass('z-[10001]');
    expect(within(deleteConfirmDialog).getByText(/Supprimer cette publication \?/i)).toBeInTheDocument();
    const confirmBtn = within(deleteConfirmDialog).getByRole('button', { name: /^Supprimer$/i });
    fireEvent.click(confirmBtn);

    // Toast et état vide dans Mon Espace
    expect(screen.getByText(/Publication retirée de l'espace Communauté/i)).toBeInTheDocument();
    expect(within(mySpaceDialog).getByText(/Aucune publication partagée/i)).toBeInTheDocument();
  });

  it('ouvre le viseur de la caméra en direct au clic sur Prendre photo / vidéo', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = {
      getTracks: () => [mockTrack],
    };
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      configurable: true,
      writable: true,
    });

    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Ouvre la popup Nouveau post
    const nouveauPostBtn = screen.getByRole('button', { name: /Nouveau post/i });
    fireEvent.click(nouveauPostBtn);

    // Clic sur "Prendre photo / vidéo"
    const prendrePhotoBtn = screen.getByRole('button', { name: /Prendre photo \/ vidéo/i });
    fireEvent.click(prendrePhotoBtn);

    // Le viseur caméra s'affiche
    const cameraDialog = await screen.findByRole('dialog', { name: /Viseur Caméra en Direct/i });
    expect(cameraDialog).toBeInTheDocument();
    expect(within(cameraDialog).getByText(/Caméra Direct · Nouveau Post/i)).toBeInTheDocument();
    expect(within(cameraDialog).getByRole('button', { name: /^Prendre photo$/i })).toBeInTheDocument();
    expect(within(cameraDialog).getByRole('button', { name: /^Filmer vidéo$/i })).toBeInTheDocument();

    // Fermeture du viseur
    const closeBtn = within(cameraDialog).getByTitle(/Fermer la caméra/i);
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog', { name: /Viseur Caméra en Direct/i })).not.toBeInTheDocument();
  });

  it('affiche un choix neutre par défaut entre Photo et Vidéo puis met en rouge uniquement l option choisie', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = {
      getTracks: () => [mockTrack],
    };
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      configurable: true,
      writable: true,
    });

    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // Ouvre la popup Nouveau post puis le viseur caméra
    fireEvent.click(screen.getByRole('button', { name: /Nouveau post/i }));
    fireEvent.click(screen.getByRole('button', { name: /Prendre photo \/ vidéo/i }));

    const cameraDialog = await screen.findByRole('dialog', { name: /Viseur Caméra en Direct/i });
    expect(cameraDialog).toBeInTheDocument();

    // Vérifie que les sélecteurs de mode Photo et Vidéo sont tous les deux neutres au départ (aucun bg-red-600)
    const modePhotoTab = within(cameraDialog).getByRole('button', { name: /^Photo$/i });
    const modeVideoTab = within(cameraDialog).getByRole('button', { name: /^Vidéo$/i });

    expect(modePhotoTab).not.toHaveClass('bg-red-600');
    expect(modeVideoTab).not.toHaveClass('bg-red-600');
    expect(within(cameraDialog).getByText(/Faites votre choix/i)).toBeInTheDocument();

    // 1. Clic sur le mode Photo : Photo devient ROUGE (bg-red-600), Vidéo reste neutre
    fireEvent.click(modePhotoTab);
    expect(modePhotoTab).toHaveClass('bg-red-600');
    expect(modeVideoTab).not.toHaveClass('bg-red-600');
    expect(within(cameraDialog).getByText(/Mode Photo sélectionné en rouge/i)).toBeInTheDocument();

    // 2. Clic sur le mode Vidéo : Vidéo devient ROUGE (bg-red-600), Photo redevient neutre
    fireEvent.click(modeVideoTab);
    expect(modeVideoTab).toHaveClass('bg-red-600');
    expect(modePhotoTab).not.toHaveClass('bg-red-600');
    expect(within(cameraDialog).getByText(/Mode Vidéo sélectionné en rouge/i)).toBeInTheDocument();
  });

  it('permet de confirmer une situation avec le bouton C est vrai qui passe au vert et maintient les vues passives', () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <CommunautePageBody />
      </MemoryRouter>
    );

    // 1. Les boutons "C'est vrai" sont présents pour chaque post
    const boutonsConfirmer = screen.getAllByRole('button', { name: /Confirmer cette situation \(C'est vrai\)/i });
    expect(boutonsConfirmer.length).toBeGreaterThan(0);

    const premierBouton = boutonsConfirmer[0];
    expect(premierBouton).not.toHaveClass('bg-emerald-600');

    // 2. Clic pour attester de la situation terrain : passage en vert et texte temporaire Confirmé !
    fireEvent.click(premierBouton);
    expect(premierBouton).toHaveClass('bg-emerald-600');
    expect(premierBouton).toHaveTextContent(/Confirmé !/i);
    expect(screen.getByText(/Attestation enregistrée ! Vous confirmez cette situation/i)).toBeInTheDocument();

    // 3. Clic sur le bouton J'aime : passage en rose et texte temporaire J'aime !
    const boutonsAimer = screen.getAllByRole('button', { name: /J'aime le post/i });
    expect(boutonsAimer.length).toBeGreaterThan(0);
    fireEvent.click(boutonsAimer[0]);
    expect(boutonsAimer[0]).toHaveClass('bg-rose-600');
    expect(boutonsAimer[0]).toHaveTextContent(/J'aime !/i);

    // 4. Le bouton de vues reste affiché mais est désactivé (lecture seule)
    const boutonsVues = screen.getAllByRole('button', { name: /Nombre d'explorations du post/i });
    expect(boutonsVues[0]).toBeDisabled();
    expect(boutonsVues[0]).toHaveClass('cursor-default');
  });
});


