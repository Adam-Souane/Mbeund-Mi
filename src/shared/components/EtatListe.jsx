// État d'une liste chargée depuis l'API : message de chargement, message si
// elle est vide, sinon son contenu. Remplace le motif répété sur chaque page
// « chargement ? … : vide ? … : liste ».
//
// Les messages par défaut suffisent le plus souvent ; `rendusChargement` et
// `renduVide` permettent une mise en forme particulière.
export default function EtatListe({
  chargement,
  vide,
  messageVide,
  taille = 'sm',
  renduChargement,
  renduVide,
  children,
}) {
  const classe = `${taille === 'xs' ? 'text-xs' : 'text-sm'} text-navy-400`;
  if (chargement) return renduChargement ?? <p className={classe}>Chargement…</p>;
  if (vide) return renduVide ?? <p className={classe}>{messageVide}</p>;
  return children;
}
