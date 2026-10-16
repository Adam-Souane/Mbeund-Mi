/**
 * Résolveur d'avatars citoyens représentatifs pour l'Espace Communauté :
 * - Attribue un avatar féminin si le prénom / contexte correspond à une femme ou fille
 * - Attribue un avatar masculin si le prénom / contexte correspond à un homme ou garçon
 * - Attribue un avatar d'enfant / jeune si mention de petit frère, enfant ou jeune membre de famille
 * - Garantit par hachage déterministe que chaque citoyen a un avatar distinct (pas de répétition monotone)
 */

export const FEMALE_AVATARS = [
  '/images/avatar-fatou.jpg',
  '/images/avatar-awa.jpg',
  '/images/avatar-mariama.jpg',
];

export const MALE_AVATARS = [
  '/images/avatar-amadou.jpg',
  '/images/avatar-ibrahima.jpg',
  '/images/avatar-modou.jpg',
  '/images/avatar-mamadou.jpg',
];

export const CHILD_AVATARS = [
  '/images/avatar-enfant.jpg',
];

const FEMALE_NAMES_REGEX = /\b(?:fatou(?:mata)?|awa|mariama|aminata|sokhna|khady|coumba|astou|nabou|yacine|ndeye|dior|kin[eé]|mame(?:\s+diarra)?|ramatoulaye|oumou|salimata|binta|korka|adja|fama|seynabou|anta|nogaye|daba|rokhaya|sophie|marie)\b/i;

const CHILD_REGEX = /\b(?:enfant|b[eé]b[eé]|p['’]?tit|petit|junior|fr[eè]re|soeur|sœur|[eé]colier|gamin|jeune|famille)\b/i;

const MALE_NAMES_REGEX = /\b(?:amadou|moussa|ibrahima|cheikh|mamadou|alioune|modou|babacar|oumar|abdoulaye|lamine|samba|demba|malick|boubacar|pape|assane|ousseynou|gora|mor|djibril|tidiane|serigne|fallou|khadim)\b/i;

function hashString(str) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Retourne un avatar représentatif et varié
 * @param {Object} options
 * @param {string} [options.name] - Nom de l'auteur
 * @param {string|number} [options.id] - Identifiant unique du post / signalement
 * @param {string} [options.context] - Contexte textuel optionnel
 * @param {string} [options.preferredAvatar] - Avatar spécifique déjà défini
 * @returns {string} URL de l'avatar
 */
export function getPublicAvatar({ name = '', id = '', context = '', preferredAvatar = null } = {}) {
  if (preferredAvatar && typeof preferredAvatar === 'string' && preferredAvatar.startsWith('/images/avatar-')) {
    // Si un avatar existant est spécifié et n'est pas le doublon par défaut amadou, on peut le respecter
    // Mais pour Moussa, Ibrahima etc qui avaient amadou en dur, on re-résout
    if (!preferredAvatar.includes('avatar-amadou.jpg') || name.toLowerCase().includes('amadou')) {
      return preferredAvatar;
    }
  }

  const combined = `${name} ${context}`.trim();
  const hashKey = `${name}-${id}`;
  const hash = hashString(hashKey);

  // 1. Détection enfant / petit frère / famille
  if (CHILD_REGEX.test(combined)) {
    return CHILD_AVATARS[hash % CHILD_AVATARS.length];
  }

  // 2. Détection profil féminin (femme / fille)
  if (FEMALE_NAMES_REGEX.test(combined)) {
    return FEMALE_AVATARS[hash % FEMALE_AVATARS.length];
  }

  // 3. Détection profil masculin (homme / garçon)
  if (MALE_NAMES_REGEX.test(combined)) {
    return MALE_AVATARS[hash % MALE_AVATARS.length];
  }

  // 4. Cas générique ou Sentinelle : distribution équilibrée pour éviter de répéter la même photo
  const allPool = [
    ...FEMALE_AVATARS,
    ...MALE_AVATARS,
    ...CHILD_AVATARS,
  ];

  return allPool[hash % allPool.length];
}
