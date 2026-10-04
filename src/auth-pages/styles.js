// Classes partagées par les pages d'authentification (inscription, code OTP,
// mot de passe oublié). Regrouper ici les variantes clair/sombre évite de
// multiplier les ternaires dans le JSX.

export function ton(darkMode, clair, sombre) {
  return darkMode ? sombre : clair;
}

export function classeChamp(darkMode, enErreur = false) {
  const bordure = enErreur
    ? 'border-red-500'
    : ton(darkMode, 'border-navy-200 bg-white', 'border-navy-700 bg-navy-900 text-white');
  return `w-full px-4 py-2 rounded-lg border ${bordure} focus:outline-none focus:ring-2 focus:ring-navy-500`;
}

export function classeEtiquette(darkMode) {
  return `block text-sm font-medium mb-1 ${ton(darkMode, 'text-navy-700', 'text-navy-200')}`;
}

// Carte cliquable d'un choix exclusif (canal SMS ou email).
export function classeOption(darkMode, actif, desactive = false) {
  const etat = actif
    ? 'border-navy bg-white dark:bg-navy-900 font-semibold'
    : ton(darkMode, 'border-navy-200', 'border-navy-700');
  const curseur = desactive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  return `flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${etat} ${curseur}`;
}

// Lien « Renvoyer le code » : grisé pendant le compte à rebours.
export function classeLienRenvoi(darkMode, enAttente) {
  return enAttente
    ? `${ton(darkMode, 'text-navy-400', 'text-navy-600')} cursor-not-allowed`
    : 'text-navy-600 dark:text-navy-400 hover:underline';
}

export const BOUTON_PRINCIPAL =
  'w-full bg-navy dark:bg-navy-800 text-white py-3 rounded-lg font-semibold hover:bg-navy-700 dark:hover:bg-navy-900 transition disabled:opacity-50';

// Vérification simple (sans expression régulière à retour arrière) :
// une seule arobase, une partie locale, un domaine avec un point, aucun espace.
export function emailValide(valeur) {
  const v = valeur.trim();
  const parties = v.split('@');
  if (parties.length !== 2 || v.includes(' ')) return false;
  const [local, domaine] = parties;
  return local.length > 0 && domaine.includes('.') && !domaine.startsWith('.') && !domaine.endsWith('.');
}
