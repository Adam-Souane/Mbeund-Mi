import { useState } from 'react';

// Valeurs du formulaire tirées des données serveur, champ par champ, avec la
// valeur par défaut de `vide` quand le serveur n'en fournit pas.
export function remplir(source, vide) {
  return Object.fromEntries(Object.entries(vide).map(([cle, defaut]) => [cle, source[cle] ?? defaut]));
}

// Formulaire pré-rempli depuis des données serveur (React Query). Quand ces
// données changent (chargement, enregistrement), le formulaire est remis à
// jour pendant le rendu — le motif recommandé par React — plutôt que dans un
// effet qui provoquerait un second rendu.
export function useFormulaireDepuis(source, vide) {
  const [formulaire, setFormulaire] = useState(() => (source ? remplir(source, vide) : vide));
  const [sourceVue, setSourceVue] = useState(source);
  if (source !== sourceVue) {
    setSourceVue(source);
    if (source) setFormulaire(remplir(source, vide));
  }
  return [formulaire, setFormulaire];
}
