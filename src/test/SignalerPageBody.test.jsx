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
}));

describe('SignalerPageBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('permet de sélectionner une photo', () => {
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

    expect(screen.getByText('inondation.jpg')).toBeInTheDocument();
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

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Envoyer le signalement',
      })
    );

    await waitFor(() => {
      expect(createSignalementMock).toHaveBeenCalled();
    });

    expect(createSignalementMock).toHaveBeenCalledWith({
      description: 'Rue complètement inondée',
      categorie: 'inondation',
      longitude: -17.38,
      latitude: 14.75,
      photo,
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
});