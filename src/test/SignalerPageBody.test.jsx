import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import SignalerPageBody from '../citizen/pages/SignalerPageBody';

const createSignalementMock = vi.fn();
const invalidateQueriesMock = vi.fn();
const navigateMock = vi.fn();
const mutateMock = vi.fn();
const resetMock = vi.fn();

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => (
    <div data-testid="citizen-shell">{children}</div>
  ),
}));

vi.mock('../api/endpoints/signalements', () => ({
  createSignalement: (...args) => createSignalementMock(...args),
}));

vi.mock('../shared/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    position: null,
    status: 'idle',
    error: null,
    locate: vi.fn(),
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../shared/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    addNotification: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: invalidateQueriesMock,
  }),

  useMutation: (options) => ({
    mutate: (...args) => {
      mutateMock(...args);

      try {
        const result = options.mutationFn(...args);

        Promise.resolve(result)
          .then(() => {
            options.onSuccess?.();
          })
          .catch(() => {});
      } catch (error) {
        options.onError?.(error);
      }
    },
    reset: resetMock,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => (
    <div data-testid="map-container">{children}</div>
  ),

  TileLayer: () => (
    <div data-testid="tile-layer" />
  ),

  CircleMarker: () => (
    <div data-testid="circle-marker" />
  ),

  Circle: () => (
    <div data-testid="circle" />
  ),

  Marker: ({ children }) => (
    <div data-testid="marker">{children}</div>
  ),

  useMap: () => ({
    flyTo: vi.fn(),
    setView: vi.fn(),
    invalidateSize: vi.fn(),
  }),

  useMapEvents: () => ({}),
}));

vi.mock('lucide-react', () => ({
  Camera: () => <span data-testid="camera-icon" />,
  MapPin: () => <span data-testid="map-pin-icon" />,
  LocateFixed: () => <span data-testid="locate-icon" />,
  CheckCircle2: () => <span data-testid="check-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
  ShieldCheck: () => <span data-testid="shield-icon" />,
  Users: () => <span data-testid="users-icon" />,
  EyeOff: () => <span data-testid="eye-off-icon" />,
  ArrowDown: () => <span data-testid="arrow-down-icon" />,
  ArrowRight: () => <span data-testid="arrow-right-icon" />,
  ArrowLeft: () => <span data-testid="arrow-left-icon" />,
  Pencil: () => <span data-testid="pencil-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  X: () => <span data-testid="x-icon" />,
  Waves: () => <span data-testid="waves-icon" />,
  AlertTriangle: () => <span data-testid="alert-triangle-icon" />,
  ShieldAlert: () => <span data-testid="shield-alert-icon" />,
  Droplets: () => <span data-testid="droplets-icon" />,
  AlertOctagon: () => <span data-testid="alert-octagon-icon" />,
  Satellite: () => <span data-testid="satellite-icon" />,
  Layers: () => <span data-testid="layers-icon" />,
  Send: () => <span data-testid="send-icon" />,
  Activity: () => <span data-testid="activity-icon" />,
  Info: () => <span data-testid="info-icon" />,
  PhoneCall: () => <span data-testid="phone-call-icon" />,
  Compass: () => <span data-testid="compass-icon" />,
  WifiOff: () => <span data-testid="wifi-off-icon" />,
}));

