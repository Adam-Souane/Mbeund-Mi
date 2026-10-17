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
  Clock: () => <span data-testid="clock-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  X: () => <span data-testid="x-icon" />,
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

  it('affiche le formulaire de nouveau signalement', () => {
    render(<SignalerPageBody />);

    expect(screen.getByText('Nouveau signalement')).toBeInTheDocument();
    expect(screen.getByText('Catégorie')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Photo (optionnelle)')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Envoyer le signalement' })
    ).toBeInTheDocument();
  });

  it('permet de changer la catégorie', () => {
    render(<SignalerPageBody />);

    const buttonEgouts = screen.getByRole('button', {
      name: 'Égouts',
    });

    fireEvent.click(buttonEgouts);

    expect(buttonEgouts.className).toContain('bg-navy');
  });

  it('permet de saisir une description', () => {
    render(<SignalerPageBody />);

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

  it('permet de sélectionner une photo', async () => {
    render(<SignalerPageBody />);

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

  it('envoie le signalement avec la photo sélectionnée', async () => {
    render(<SignalerPageBody />);

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

  it('permet de sélectionner jusqu’à 3 photos et affiche les aperçus', async () => {
    render(<SignalerPageBody />);

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

  it('affiche la carte de position', () => {
    render(<SignalerPageBody />);

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
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

  it('réinitialise la mutation avant l’envoi', () => {
    render(<SignalerPageBody />);

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
        name: 'Envoyer le signalement',
      })
    );

    expect(resetMock).toHaveBeenCalled();
    expect(mutateMock).toHaveBeenCalled();
  });

  it('affiche le carré de choix et permet d envoyer en diffusion publique ou confidentielle', async () => {
    localStorage.clear();
    render(<SignalerPageBody />);

    const checkbox = screen.getByRole('checkbox', {
      name: /Partager également sur l'Espace Communauté/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
    expect(screen.getByText(/visible par les riverains sur le fil public/i)).toBeInTheDocument();

    // Décocher la case pour rendre le signalement confidentiel (autorité uniquement)
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(screen.queryByText(/visible par les riverains sur le fil public/i)).not.toBeInTheDocument();

    // Saisie d'une description et envoi
    fireEvent.change(screen.getByPlaceholderText(/Eau stagnante devant/i), {
      target: { value: 'Fuite égout discrète' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));

    await waitFor(() => {
      expect(createSignalementMock).toHaveBeenCalled();
    });

    // L'écran de succès indique la transmission confidentielle aux autorités
    expect(screen.getByText(/Votre signalement a été transmis en toute confidentialité aux autorités uniquement/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Voir dans la Communauté/i })).not.toBeInTheDocument();
  });

  it('permet de partager sur la communaute quand la case est cochee et affiche le bouton Voir dans la Communaute', async () => {
    localStorage.clear();
    render(<SignalerPageBody />);

    const checkbox = screen.getByRole('checkbox', {
      name: /Partager également sur l'Espace Communauté/i,
    });
    expect(checkbox).toBeChecked();

    fireEvent.change(screen.getByPlaceholderText(/Eau stagnante devant/i), {
      target: { value: 'Inondation majeure rue 12' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));

    await waitFor(() => {
      expect(createSignalementMock).toHaveBeenCalled();
    });

    // Écran de succès avec bouton Communauté
    expect(screen.getByText(/partagé avec les riverains sur l'espace Communauté/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voir dans la Communauté/i })).toBeInTheDocument();
  });
});