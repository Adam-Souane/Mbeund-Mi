/**
 * Assainit le contenu textuel public pour protéger la vie privée des citoyens (RGPD & Confidentialité) :
 * - Supprime les balises techniques SMS : [SMS de ...], [SMS ...]
 * - Supprime ou masque tout numéro de téléphone (sénégalais ou international : +221, 77, 78, 76, 70, etc.)
 * - Supprime les mentions personnelles d'âge ou d'identifiant privé
 * - Nettoie la ponctuation orpheline
 */
export function sanitizePublicText(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text;

  // 1. Retirer les préfixes SMS comme [SMS de 221775555555], [SMS de +221...], [SMS ...]
  cleaned = cleaned.replace(/\[\s*SMS(?:\s+de)?\s*[^\]]*\]/gi, '').trim();

  // 2. Retirer les numéros de téléphone sénégalais complets
  const senegalPhoneRegex = /(?:\+?221[\s.-]*)?(?:7[05678]|33)[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}\b/gi;
  cleaned = cleaned.replace(senegalPhoneRegex, '');

  // 3. Retirer les séquences de 8 à 15 chiffres isolées
  cleaned = cleaned.replace(/\b\d{8,15}\b/g, '');

  // 4. Retirer les mentions sensibles d'âge (ex: "âgé de 35 ans", "âge : 40 ans")
  cleaned = cleaned.replace(/\b(?:âgé[es]?\s+de|âge\s*:\s*)\s*\d{1,2}\s*ans?\b/gi, '');

  // 5. Nettoyer les ponctuations de début/fin orphelines et espaces multiples
  cleaned = cleaned
    .replace(/^[:\s\-–—/|]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned || 'Observation d’inondation partagée par un riverain.';
}

/**
 * Assainit le nom de l'auteur pour garantir qu'aucun numéro de téléphone ni préfixe SMS n'apparaisse publiquement
 */
export function sanitizePublicAuthor(name, fallback = 'Sentinelle Citoyenne') {
  if (!name || typeof name !== 'string') return fallback;
  const trimmed = name.trim();

  // Si le nom contient ou ressemble à un numéro de téléphone ou mention SMS
  const digitsOnly = trimmed.replace(/[\s.+-]/g, '');
  if (/^\d{7,15}$/.test(digitsOnly) || /sms/i.test(trimmed)) {
    return fallback;
  }

  // Nettoyer d'éventuels préfixes techniques
  const clean = trimmed.replace(/\[\s*SMS(?:\s+de)?\s*[^\]]*\]/gi, '').trim();
  return clean || fallback;
}
