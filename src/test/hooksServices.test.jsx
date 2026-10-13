import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useAlertesRecentes, useAlertesListe } from '../shared/hooks/useAlertes';
import { usePrevisions } from '../shared/hooks/usePrevisions';
import { useCapteurs } from '../shared/hooks/useCapteurs';
import { useZones } from '../shared/hooks/useZones';
import { usePredictions } from '../shared/hooks/usePredictions';
import { useRefuges } from '../shared/hooks/useRefuges';
import { useSegments } from '../shared/hooks/useSegments';

vi.mock('../api/endpoints/alertes', () => ({
  getAlertes: vi.fn().mockResolvedValue({ count: 1, results: [{ id: 1, niveau: 'rouge' }] }),
}));

vi.mock('../api/endpoints/previsions', () => ({
  getPrevisions: vi.fn().mockResolvedValue({ results: [{ id: 1, temperature: 30 }] }),
}));

vi.mock('../api/endpoints/capteurs', () => ({
  getCapteurs: vi.fn().mockResolvedValue([{ id: 1, nom: 'Capteur A' }]),
}));

vi.mock('../api/endpoints/zones', () => ({
  getZones: vi.fn().mockResolvedValue({ features: [{ id: 1 }] }),
}));

vi.mock('../api/endpoints/predictions', () => ({
  getPredictions: vi.fn().mockResolvedValue([{ id: 1, score: 0.8 }]),
}));

vi.mock('../api/endpoints/refuges', () => ({
  getRefuges: vi.fn().mockResolvedValue([{ id: 1, nom: 'Refuge A' }]),
}));

vi.mock('../api/endpoints/segments', () => ({
  getSegments: vi.fn().mockResolvedValue([{ id: 1 }]),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe('Hooks de l’application', () => {
  it('useAlertesRecentes récupère les alertes récentes', async () => {
    const { result } = renderHook(() => useAlertesRecentes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.results).toHaveLength(1);
  });

  it('useAlertesListe récupère la liste des alertes', async () => {
    const { result } = renderHook(() => useAlertesListe(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.count).toBe(1);
  });

  it('usePrevisions récupère les prévisions', async () => {
    const { result } = renderHook(() => usePrevisions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.results[0].temperature).toBe(30);
  });

  it('useCapteurs récupère la liste des capteurs', async () => {
    const { result } = renderHook(() => useCapteurs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data[0].nom).toBe('Capteur A');
  });

  it('useZones récupère les zones', async () => {
    const { result } = renderHook(() => useZones(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.features).toHaveLength(1);
  });

  it('usePredictions récupère les prédictions', async () => {
    const { result } = renderHook(() => usePredictions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data[0].score).toBeGreaterThan(0.79);
  });

  it('useRefuges récupère les refuges', async () => {
    const { result } = renderHook(() => useRefuges(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data[0].nom).toBe('Refuge A');
  });

  it('useSegments récupère les segments', async () => {
    const { result } = renderHook(() => useSegments(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});
