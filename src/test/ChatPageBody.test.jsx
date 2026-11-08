import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ChatPageBody from '../citizen/pages/ChatPageBody';
import * as chatEndpoints from '../api/endpoints/chat';
import * as signalementsEndpoints from '../api/endpoints/signalements';

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => <div data-testid="citizen-shell">{children}</div>,
}));

vi.mock('../shared/hooks/useZones', () => ({
  useZones: () => ({
    data: {
      features: [
        { id: 1, properties: { quartier: 'Thiaroye Gare', niveau_risque: 'rouge', score_risque_moyen: 85 } },
      ],
    },
  }),
}));

vi.mock('../shared/hooks/usePrevisions', () => ({
  usePrevisions: () => ({
    data: {
      results: [
        { cumul_pluie_24h_mm: 45, date_heure: '2026-10-07T12:00:00Z' },
      ],
    },
  }),
}));

vi.mock('../api/endpoints/chat', () => ({
  askNdam: vi.fn(),
  transcribeAudio: vi.fn(),
}));

vi.mock('../api/endpoints/signalements', () => ({
  createSignalement: vi.fn(),
}));

function renderWithProviders(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ChatPageBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    chatEndpoints.askNdam.mockResolvedValue({
      reply: 'Réponse de test NDAM',
    });
    chatEndpoints.transcribeAudio.mockResolvedValue({
      text: 'Message vocal transcrit',
    });
    signalementsEndpoints.createSignalement.mockResolvedValue({
      id: 1,
      valide: false,
    });
  });

  it('affiche le message d accueil de NDAM', () => {
    renderWithProviders(<ChatPageBody />);

    expect(screen.getByText(/Bonjour, je suis NDAM/i)).toBeInTheDocument();
    expect(screen.getByText('Quel est le niveau de risque actuel ?')).toBeInTheDocument();
  });

  it('envoie une question quand l utilisateur clique sur une suggestion', async () => {
    renderWithProviders(<ChatPageBody />);

    const suggestionBtn = screen.getByText('Quel est le niveau de risque actuel ?');
    fireEvent.click(suggestionBtn);

    await waitFor(() => {
      expect(chatEndpoints.askNdam.mock.calls[0][0]).toBe('Quel est le niveau de risque actuel ?');
      expect(screen.getByText('Réponse de test NDAM')).toBeInTheDocument();
    });
  });

  it('envoie une question personnalisée via le formulaire', async () => {
    renderWithProviders(<ChatPageBody />);

    const input = screen.getByPlaceholderText(/Écrivez votre question/i);
    fireEvent.change(input, { target: { value: 'Comment faire un signalement ?' } });

    const form = input.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(chatEndpoints.askNdam.mock.calls[0][0]).toBe('Comment faire un signalement ?');
    });
  });

  it('le clic sur l appareil photo ne change pas l URL et n appelle pas askNdam', async () => {
    renderWithProviders(<ChatPageBody />);

    const cameraBtn = screen.getByRole('button', { name: /appareil photo/i });
    expect(cameraBtn).toBeInTheDocument();
    expect(cameraBtn.tagName).toBe('BUTTON');
    expect(cameraBtn).not.toHaveAttribute('href');

    fireEvent.click(cameraBtn);

    // Vérifie que askNdam n'a pas été appelé
    expect(chatEndpoints.askNdam).not.toHaveBeenCalled();

    // Vérifie que le menu de choix s'ouvre avec les deux options
    expect(screen.getByText('Prendre une photo')).toBeInTheDocument();
    expect(screen.getByText('Choisir dans la galerie')).toBeInTheDocument();
  });

  it('permet de selectionner une photo qui s affiche en miniature et de la retirer sans envoyer', async () => {
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
    }
    if (!globalThis.URL.revokeObjectURL) {
      globalThis.URL.revokeObjectURL = vi.fn();
    }

    renderWithProviders(<ChatPageBody />);

    const cameraInput = screen.getByTestId('camera-file-input');
    const mockFile = new File(['dummy-content'], 'inondation_test.png', { type: 'image/png' });

    fireEvent.change(cameraInput, { target: { files: [mockFile] } });

    // La miniature de la photo doit apparaître
    expect(screen.getByTestId('attached-photo-preview')).toBeInTheDocument();
    expect(screen.getByText('inondation_test.png')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retirer la photo/i })).toBeInTheDocument();

    // Aucun message n'a été envoyé
    expect(chatEndpoints.askNdam).not.toHaveBeenCalled();

    // Retirer la photo
    const removeBtn = screen.getByRole('button', { name: /retirer la photo/i });
    fireEvent.click(removeBtn);

    expect(screen.queryByTestId('attached-photo-preview')).not.toBeInTheDocument();
    expect(chatEndpoints.askNdam).not.toHaveBeenCalled();
  });

  it('le clic sur la localisation n envoie aucun message automatiquement et affiche le badge de position', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) =>
        success({
          coords: {
            latitude: 14.7654,
            longitude: -17.3912,
          },
        })
      ),
    };
    vi.stubGlobal('navigator', {
      ...window.navigator,
      geolocation: mockGeolocation,
    });

    renderWithProviders(<ChatPageBody />);

    const locBtn = screen.getByRole('button', { name: /localiser ma position/i });
    fireEvent.click(locBtn);

    // Vérifie qu'aucun message n'a été envoyé
    expect(chatEndpoints.askNdam).not.toHaveBeenCalled();
    expect(signalementsEndpoints.createSignalement).not.toHaveBeenCalled();

    // Vérifie que le badge de position et le formulaire direct sont affichés
    await waitFor(() => {
      expect(screen.getByTestId('attached-location-badge')).toBeInTheDocument();
      expect(screen.getByText(/14.7654/)).toBeInTheDocument();
      expect(screen.getByText(/-17.3912/)).toBeInTheDocument();
    });

    // Possibilité de retirer la position
    const removeLocBtn = screen.getByRole('button', { name: /retirer la position/i });
    fireEvent.click(removeLocBtn);
    expect(screen.queryByTestId('attached-location-badge')).not.toBeInTheDocument();
    expect(chatEndpoints.askNdam).not.toHaveBeenCalled();
  });

  it('en cas d echec GPS aucun repli silencieux sur 14.7425, -17.3794 et propose la saisie manuelle', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) =>
        error(new Error('User denied geolocation'))
      ),
    };
    vi.stubGlobal('navigator', {
      ...window.navigator,
      geolocation: mockGeolocation,
    });

    renderWithProviders(<ChatPageBody />);

    const locBtn = screen.getByRole('button', { name: /localiser ma position/i });
    fireEvent.click(locBtn);

    // Aucun message envoyé
    expect(chatEndpoints.askNdam).not.toHaveBeenCalled();
    // Aucun repli silencieux sur 14.7425 ni -17.3794
    expect(screen.queryByText(/14.7425/)).not.toBeInTheDocument();

    // Affiche le message d'erreur clair avec saisie manuelle
    await waitFor(() => {
      expect(screen.getByTestId('gps-error-banner')).toBeInTheDocument();
    });

    // Saisie manuelle du lieu
    const manualInput = screen.getByPlaceholderText(/Saisissez votre quartier/i);
    fireEvent.change(manualInput, { target: { value: 'Thiaroye Gare' } });
    fireEvent.click(screen.getByRole('button', { name: /valider le lieu/i }));

    // Le badge avec le nom manuel s'affiche
    await waitFor(() => {
      const badge = screen.getByTestId('attached-location-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Thiaroye Gare');
    });
    expect(chatEndpoints.askNdam).not.toHaveBeenCalled();
  });

  it('au clic sur Envoyer sans photo mais avec position, envoie la question de diagnostic a askNdam', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) =>
        success({
          coords: {
            latitude: 14.7600,
            longitude: -17.3900,
          },
        })
      ),
    };
    vi.stubGlobal('navigator', {
      ...window.navigator,
      geolocation: mockGeolocation,
    });

    renderWithProviders(<ChatPageBody />);

    // Clic sur localiser
    fireEvent.click(screen.getByRole('button', { name: /localiser ma position/i }));

    await waitFor(() => {
      expect(screen.getByTestId('attached-location-badge')).toBeInTheDocument();
    });

    // Clic sur le bouton Envoyer
    const sendButtons = screen.getAllByRole('button', { name: /envoyer/i });
    fireEvent.click(sendButtons[0]);

    await waitFor(() => {
      expect(chatEndpoints.askNdam).toHaveBeenCalledTimes(1);
      const callArgs = chatEndpoints.askNdam.mock.calls[0];
      expect(callArgs[0]).toMatch(/diagnostic|position/i);
      expect(callArgs[1].localisation).toEqual({ lat: 14.76, lng: -17.39 });
      expect(signalementsEndpoints.createSignalement).not.toHaveBeenCalled();
    });
  });

  it('au clic sur Envoyer avec photo, appelle createSignalement avec description, categorie, position et photos', async () => {
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
    }
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) =>
        success({
          coords: {
            latitude: 14.7620,
            longitude: -17.3920,
          },
        })
      ),
    };
    vi.stubGlobal('navigator', {
      ...window.navigator,
      geolocation: mockGeolocation,
    });

    renderWithProviders(<ChatPageBody />);

    // Ajoute position
    fireEvent.click(screen.getByRole('button', { name: /localiser ma position/i }));

    // Ajoute photo
    const cameraInput = screen.getByTestId('camera-file-input');
    const mockFile = new File(['photo-blob'], 'inondation_rue.jpg', { type: 'image/jpeg' });
    fireEvent.change(cameraInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('attached-location-badge')).toBeInTheDocument();
      expect(screen.getByTestId('attached-photo-preview')).toBeInTheDocument();
    });

    // Sélectionne une catégorie (ex: Égouts)
    const egoutsCatBtn = screen.getByRole('button', { name: /égouts/i });
    fireEvent.click(egoutsCatBtn);

    // Clic sur Envoyer
    const sendButtons = screen.getAllByRole('button', { name: /envoyer/i });
    fireEvent.click(sendButtons[0]);

    await waitFor(() => {
      expect(signalementsEndpoints.createSignalement).toHaveBeenCalledTimes(1);
      const callArgs = signalementsEndpoints.createSignalement.mock.calls[0][0];
      expect(callArgs.categorie).toBe('egouts');
      expect(callArgs.latitude).toBeCloseTo(14.762, 3);
      expect(callArgs.longitude).toBeCloseTo(-17.392, 3);
      expect(callArgs.photos).toHaveLength(1);
      expect(chatEndpoints.askNdam).not.toHaveBeenCalled();
      expect(screen.getByTestId('signalement-success-banner')).toBeInTheDocument();
    });
  });

  it('quand l utilisateur envoie un message vocal en français, NDAM répond en vocal avec AudioMessagePlayer sans autoplay et lance speechSynthesis uniquement sur clic', async () => {
    const mockSpeak = vi.fn();
    const mockCancel = vi.fn();
    window.speechSynthesis = {
      speak: mockSpeak,
      cancel: mockCancel,
    };
    window.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
      text,
      lang: '',
      rate: 1,
      onstart: null,
      onend: null,
      onerror: null,
    }));

    chatEndpoints.transcribeAudio.mockResolvedValue({ text: 'Quel temps fait-il ?' });

    const mockStream = {
      getTracks: vi.fn(() => [{ stop: vi.fn() }]),
    };
    vi.stubGlobal('navigator', {
      ...window.navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    globalThis.MediaRecorder = vi.fn().mockImplementation(function () {
      this.start = vi.fn();
      this.stop = vi.fn(() => {
        if (this.onstop) this.onstop();
      });
      this.state = 'recording';
    });
    globalThis.MediaRecorder.isTypeSupported = vi.fn(() => true);

    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-voice-url');
    }

    renderWithProviders(<ChatPageBody />);

    // Clic sur microphone
    const micBtn = screen.getByRole('button', { name: /microphone/i });
    fireEvent.click(micBtn);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // Clic sur Envoyer le vocal
    const sendVoiceBtn = screen.getByTitle(/Envoyer le message vocal/i);
    fireEvent.click(sendVoiceBtn);

    await waitFor(() => {
      expect(chatEndpoints.askNdam).toHaveBeenCalled();
    });

    await waitFor(() => {
      // 2 lecteurs audio présents : le message vocal de l'utilisateur et la réponse vocale de NDAM
      expect(screen.getAllByTitle(/écouter le message vocal|mettre en pause/i)).toHaveLength(2);
    });

    // Règle 1 : La lecture vocale ne démarre JAMAIS toute seule à l'arrivée de la réponse
    expect(mockSpeak).not.toHaveBeenCalled();

    // Règle 3 & 5 : Clics sur les autres boutons (appareil photo, localisation) ne doivent pas lancer de lecture
    const cameraBtn = screen.getByRole('button', { name: /appareil photo/i });
    fireEvent.click(cameraBtn);
    expect(mockSpeak).not.toHaveBeenCalled();

    const locationBtn = screen.getByRole('button', { name: /localiser ma position/i });
    fireEvent.click(locationBtn);
    expect(mockSpeak).not.toHaveBeenCalled();

    // speechSynthesis.speak n'est appelé que si on clique sur le bouton lecture du lecteur NDAM
    const playButtons = screen.getAllByTitle(/écouter le message vocal/i);
    fireEvent.click(playButtons[1]);
    expect(mockSpeak).toHaveBeenCalledTimes(1);

    // Si on clique ensuite sur un autre bouton (caméra), la lecture en cours s'arrête
    fireEvent.click(cameraBtn);
    expect(mockCancel).toHaveBeenCalled();

    const transcriptionToggles = screen.getAllByRole('button', { name: /afficher la transcription/i });
    expect(transcriptionToggles).toHaveLength(2);

    // Basculer l'affichage de la transcription de NDAM
    fireEvent.click(transcriptionToggles[1]);
    expect(screen.getByRole('button', { name: /masquer la transcription/i })).toBeInTheDocument();
  });

  it('en langue Wolof, le message vocal reçoit une réponse écrite avec note sans synthèse vocale française', async () => {
    const mockSpeak = vi.fn();
    window.speechSynthesis = {
      speak: mockSpeak,
      cancel: vi.fn(),
    };
    window.SpeechSynthesisUtterance = vi.fn();

    chatEndpoints.transcribeAudio.mockResolvedValue({ text: 'Taw bi naka la ?' });

    const mockStream = {
      getTracks: vi.fn(() => [{ stop: vi.fn() }]),
    };
    vi.stubGlobal('navigator', {
      ...window.navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    globalThis.MediaRecorder = vi.fn().mockImplementation(function () {
      this.start = vi.fn();
      this.stop = vi.fn(() => {
        if (this.onstop) this.onstop();
      });
      this.state = 'recording';
    });
    globalThis.MediaRecorder.isTypeSupported = vi.fn(() => true);

    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-voice-url');
    }

    renderWithProviders(<ChatPageBody />);

    // Basculer en Wolof
    const toggleLangBtn = screen.getByTitle(/Basculer entre Français et Wolof/i);
    fireEvent.click(toggleLangBtn);

    // Clic sur microphone
    const micBtn = screen.getByRole('button', { name: /microphone/i });
    fireEvent.click(micBtn);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // Clic sur envoyer le vocal
    const sendVoiceBtn = screen.getByTitle(/Yònnee wax bi/i);
    fireEvent.click(sendVoiceBtn);

    // En Wolof, le volet de révision de transcription s'ouvre d'abord
    await waitFor(() => {
      expect(screen.getByText(/Dëggal sa wax balaa yònnee/i)).toBeInTheDocument();
    });

    // Validation de l'envoi
    const confirmSendBtn = screen.getByRole('button', { name: /Yònnee léegi/i });
    fireEvent.click(confirmSendBtn);

    await waitFor(() => {
      expect(chatEndpoints.askNdam).toHaveBeenCalled();
      // Réponse écrite avec la note d'indisponibilité wolof
      expect(screen.getByText(/Wax ci baat amul ci làkku wolof ci appareil bi/i)).toBeInTheDocument();
      // Aucune lecture vocale en français déclenchée
      expect(mockSpeak).not.toHaveBeenCalled();
    });
  });

  it('si la synthèse vocale est indisponible dans le navigateur, NDAM répond en texte avec mention brève', async () => {
    delete window.speechSynthesis;

    chatEndpoints.transcribeAudio.mockResolvedValue({ text: 'Quel est le risque ?' });

    const mockStream = {
      getTracks: vi.fn(() => [{ stop: vi.fn() }]),
    };
    vi.stubGlobal('navigator', {
      ...window.navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    globalThis.MediaRecorder = vi.fn().mockImplementation(function () {
      this.start = vi.fn();
      this.stop = vi.fn(() => {
        if (this.onstop) this.onstop();
      });
      this.state = 'recording';
    });
    globalThis.MediaRecorder.isTypeSupported = vi.fn(() => true);

    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-voice-url');
    }

    renderWithProviders(<ChatPageBody />);

    // Clic sur microphone
    const micBtn = screen.getByRole('button', { name: /microphone/i });
    fireEvent.click(micBtn);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // Clic sur Envoyer le vocal
    const sendVoiceBtn = screen.getByTitle(/Envoyer le message vocal/i);
    fireEvent.click(sendVoiceBtn);

    await waitFor(() => {
      expect(chatEndpoints.askNdam).toHaveBeenCalled();
      // NDAM répond en texte et affiche la note brève d'indisponibilité
      expect(screen.getByText(/Synthèse vocale indisponible sur cet appareil/i)).toBeInTheDocument();
    });
  });

  it("en situation normale (risque faible), le bouton d'urgence Appeler le 18 n'est pas affiché", async () => {
    chatEndpoints.askNdam.mockResolvedValue({
      reply: 'Le niveau de risque actuel à Thiaroye-sur-Mer est FAIBLE. Météo : Ensoleillé.',
    });

    renderWithProviders(<ChatPageBody />);

    const input = screen.getByPlaceholderText(/Écrivez votre question/i);
    fireEvent.change(input, { target: { value: 'Quel est le niveau de risque ?' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText(/Le niveau de risque actuel à Thiaroye-sur-Mer est FAIBLE/i)).toBeInTheDocument();
    });

    // Le bouton d'urgence 18 ne doit pas être affiché
    expect(screen.queryByRole('link', { name: /appeler le 18|wotleel 18/i })).not.toBeInTheDocument();
  });

  it("en situation d'alerte critique ou question explicite sur les pompiers, le bouton Appeler le 18 est affiché", async () => {
    chatEndpoints.askNdam.mockResolvedValue({
      reply: '⚠️ ALERTE [CRITIQUE] — Risque majeur. En cas d urgence immédiate, contactez les sapeurs-pompiers au 18.',
    });

    renderWithProviders(<ChatPageBody />);

    const input = screen.getByPlaceholderText(/Écrivez votre question/i);
    fireEvent.change(input, { target: { value: 'Quel est le numéro des pompiers ?' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /appeler le 18|wotleel 18/i })).toBeInTheDocument();
    });
  });

  it('préserve les listes courtes et tirets sans altérer la mise en page', async () => {
    chatEndpoints.askNdam.mockResolvedValue({
      reply: 'Voici les consignes :\n- Couper le disjoncteur\n- Mettre les meubles en hauteur\n\nRestez prudents.',
    });

    renderWithProviders(<ChatPageBody />);

    const input = screen.getByPlaceholderText(/Écrivez votre question/i);
    fireEvent.change(input, { target: { value: 'Que faire avant une inondation ?' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText(/- Couper le disjoncteur/i)).toBeInTheDocument();
      expect(screen.getByText(/- Mettre les meubles en hauteur/i)).toBeInTheDocument();
    });
  });

  it('arrête toute lecture en cours au démontage du composant', () => {
    const mockCancel = vi.fn();
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: mockCancel,
    };

    const { unmount } = renderWithProviders(<ChatPageBody />);
    unmount();

    expect(mockCancel).toHaveBeenCalled();
  });

  it('sur ordinateur, le clic sur "Prendre une photo" ouvre la webcam sans changer l adresse ni appeler askNdam', async () => {
    const stopTrack = vi.fn();
    const mockStream = {
      getTracks: vi.fn(() => [{ stop: stopTrack }]),
    };

    vi.stubGlobal('navigator', {
      ...window.navigator,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-photo-url');
    }

    const initialHref = window.location.href;

    renderWithProviders(<ChatPageBody />);

    // Clic sur l'icône appareil photo
    const photoBtn = screen.getByRole('button', { name: /appareil photo/i });
    fireEvent.click(photoBtn);

    // Le menu popover de choix photo apparaît
    expect(screen.getByTestId('photo-picker-menu')).toBeInTheDocument();

    // Clic sur "Prendre une photo"
    const takePhotoBtn = screen.getByRole('button', { name: /prendre une photo/i });
    fireEvent.click(takePhotoBtn);

    // L'accès caméra direct (webcam) est sollicité
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'user' },
        audio: false,
      });
      expect(screen.getByTestId('webcam-preview-container')).toBeInTheDocument();
    });

    // L'adresse de la page ne change JAMAIS
    expect(window.location.href).toBe(initialHref);

    // askNdam n'est PAS appelé
    expect(chatEndpoints.askNdam).not.toHaveBeenCalled();

    // Clic sur "Prendre la photo"
    const captureBtn = screen.getByRole('button', { name: /prendre la photo/i });
    fireEvent.click(captureBtn);

    // Le volet webcam se ferme et le flux est coupé
    await waitFor(() => {
      expect(screen.queryByTestId('webcam-preview-container')).not.toBeInTheDocument();
      expect(stopTrack).toHaveBeenCalled();
    });

    // La miniature de la photo attachée apparaît avec sa croix de retrait
    expect(screen.getByTestId('attached-photo-preview')).toBeInTheDocument();
    expect(chatEndpoints.askNdam).not.toHaveBeenCalled();

    // Retirer la photo avec la croix
    const removeBtn = screen.getByLabelText(/retirer la photo/i);
    fireEvent.click(removeBtn);

    expect(screen.queryByTestId('attached-photo-preview')).not.toBeInTheDocument();
    expect(chatEndpoints.askNdam).not.toHaveBeenCalled();
  });

  it('si l accès à la caméra est refusé ou indisponible, affiche un message clair et propose Choisir dans la galerie', async () => {
    vi.stubGlobal('navigator', {
      ...window.navigator,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    });

    renderWithProviders(<ChatPageBody />);

    // Clic sur l'icône appareil photo
    const photoBtn = screen.getByRole('button', { name: /appareil photo/i });
    fireEvent.click(photoBtn);

    // Clic sur "Prendre une photo"
    const takePhotoBtn = screen.getByRole('button', { name: /prendre une photo/i });
    fireEvent.click(takePhotoBtn);

    // Bannière d'erreur affichée avec proposition de la galerie
    await waitFor(() => {
      expect(screen.getByTestId('camera-error-banner')).toBeInTheDocument();
      expect(screen.getByText(/Accès à la caméra refusé ou indisponible/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /choisir dans la galerie/i })).toBeInTheDocument();
    });

    // Aucun appel NDAM
    expect(chatEndpoints.askNdam).not.toHaveBeenCalled();
  });

  it('coupe le flux de la caméra lors de l annulation et au démontage', async () => {
    const stopTrack = vi.fn();
    const mockStream = {
      getTracks: vi.fn(() => [{ stop: stopTrack }]),
    };

    vi.stubGlobal('navigator', {
      ...window.navigator,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    const { unmount } = renderWithProviders(<ChatPageBody />);

    // Ouverture webcam
    const photoBtn = screen.getByRole('button', { name: /appareil photo/i });
    fireEvent.click(photoBtn);
    const takePhotoBtn = screen.getByRole('button', { name: /prendre une photo/i });
    fireEvent.click(takePhotoBtn);

    await waitFor(() => {
      expect(screen.getByTestId('webcam-preview-container')).toBeInTheDocument();
    });

    // Annuler
    const cancelBtn = screen.getByRole('button', { name: /annuler/i });
    fireEvent.click(cancelBtn);

    expect(stopTrack).toHaveBeenCalled();
    expect(screen.queryByTestId('webcam-preview-container')).not.toBeInTheDocument();

    // Réouverture et test démontage
    fireEvent.click(photoBtn);
    fireEvent.click(screen.getByRole('button', { name: /prendre une photo/i }));
    await waitFor(() => {
      expect(screen.getByTestId('webcam-preview-container')).toBeInTheDocument();
    });

    unmount();
    expect(stopTrack).toHaveBeenCalledTimes(2);
  });
});


