/**
 * Formate une date ou durée relative sous forme compacte (réseaux sociaux) :
 * - Jours : "1j", "2j", "3j"
 * - Mois : "1m", "2m"
 * - Années : "1a", "2a"
 * - Heures : "1h", "2h"
 * - Minutes / Récent : "15 min", "À l'instant"
 */
export function formatCompactDate(rawDate) {
  if (!rawDate) return '';

  const str = String(rawDate).trim();

  // 1. Expressions textuelles directes
  if (/instant|maintenant|sec|secondes|récemment/i.test(str)) {
    return "À l'instant";
  }

  // Jours (ex: "Posté il y a 2 jours", "Il y a 1 jour", "2 jours", "3j")
  const matchJours = str.match(/(\d+)\s*j(?:our)?s?/i);
  if (matchJours) {
    return `${matchJours[1]}j`;
  }

  // Mois (ex: "Il y a 1 mois", "2 mois")
  const matchMois = str.match(/(\d+)\s*mois/i);
  if (matchMois) {
    return `${matchMois[1]}m`;
  }

  // Années (ex: "Il y a 1 an", "2 ans", "1 année")
  const matchAns = str.match(/(\d+)\s*an(?:née)?s?/i);
  if (matchAns) {
    return `${matchAns[1]}a`;
  }

  // Heures (ex: "Il y a 1h15", "Il y a 3h", "2 h", "3 heures")
  const matchHeures = str.match(/(\d+)\s*(?:h(?:eure)?s?)/i);
  if (matchHeures) {
    return `${matchHeures[1]}h`;
  }

  // Minutes (ex: "Il y a 15 min", "45 minutes")
  const matchMin = str.match(/(\d+)\s*min(?:ute)?s?/i);
  if (matchMin) {
    return `${matchMin[1]} min`;
  }

  // 2. Si c'est une date convertible (ISO, format date JS)
  const timestamp = Date.parse(str);
  if (!isNaN(timestamp)) {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHeures = Math.floor(diffMin / 60);
    const diffJours = Math.floor(diffHeures / 24);
    const diffMois = Math.floor(diffJours / 30);
    const diffAns = Math.floor(diffJours / 365);

    if (diffSec < 60) return "À l'instant";
    if (diffMin < 60) return `${diffMin} min`;
    if (diffHeures < 24) return `${diffHeures}h`;
    if (diffJours < 30) return `${Math.max(1, diffJours)}j`;
    if (diffMois < 12) return `${Math.max(1, diffMois)}m`;
    return `${Math.max(1, diffAns)}a`;
  }

  // 3. Si c'est déjà un code court (ex: "2j", "1h")
  if (/^\d+[jhma]$/i.test(str)) {
    return str.toLowerCase();
  }

  return str;
}
