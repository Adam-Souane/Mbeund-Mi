import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFormulaireDepuis } from '../shared/hooks/useFormulaireDepuis';
import { definirConnexion, useConnexionTempsReel } from '../realtime/etatConnexion';

const VIDE = { eau_potable_litres: 0, lampe_torche: false };

describe('useFormulaireDepuis', () => {
  it('part des valeurs vides tant que le serveur n’a rien renvoyé', () => {
    const { result } = renderHook(({ source }) => useFormulaireDepuis(source, VIDE), {
      initialProps: { source: undefined },
    });
    expect(result.current[0]).toEqual(VIDE);
  });

  it('se remplit quand les données du serveur arrivent, puis garde la saisie', () => {
    const { result, rerender } = renderHook(({ source }) => useFormulaireDepuis(source, VIDE), {
      initialProps: { source: undefined },
    });
    const serveur = { eau_potable_litres: 12, lampe_torche: true };
    rerender({ source: serveur });
    expect(result.current[0]).toEqual(serveur);

    act(() => result.current[1]((f) => ({ ...f, eau_potable_litres: 20 })));
    rerender({ source: serveur }); // même objet : la saisie n’est pas écrasée
    expect(result.current[0].eau_potable_litres).toBe(20);
  });
});

describe('état de la connexion temps réel', () => {
  it('prévient les composants abonnés', () => {
    const { result } = renderHook(() => useConnexionTempsReel());
    expect(result.current).toBe(false);
    act(() => definirConnexion(true));
    expect(result.current).toBe(true);
    act(() => definirConnexion(false));
    expect(result.current).toBe(false);
  });
});