describe('SignalerPageBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn((file) => `blob:mock-${file?.name || 'file'}`);
    global.URL.revokeObjectURL = vi.fn();

    createSignalementMock.mockResolvedValue({
      id: 1,
      description: 'Rue inondée',
    });
  });

  // Helper pour passer à l'étape 2 (Formulaire)
  const goToFormStep = () => {
    const btnNext = screen.getByRole('button', { name: /Valider la position & Continuer/i });
    fireEvent.click(btnNext);
  };

  it('affiche le parcours de signalement à l étape 1 (Localisation)', () => {
    render(<SignalerPageBody />);

    expect(screen.getByText('Nouveau signalement')).toBeInTheDocument();
    expect(screen.getByText(/1\. Choisissez la position de l'incident/i)).toBeInTheDocument();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Valider la position & Continuer/i })
    ).toBeInTheDocument();
  });

  it('permet de changer la catégorie à l étape 2', () => {
    render(<SignalerPageBody />);
    goToFormStep();

    const buttonEgouts = screen.getByRole('button', {
      name: 'Égouts',
    });

    fireEvent.click(buttonEgouts);

    expect(buttonEgouts.className).toContain('bg-navy');
  });

  it('permet de saisir une description à l étape 2', () => {
    render(<SignalerPageBody />);
    goToFormStep();

    const textarea = screen.getByPlaceholderText(
      /Eau stagnante devant/i
    );

    fireEvent.change(textarea, {
      target: {
        value: 'Rue complètement inondée après la pluie',
      },
    });

    expect(textarea).toHaveValue(
      'Rue complètement inondée après la pluie'
    );
  });

  it('permet de sélectionner une photo à l étape 2', async () => {
    render(<SignalerPageBody />);
    goToFormStep();

    const fileInput = screen.getByLabelText(/Ajouter une photo/i);

    const photo = new File(
      ['contenu-image'],
      'inondation.jpg',
      { type: 'image/jpeg' }
    );

    fireEvent.change(fileInput, {
      target: {
        files: [photo],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('inondation.jpg')).toBeInTheDocument();
    });
  });

  it('envoie le signalement avec la photo sélectionnée via les 3 étapes', async () => {
    render(<SignalerPageBody />);
    // Étape 1 ➔ Étape 2
    goToFormStep();

    const textarea = screen.getByPlaceholderText(
      /Eau stagnante devant/i
    );

    fireEvent.change(textarea, {
      target: {
        value: 'Rue complètement inondée',
      },
    });

    const fileInput = screen.getByLabelText(/Ajouter une photo/i);

    const photo = new File(
      ['photo-test'],
      'photo-inondation.jpg',
      { type: 'image/jpeg' }
    );

    fireEvent.change(fileInput, {
      target: {
        files: [photo],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('photo-inondation.jpg')).toBeInTheDocument();
    });

    // Étape 2 ➔ Étape 3 (Vérifier)
    fireEvent.click(
      screen.getByRole('button', {
        name: /Vérifier mon signalement/i,
      })
    );

    // Étape 3 (Récapitulatif)
    expect(screen.getByText(/3\. Récapitulatif général de votre signalement/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Envoyer le signalement',
      })
    );

    await waitFor(() => {
      expect(createSignalementMock).toHaveBeenCalled();
    });

    expect(createSignalementMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Rue complètement inondée',
        categorie: 'inondation',
        longitude: -17.38,
        latitude: 14.75,
        photo,
        photos: [photo],
      })
    );
  });

  it('permet de sélectionner jusqu’à 3 photos et affiche les aperçus à l étape 2', async () => {
    render(<SignalerPageBody />);
    goToFormStep();

    const fileInput = screen.getByLabelText(/Ajouter une photo/i);
    const photo1 = new File(['p1'], 'vue-face.jpg', { type: 'image/jpeg' });
    const photo2 = new File(['p2'], 'vue-caniveau.jpg', { type: 'image/jpeg' });
    const photo3 = new File(['p3'], 'vue-degats.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, {
      target: { files: [photo1, photo2, photo3] },
    });

    await waitFor(() => {
      expect(screen.getByText('vue-face.jpg')).toBeInTheDocument();
      expect(screen.getByText('vue-caniveau.jpg')).toBeInTheDocument();
      expect(screen.getByText('vue-degats.jpg')).toBeInTheDocument();
      expect(screen.getByText('3/3 photos')).toBeInTheDocument();
    });
  });

  it('permet de supprimer une photo ajoutée', async () => {
    render(<SignalerPageBody />);
    goToFormStep();

    const fileInput = screen.getByLabelText(/Ajouter une photo/i);
    const photo1 = new File(['p1'], 'photo-a-supprimer.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, {
      target: { files: [photo1] },
    });

    await waitFor(() => {
      expect(screen.getByText('photo-a-supprimer.jpg')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Supprimer cette photo');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByText('photo-a-supprimer.jpg')).not.toBeInTheDocument();
      expect(screen.getByText('0/3 photos')).toBeInTheDocument();
    });
  });

  it('alerte si la limite de 3 photos est atteinte', async () => {
    render(<SignalerPageBody />);
    goToFormStep();

    const fileInput = screen.getByLabelText(/Ajouter une photo/i);
    const p1 = new File(['1'], 'p1.jpg', { type: 'image/jpeg' });
    const p2 = new File(['2'], 'p2.jpg', { type: 'image/jpeg' });
    const p3 = new File(['3'], 'p3.jpg', { type: 'image/jpeg' });
    const p4 = new File(['4'], 'p4.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, {
      target: { files: [p1, p2, p3, p4] },
    });

    await waitFor(() => {
      expect(screen.getByText(/limite de 3 photos/i)).toBeInTheDocument();
      expect(screen.getByText('3/3 photos')).toBeInTheDocument();
    });
  });

  it('affiche la position par défaut de Thiaroye-sur-Mer', () => {
    render(<SignalerPageBody />);

    expect(
      screen.getByText(
        /Position par défaut \(Thiaroye-sur-Mer\)/i
      )
    ).toBeInTheDocument();
  });

  it('affiche la carte de position à l étape 1', () => {
    render(<SignalerPageBody />);

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getAllByTestId('tile-layer').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('circle-marker')).toBeInTheDocument();
  });

  it('permet de demander la géolocalisation', () => {
    const locateMock = vi.fn();

    vi.doMock('../shared/hooks/useGeolocation', () => ({
      useGeolocation: () => ({
        position: null,
        status: 'idle',
        error: null,
        locate: locateMock,
      }),
    }));

    render(<SignalerPageBody />);

    fireEvent.click(
      screen.getByRole('button', { name: /Me localiser/i })
    );

    expect(screen.getByRole('button', { name: /Me localiser/i }))
      .toBeInTheDocument();
  });

  it('réinitialise la mutation avant l’envoi à l étape 3', () => {
    render(<SignalerPageBody />);
    goToFormStep();

    fireEvent.change(
      screen.getByPlaceholderText(/Eau stagnante devant/i),
      {
        target: {
          value: 'Test signalement',
        },
      }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /Vérifier mon signalement/i,
      })
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Envoyer le signalement',
      })
    );

    expect(resetMock).toHaveBeenCalled();
    expect(mutateMock).toHaveBeenCalled();
  });

  it('affiche le choix de diffusion et permet d envoyer en mode confidentiel', async () => {
    localStorage.clear();
    render(<SignalerPageBody />);
    goToFormStep();

    const checkbox = screen.getByRole('checkbox', {
      name: /Partager également sur l'Espace Communauté/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
    expect(screen.getByText(/visible par les riverains sur le fil public/i)).toBeInTheDocument();

    // Décocher la case pour rendre le signalement confidentiel
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    fireEvent.change(screen.getByPlaceholderText(/Eau stagnante devant/i), {
      target: { value: 'Fuite égout discrète' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Vérifier mon signalement/i }));

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));

    await waitFor(() => {
      expect(createSignalementMock).toHaveBeenCalled();
    });

    expect(screen.getByText(/Votre signalement a été transmis en toute confidentialité aux autorités uniquement/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Voir dans la Communauté/i })).not.toBeInTheDocument();
  });

  it('permet de partager sur la communaute quand la case est cochee et affiche le bouton Voir dans la Communaute', async () => {
    localStorage.clear();
    render(<SignalerPageBody />);
    goToFormStep();

    const checkbox = screen.getByRole('checkbox', {
      name: /Partager également sur l'Espace Communauté/i,
    });
    expect(checkbox).toBeChecked();

    fireEvent.change(screen.getByPlaceholderText(/Eau stagnante devant/i), {
      target: { value: 'Inondation majeure rue 12' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Vérifier mon signalement/i }));

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));

    await waitFor(() => {
      expect(createSignalementMock).toHaveBeenCalled();
    });

    expect(screen.getByText(/partagé avec les riverains sur l'espace Communauté/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voir dans la Communauté/i })).toBeInTheDocument();
  });

  it('affiche la carte satellite par défaut et permet de basculer en mode plan', () => {
    render(<SignalerPageBody />);

    const btnSatellite = screen.getByRole('button', { name: /Satellite/i });
    const btnPlan = screen.getByRole('button', { name: /Plan/i });

    expect(btnSatellite).toBeInTheDocument();
    expect(btnPlan).toBeInTheDocument();
    expect(btnSatellite.className).toContain('bg-white');

    fireEvent.click(btnPlan);
    expect(btnPlan.className).toContain('bg-white');
  });

  it('active la position de secteur en cliquant sur un raccourci de quartier de Thiaroye', () => {
    render(<SignalerPageBody />);

    const btnNdakhane = screen.getByRole('button', { name: /Ndakhane/i });
    fireEvent.click(btnNdakhane);

    expect(screen.getAllByText(/Secteur Ndakhane/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Déplacement restreint au périmètre du quartier/i)).toBeInTheDocument();
    expect(screen.getByTestId('circle')).toBeInTheDocument();
  });

  it('affiche le stepper comme indicateur visuel non cliquable (respect du flux séquentiel)', () => {
    render(<SignalerPageBody />);

    // Le libellé Étape 2 "Informations" est présent visuellement mais n'est pas un bouton cliquable
    const stepLabel2 = screen.getByText('Informations');
    expect(stepLabel2).toBeInTheDocument();
    fireEvent.click(stepLabel2);

    // On reste bien à l'Étape 1 (la carte reste affichée, le formulaire de l'étape 2 n'est pas ouvert)
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Décrivez la situation/i)).not.toBeInTheDocument();
  });

  it('adapte dynamiquement les critères d’état, les suggestions et le récapitulatif pour les catégories Égouts et Autre', () => {
    render(<SignalerPageBody />);
    goToFormStep();

    // Par défaut, catégorie Inondation active avec critères de niveau d'eau
    expect(screen.getByText(/Niveau d'eau approximatif/i)).toBeInTheDocument();
    expect(screen.getByText('Chevilles')).toBeInTheDocument();
    expect(screen.getByText('Genoux')).toBeInTheDocument();

    // 1. Basculer vers Égouts
    const btnEgouts = screen.getByRole('button', { name: 'Égouts' });
    fireEvent.click(btnEgouts);

    // Les critères doivent être adaptés aux égouts
    expect(screen.getByText(/État du débordement ou de la bouche d'égout/i)).toBeInTheDocument();
    expect(screen.getByText(/Suintement \/ Fuite/i)).toBeInTheDocument();
    expect(screen.getByText(/Refoulement continu/i)).toBeInTheDocument();
    expect(screen.getByText(/Plaque ouverte \/ Cassée/i)).toBeInTheDocument();
    expect(screen.queryByText('Chevilles')).not.toBeInTheDocument();

    // Les suggestions 1-clic doivent être celles des égouts
    expect(screen.getByText(/Reflux d’eaux usées insalubres/i)).toBeInTheDocument();
    expect(screen.getByText(/Plaque d'égout descellée ou manquante/i)).toBeInTheDocument();

    // 2. Basculer vers Autre
    const btnAutre = screen.getByRole('button', { name: 'Autre' });
    fireEvent.click(btnAutre);

    // Les critères doivent être adaptés aux autres risques
    expect(screen.getByText(/Niveau d'urgence \/ gravité/i)).toBeInTheDocument();
    expect(screen.getByText(/Gêne modérée/i)).toBeInTheDocument();
    expect(screen.getByText(/Dégradation forte/i)).toBeInTheDocument();
    expect(screen.getByText(/Danger critique/i)).toBeInTheDocument();
    expect(screen.queryByText(/Suintement/i)).not.toBeInTheDocument();

    // Les suggestions 1-clic doivent être celles des autres risques
    expect(screen.getByText(/Dépôt d'encombrants ou gravats/i)).toBeInTheDocument();
    expect(screen.getByText(/Poteau ou câble électrique menaçant/i)).toBeInTheDocument();
  });

  it('affiche le carrousel de consignes d’urgence avec indicateurs et permet la pause au survol', () => {
    render(<SignalerPageBody />);

    // Consigne initiale (montée des eaux)
    expect(screen.getByText(/En cas de montée subite des eaux/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sapeurs-Pompiers \(18\)/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /SAMU \(1515\)/i })).toBeInTheDocument();

    // Clic sur l'indicateur de la 2e consigne (Hygiène & Sécurité sanitaire)
    const btnDot2 = screen.getByRole('button', { name: /Consigne 2/i });
    fireEvent.click(btnDot2);

    expect(screen.getByText(/En présence d’eaux usées ou refoulement d’égout/i)).toBeInTheDocument();

    // Survol souris pour mettre en pause
    const banner = screen.getByText(/Hygiène & Sécurité sanitaire/i).closest('div.relative');
    fireEvent.mouseEnter(banner);
    expect(screen.getByText(/\(en pause\)/i)).toBeInTheDocument();

    // Sortie souris pour relancer le défilement
    fireEvent.mouseLeave(banner);
    expect(screen.queryByText(/\(en pause\)/i)).not.toBeInTheDocument();
  });
});