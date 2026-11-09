import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ProfilPageBody from '../citizen/pages/ProfilPageBody';
import { ThemeProvider } from '../theme/ThemeContext';

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => <div data-testid="citizen-shell">{children}</div>,
}));

let mockUsername = 'citoyen@mbeundmi.sn';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    username: mockUsername,
    role: 'citoyen',
    isAuthenticated: !!mockUsername,
    logout: vi.fn(),
  }),
}));

vi.mock('../shared/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    data: {
      id: 1,
      username: 'citoyen@mbeundmi.sn',
      first_name: 'Awa',
      last_name: 'Diop',
      email: 'citoyen@mbeundmi.sn',
      date_joined: '2026-09-01T10:00:00Z',
      profile: {
        role: 'citoyen',
        telephone: '+221 77 000 00 01',
        is_verified: true,
      },
    },
    isLoading: false,
  }),
  useUpdateCurrentUser: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
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

  it('affiche le profil citoyen complet et les informations de contact', () => {
    renderWithProviders(<ProfilPageBody />);

    expect(screen.getAllByText(/citoyen@mbeundmi.sn/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Awa Diop')).toBeInTheDocument();
    expect(screen.getByText('+221 77 000 00 01')).toBeInTheDocument();
    expect(screen.getByText(/Identifiant de connexion/i)).toBeInTheDocument();
  });

  it("affiche le bouton pour modifier l'avatar et permet de choisir une photo depuis l'appareil", () => {
    localStorage.clear();
    renderWithProviders(<ProfilPageBody />);

    // Unique bouton caméra/crayon présent sur le cercle d'avatar
    const avatarButton = screen.getByRole('button', { name: /Modifier l'avatar/i });
    expect(avatarButton).toBeInTheDocument();

    const fileInput = screen.getByTestId('avatar-file-input');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'image/*');

    // Vérifie qu'il n'y a plus le bouton doublon textuel
    expect(screen.queryByText("Changer d'avatar")).not.toBeInTheDocument();
  });

  it('affiche le mur CitizenAccountGate si le citoyen est en mode anonyme sans compte', () => {
    mockUsername = null;
    renderWithProviders(<ProfilPageBody />);

    expect(screen.getByText('Compte Citoyen Requis')).toBeInTheDocument();
    expect(screen.getByText('Profil Citoyen Sécurisé')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Se connecter/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Créer un compte/i })).toBeInTheDocument();
    mockUsername = 'citoyen@mbeundmi.sn';
  });
});
