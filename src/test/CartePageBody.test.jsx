import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CartePageBody from '../citizen/pages/CartePageBody';

vi.mock('../citizen/shared/CitizenShell', () => ({
  default: ({ children }) => <div data-testid="citizen-shell">{children}</div>,
}));

vi.mock('../shared/components/map/InteractiveMap', () => ({
  default: () => <div data-testid="interactive-map">Carte Interactive Mock</div>,
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
});
