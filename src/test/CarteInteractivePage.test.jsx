import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CarteInteractivePage from '../autorite/pages/CarteInteractivePage';

vi.mock('../autorite/desktop/AutoriteShell', () => ({
  default: ({ children }) => <div data-testid="autorite-shell">{children}</div>,
}));

vi.mock('../shared/components/map/InteractiveMap', () => ({
  default: ({ height }) => <div data-testid="interactive-map" style={{ height }}>Carte Interactive Mock</div>,
}));

vi.mock('../shared/hooks/useZones', () => ({
  useZones: () => ({
    data: { features: [{ id: 1, properties: { quartier: 'Thiaroye Gare' } }] },
    isLoading: false,
  }),
}));

vi.mock('../shared/hooks/useInondations', () => ({
  useInondations: () => ({ data: [], isLoading: false }),
}));

vi.mock('../shared/hooks/useCapteurs', () => ({
  useCapteurs: () => ({ data: [{ id: 1, nom: 'Capteur 1' }], isLoading: false }),
}));

vi.mock('../shared/hooks/useSegments', () => ({
  useSegments: () => ({ data: [], isLoading: false }),
}));

vi.mock('../shared/hooks/useSignalements', () => ({
  useSignalementsApercu: () => ({
    data: { results: { features: [{ id: 101, properties: { description: 'Eau rue 1' } }] } },
    isLoading: false,
  }),
}));

vi.mock('../shared/hooks/useRefuges', () => ({
  useRefuges: () => ({ data: [{ id: 1, nom: 'École Thiaroye' }], isLoading: false }),
}));

describe('CarteInteractivePage', () => {
  it('affiche le bandeau SIG et le composant cartographique immersif', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CarteInteractivePage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Carte interactive \(SIG\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Télémétrie Live/i)).toBeInTheDocument();
    expect(screen.getByText(/Secteurs/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Capteurs IoT/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId('interactive-map')).toBeInTheDocument();
  });
});
