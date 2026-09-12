// DRF renvoie les erreurs de validation sous la forme { champ: [messages] }
// (ou { detail: "..." } pour les erreurs génériques) — on aplatit tout ça en
// une simple liste de messages affichables, quel que soit le champ en cause.
export function flattenApiErrors(error) {
  const data = error?.response?.data;
  if (!data) return ["Une erreur est survenue. Veuillez réessayer."];
  if (typeof data === 'string') return [data];
  if (data.detail) return [data.detail];

  const messages = Object.values(data).flat().filter(Boolean);
  return messages.length ? messages : ['Une erreur est survenue. Veuillez réessayer.'];
}
