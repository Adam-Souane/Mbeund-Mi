// Classes partagées par les pages d'authentification (inscription, code OTP,
// mot de passe oublié). Regrouper ici les variantes clair/sombre évite de
// multiplier les ternaires dans le JSX.

export function ton(darkMode, clair, sombre) {
  return darkMode ? sombre : clair;
}

export function classeChamp(darkMode, enErreur = false) {
  const bordure = enErreur
    ? 'border-[#BE123C] focus:border-[#BE123C] focus:ring-[#BE123C]'
    : 'border-slate-300 bg-white text-slate-900 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]';
  return `w-full h-12 px-3.5 rounded-xl border ${bordure} text-sm focus:outline-none transition-colors`;
}

export function classeEtiquette(darkMode) {
  return 'block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5';
}

// Carte cliquable d'un choix exclusif (canal SMS ou email).
export function classeOption(darkMode, actif, desactive = false) {
  const etat = actif
    ? 'border-[#0B2545] bg-slate-100 text-[#0B2545] font-bold'
    : 'border-slate-300 text-slate-700 hover:border-slate-400 bg-white';
  const curseur = desactive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  return `flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all ${etat} ${curseur}`;
}

// Lien « Renvoyer le code » : grisé pendant le compte à rebours.
export function classeLienRenvoi(darkMode, enAttente) {
  return enAttente
    ? 'text-slate-400 cursor-not-allowed'
    : 'text-[#CC131A] font-semibold hover:text-[#A01016] hover:underline';
}

// Carte blanche qui regroupe le formulaire, identique sur toutes les pages
export const CARTE = 'w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-7 sm:p-9 transition-all';

// Bouton principal : bleu exact du logo (#0B2545) avec hover bleu clair (#154275)
export const BOUTON_PRINCIPAL =
  'w-full h-12 rounded-xl bg-[#0B2545] hover:bg-[#154275] active:bg-[#07182D] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer';

// Vérification simple (sans expression régulière à retour arrière) :
// une seule arobase, une partie locale, un domaine avec un point, aucun espace.
export function emailValide(valeur) {
  const v = valeur.trim();
  const parties = v.split('@');
  if (parties.length !== 2 || v.includes(' ')) return false;
  const [local, domaine] = parties;
  return local.length > 0 && domaine.includes('.') && !domaine.startsWith('.') && !domaine.endsWith('.');
}
