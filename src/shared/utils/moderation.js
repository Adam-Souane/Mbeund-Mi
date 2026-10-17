/**
 * Système de modération et de bienveillance communautaire :
 * - Détecte les insultes, grossièretés, menaces et incitations à la haine (français et wolof)
 * - Gère les signalements citoyens transmis à l'administration
 * - Gère le statut de suspension / bannissement exclusif de l'Espace Communauté
 */

// Mots et expressions proscrits pour préserver un cadre citoyen respectueux et constructif
const PROHIBITED_PATTERNS = [
  // Insultes et grossièretés usuelles en français
  /\b(?:con|cons|conne|connes|connard|connasse|salaud|salope|saloperie|encul[eé]|b[aâ]tard|ferme ta gueule|ta gueule|merde|fdp|nique|idiot|imb[eé]cile|cr[eé]tin|d[eé]bile|abruti)\b/i,
  // Propos agressifs et menaces
  /\b(?:je vais te tuer|va te faire foutre|d[eé]gage d['’]ici|fermez vos gueules)\b/i,
  // Insultes en wolof usuelles
  /\b(?:saga|sa ndeye|sa baye|dof|khadj|poubelle)\b/i,
];

/**
 * Vérifie si le texte soumis contient des propos contraires à la charte
 * @param {string} text
 * @returns {{ isClean: boolean, reason?: string }}
 */
export function checkContentModeration(text) {
  if (!text || typeof text !== 'string') return { isClean: true, isValid: true };

  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isClean: false,
        isValid: false,
        reason: 'Votre message contient des propos déplacés ou agressifs non autorisés sur cet espace d’entraide.',
      };
    }
  }

  return { isClean: true, isValid: true };
}

/**
 * Récupère la liste des utilisateurs bannis de la communauté
 */
export function getBannedUsers() {
  try {
    const raw = localStorage.getItem('mbeund_mi_banned_community_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Vérifie si un nom d'utilisateur est actuellement banni de la communauté
 */
export function isUserBanned(username) {
  if (!username) return false;
  const list = getBannedUsers();
  return list.some((u) => u.toLowerCase() === username.toLowerCase());
}

/**
 * Bannit un utilisateur de l'espace communauté
 */
export function banUser(username, reason = 'Infraction aux règles de respect communautaire') {
  if (!username) return;
  const list = getBannedUsers();
  if (!list.some((u) => u.toLowerCase() === username.toLowerCase())) {
    const updated = [...list, username];
    try {
      localStorage.setItem('mbeund_mi_banned_community_users', JSON.stringify(updated));
    } catch {}
  }
}

/**
 * Débannit un utilisateur
 */
export function unbanUser(username) {
  if (!username) return;
  const list = getBannedUsers();
  const updated = list.filter((u) => u.toLowerCase() !== username.toLowerCase());
  try {
    localStorage.setItem('mbeund_mi_banned_community_users', JSON.stringify(updated));
  } catch {}
}

/**
 * Enregistre un signalement pour vérification par les modérateurs
 */
export function reportContent({ targetId, targetType = 'post', authorName = '', reason = '' }) {
  try {
    const raw = localStorage.getItem('mbeund_mi_community_reports');
    const existing = raw ? JSON.parse(raw) : [];
    const reportItem = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      targetId,
      targetType,
      authorName,
      reason,
      date: new Date().toISOString(),
      status: 'en_attente',
    };
    const updated = [reportItem, ...existing];
    localStorage.setItem('mbeund_mi_community_reports', JSON.stringify(updated));
    return reportItem;
  } catch {
    return null;
  }
}
