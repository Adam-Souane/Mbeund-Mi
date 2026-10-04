import { describe, expect, it } from 'vitest';
import { decodeJwt, isTokenExpired } from '../auth/jwt';
import { flattenApiErrors } from '../shared/utils/apiErrors';
import { emailValide } from '../auth-pages/styles';
import { remplir } from '../shared/hooks/useFormulaireDepuis';

function jeton(payload) {
  const base64url = (objet) => btoa(JSON.stringify(objet)).replaceAll('=', '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${base64url({ alg: 'HS256' })}.${base64url(payload)}.signature`;
}

describe('decodeJwt', () => {
  it('lit le rôle du jeton', () => {
    expect(decodeJwt(jeton({ role: 'autorite', user_id: '4' }))).toEqual({ role: 'autorite', user_id: '4' });
  });

  it('renvoie null pour un jeton absent ou illisible', () => {
    expect(decodeJwt(null)).toBeNull();
    expect(decodeJwt('pas.un-jeton')).toBeNull();
  });

  it('détecte un jeton expiré', () => {
    expect(isTokenExpired(jeton({ exp: Math.floor(Date.now() / 1000) - 60 }))).toBe(true);
    expect(isTokenExpired(jeton({ exp: Math.floor(Date.now() / 1000) + 600 }))).toBe(false);
  });
});

describe('flattenApiErrors', () => {
  it('aplatit les erreurs de validation DRF', () => {
    const erreur = { response: { data: { email: ['Email invalide'], telephone: ['Numéro requis'] } } };
    expect(flattenApiErrors(erreur)).toEqual(['Email invalide', 'Numéro requis']);
  });

  it('privilégie le message detail', () => {
    expect(flattenApiErrors({ response: { data: { detail: 'Accès refusé' } } })).toEqual(['Accès refusé']);
  });

  it('donne un message générique sans réponse du serveur', () => {
    expect(flattenApiErrors(new Error('réseau'))).toEqual(['Une erreur est survenue. Veuillez réessayer.']);
  });
});

describe('emailValide', () => {
  it.each([
    ['awa.diop@gmail.com', true],
    ['awa@exemple.sn', true],
    ['awa@', false],
    ['awa.gmail.com', false],
    ['', false],
  ])('%s → %s', (email, attendu) => {
    expect(emailValide(email)).toBe(attendu);
  });
});

describe('remplir', () => {
  it('prend les valeurs du serveur et complète avec les valeurs par défaut', () => {
    const vide = { nom: '', relation: 'famille', alerter: true };
    expect(remplir({ nom: 'Moussa', relation: null, inconnu: 'ignoré' }, vide)).toEqual({
      nom: 'Moussa',
      relation: 'famille',
      alerter: true,
    });
  });
});
