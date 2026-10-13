import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
