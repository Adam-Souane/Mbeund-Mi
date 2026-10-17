import { describe, expect, it } from 'vitest';
import { formatCompactDate } from '../shared/utils/dateFormatter';

describe('formatCompactDate', () => {
  it('convertit les durées en jours en format compact (ex: 2j, 1j, 3j)', () => {
    expect(formatCompactDate('Posté il y a 2 jours')).toBe('2j');
    expect(formatCompactDate('Posté il y a 1 jour')).toBe('1j');
    expect(formatCompactDate('3 jours')).toBe('3j');
    expect(formatCompactDate('5j')).toBe('5j');
  });

  it('convertit les durées en mois en format compact (ex: 1m, 2m)', () => {
    expect(formatCompactDate('Il y a 1 mois')).toBe('1m');
    expect(formatCompactDate('Il y a 3 mois')).toBe('3m');
  });

  it('convertit les durées en années en format compact (ex: 1a, 2a)', () => {
    expect(formatCompactDate('Il y a 1 an')).toBe('1a');
    expect(formatCompactDate('Il y a 2 ans')).toBe('2a');
  });

  it('convertit les durées en heures et minutes', () => {
    expect(formatCompactDate('Il y a 1h15')).toBe('1h');
    expect(formatCompactDate('Il y a 3h')).toBe('3h');
    expect(formatCompactDate('Il y a 15 min')).toBe('15 min');
    expect(formatCompactDate("Posté à l'instant")).toBe("À l'instant");
  });

  it('gère les dates ISO sans erreur', () => {
    const hier = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    expect(formatCompactDate(hier)).toBe('1j');
  });

  it('ne produit jamais un âge absurde (25a) pour une date localisée ambiguë', () => {
    expect(formatCompactDate('16 oct., 12:00')).not.toMatch(/\d+a$/);
  });
});
