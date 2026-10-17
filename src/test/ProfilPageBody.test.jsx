import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ProfilPageBody from '../citizen/pages/ProfilPageBody';
import { ThemeProvider } from '../theme/ThemeContext';

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => <div data-testid="citizen-shell">{children}</div>,
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    username: 'citoyen@mbeundmi.sn',
    role: 'citoyen',
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock('../shared/hooks/useZones', () => ({
  useZones: () => ({
    data: { features: [] },
  }),
}));

vi.mock('../shared/hooks/useVulnerabilite', () => ({
  useMonProfilVulnerabilite: () => ({ data: null }),
  useSaveMonProfilVulnerabilite: () => ({ mutate: vi.fn() }),
}));

vi.mock('../shared/hooks/useRelaisQuartier', () => ({
  useMonRelais: () => ({ data: null }),
  useCreateRelais: () => ({ mutate: vi.fn() }),
  useDeleteRelais: () => ({ mutate: vi.fn() }),
}));

vi.mock('../shared/hooks/useSurvivalKit', () => ({
  useSurvivalKit: () => ({ data: null }),
  useSaveSurvivalKit: () => ({ mutate: vi.fn() }),
}));

vi.mock('../shared/hooks/useEmergencyContact', () => ({
  useEmergencyContact: () => ({ data: null }),
  useSaveEmergencyContact: () => ({ mutate: vi.fn() }),
}));

vi.mock('../shared/hooks/useMySignalements', () => ({
  useMySignalements: () => ({ data: { results: [] } }),
}));

vi.mock('../shared/hooks/useFormulaireDepuis', () => ({
  useFormulaireDepuis: () => [{}, vi.fn(), vi.fn()],
}));

function renderWithProviders(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ThemeProvider>{ui}</ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProfilPageBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le profil citoyen et les options de configuration', () => {
    renderWithProviders(<ProfilPageBody />);

    expect(screen.getAllByText('citoyen@mbeundmi.sn').length).toBeGreaterThan(0);
    expect(screen.getByText(/Identifiant de connexion/i)).toBeInTheDocument();
  });

  it("affiche le bouton crayon, ouvre la modale de bibliothèque et permet de sélectionner un avatar", () => {
    localStorage.clear();
    renderWithProviders(<ProfilPageBody />);

    // Unique bouton crayon présent sur le cercle d'avatar
    const pencilButton = screen.getByRole('button', { name: /Modifier l'avatar/i });
    expect(pencilButton).toBeInTheDocument();

    // Clic pour ouvrir la modale
    fireEvent.click(pencilButton);

    // Modale ouverte avec les deux sections
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Personnaliser votre avatar/i)).toBeInTheDocument();
    expect(screen.getByText(/Bibliothèque de portraits citoyens/i)).toBeInTheDocument();
    expect(screen.getByText(/Bibliothèque d'icônes Sentinelles/i)).toBeInTheDocument();
    expect(screen.getByText(/Uploader une photo depuis votre appareil/i)).toBeInTheDocument();

    // Sélection d'un avatar photo
    const fatouBtn = screen.getByRole('button', { name: /Fatou/i });
    fireEvent.click(fatouBtn);

    // Enregistrement
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer cet avatar/i }));

    // Persistance dans localStorage
    expect(localStorage.getItem('mbeund_mi_user_avatar')).toBe('/images/avatar-fatou.jpg');
  });
});
