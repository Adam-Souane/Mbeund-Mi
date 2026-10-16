// Classes partagées par les pages d'authentification (inscription, code OTP,
// mot de passe oublié). Regrouper ici les variantes clair/sombre évite de
// multiplier les ternaires dans le JSX.

export function ton(darkMode, clair, sombre) {
  return darkMode ? sombre : clair;
}

export function classeChamp(darkMode, enErreur = false) {
  const bordure = enErreur
    ? 'border-red-500 focus:border-red-500'
    : ton(darkMode, 'border-navy-200 bg-white focus:border-red', 'border-navy-700 bg-navy-900 text-white focus:border-red');
  return `w-full px-3.5 py-2.5 rounded-lg border ${bordure} text-sm focus:outline-none transition-colors`;
}

export function classeEtiquette(darkMode) {
  return `block text-xs font-bold uppercase tracking-wider mb-1.5 ${ton(darkMode, 'text-navy-600', 'text-navy-200')}`;
}

// Carte cliquable d'un choix exclusif (canal SMS ou email).
export function classeOption(darkMode, actif, desactive = false) {
  const etat = actif
    ? 'border-red bg-red-50/40 text-red dark:bg-red/10 font-bold'
    : ton(darkMode, 'border-navy-200 text-navy-700 hover:border-navy-300', 'border-navy-700 text-navy-200');
  const curseur = desactive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  return `flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm transition-all ${etat} ${curseur}`;
}

// Lien « Renvoyer le code » : grisé pendant le compte à rebours.
export function classeLienRenvoi(darkMode, enAttente) {
  return enAttente
    ? `${ton(darkMode, 'text-navy-400', 'text-navy-600')} cursor-not-allowed`
    : 'text-red font-semibold hover:underline';
}

// Carte blanche qui regroupe le formulaire, identique sur toutes les pages
export const CARTE = 'w-full bg-white/95 backdrop-blur-md dark:bg-navy/95 rounded-2xl border border-white/60 dark:border-navy-800 p-6 sm:p-8 shadow-2xl';

// Bouton principal rouge (#B5121B), identique à « Se connecter »
export const BOUTON_PRINCIPAL =
  'w-full !mt-6 py-3 rounded-xl bg-red text-white text-sm font-bold hover:bg-red-700 transition shadow-sm disabled:opacity-60 cursor-pointer';

// Vérification simple (sans expression régulière à retour arrière) :
// une seule arobase, une partie locale, un domaine avec un point, aucun espace.
export function emailValide(valeur) {
  const v = valeur.trim();
  const parties = v.split('@');
  if (parties.length !== 2 || v.includes(' ')) return false;
  const [local, domaine] = parties;
  return local.length > 0 && domaine.includes('.') && !domaine.startsWith('.') && !domaine.endsWith('.');
}
