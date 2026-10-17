import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ParametresPageBody from '../citizen/pages/ParametresPageBody';
import { ThemeProvider } from '../theme/ThemeContext';

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => <div data-testid="citizen-shell">{children}</div>,
}));

vi.mock('../shared/hooks/useZones', () => ({
  useZones: () => ({
    data: {
      features: [
        { id: 1, properties: { quartier: 'Thiaroye Gare' } },
        { id: 2, properties: { quartier: 'Ndakhane' } },
      ],
    },
  }),
}));

const mockSaveVulnerabilite = vi.fn();
vi.mock('../shared/hooks/useVulnerabilite', () => ({
  useMonProfilVulnerabilite: () => ({
    data: {
      zone: 2,
      personnes_agees: 1,
      enfants_bas_age: 2,
      personne_mobilite_reduite: true,
      femme_enceinte: false,
      notes: 'Lit médicalisé',
    },
  }),
  useSaveMonProfilVulnerabilite: () => ({
    mutate: mockSaveVulnerabilite,
    isPending: false,
    isSuccess: false,
    isError: false,
  }),
}));

vi.mock('../shared/hooks/useRelaisQuartier', () => ({
  useMonRelais: () => ({ data: null }),
  useCreateRelais: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteRelais: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../shared/hooks/useSurvivalKit', () => ({
  useSurvivalKit: () => ({ data: null }),
  useSaveSurvivalKit: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../shared/hooks/useEmergencyContact', () => ({
  useEmergencyContact: () => ({ data: null }),
  useSaveEmergencyContact: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../shared/hooks/useFormulaireDepuis', () => ({
  useFormulaireDepuis: (initialData) => {
    return [initialData || {}, vi.fn()];
  },
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

describe('ParametresPageBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le bandeau Paramètres et les sections Personnes vulnérables du foyer', () => {
    renderWithProviders(<ParametresPageBody />);

    expect(screen.getByText(/Paramètres & Sécurité du foyer/i)).toBeInTheDocument();
    expect(screen.getByText(/Personnes vulnérables du foyer/i)).toBeInTheDocument();
    expect(screen.getByText(/Engagement Relais de quartier/i)).toBeInTheDocument();
    expect(screen.getByText(/Kit de survie et préparation d'urgence/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact d’urgence à alerter/i)).toBeInTheDocument();
  });

  it('affiche le bouton pour enregistrer les personnes vulnérables', () => {
    renderWithProviders(<ParametresPageBody />);

    const submitBtn = screen.getByRole('button', { name: /Enregistrer les personnes vulnérables/i });
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);

    expect(mockSaveVulnerabilite).toHaveBeenCalled();
  });

  it('affiche le commutateur de mode sombre/clair dans le bandeau supérieur', () => {
    renderWithProviders(<ParametresPageBody />);

    const themeToggleBtn = screen.getByRole('switch');
    expect(themeToggleBtn).toBeInTheDocument();
    fireEvent.click(themeToggleBtn);
  });
});
