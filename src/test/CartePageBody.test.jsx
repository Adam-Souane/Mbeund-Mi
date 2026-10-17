import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CartePageBody from '../citizen/pages/CartePageBody';

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => <div data-testid="citizen-shell">{children}</div>,
}));

export const mockInteractiveMap = vi.fn((props) => (
  <div data-testid="interactive-map" data-selected={props.selectedSignalementId}>
    Carte Interactive Mock
  </div>
));

vi.mock('../shared/components/map/InteractiveMap', () => ({
  default: (props) => mockInteractiveMap(props),
  LAYER_LABELS: {
    zones: 'Zones à risque',
    signalements: 'Signalements citoyens',
    segments: 'Rues & drainage',
    refuges: 'Points de refuge',
  },
  LAYER_ICONS: {},
}));

vi.mock('../shared/hooks/useZones', () => ({
  useZones: () => ({
    data: { features: [] },
    isLoading: false,
  }),
}));

vi.mock('../shared/hooks/useCapteurs', () => ({
  useCapteurs: () => ({
    data: [],
  }),
}));

vi.mock('../shared/hooks/useSignalements', () => ({
  useSignalements: () => ({
    data: { results: [] },
  }),
  useSignalementsApercu: () => ({
    data: { results: [] },
  }),
}));

vi.mock('../shared/hooks/useRefuges', () => ({
  useRefuges: () => ({
    data: [],
  }),
}));

vi.mock('../shared/hooks/useRelaisQuartier', () => ({
  useRelaisQuartier: () => ({
    data: [],
  }),
}));

vi.mock('../shared/hooks/useItineraireSecurise', () => ({
  useItineraireSecurise: () => ({
    data: null,
  }),
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

describe('CartePageBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre et la carte interactive mockée', () => {
    renderWithProviders(<CartePageBody />);

    expect(screen.getByText(/Carte des risques/i)).toBeInTheDocument();
    expect(screen.getByTestId('interactive-map')).toBeInTheDocument();
  });

  it('lit le paramètre signalementId dans l’URL et le transmet à InteractiveMap', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/citoyen/carte?signalementId=42&quartier=Ndakhane']}>
          <CartePageBody />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('interactive-map')).toBeInTheDocument();
    expect(mockInteractiveMap).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedSignalementId: '42',
        selectedQuartier: 'Ndakhane',
      })
    );
  });

  it('affiche la barre de boutons de filtres des couches au-dessus de la carte', () => {
    renderWithProviders(<CartePageBody />);

    expect(screen.getByText(/Zones à risque/i)).toBeInTheDocument();
    expect(screen.getByText(/Signalements citoyens/i)).toBeInTheDocument();
    expect(screen.getByText(/Rues & drainage/i)).toBeInTheDocument();
    expect(screen.getByText(/Points de refuge/i)).toBeInTheDocument();
  });
});
