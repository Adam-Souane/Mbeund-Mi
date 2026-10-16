// Données partagées des publications riveraines & observations de quartier
export const RIVERAINS_ACTUALITE = [
  {
    id: 'actu-1',
    auteur: 'Amadou Diallo',
    avatar: '/images/avatar-amadou.jpg',
    quartier: 'Ndakhane (Thiaroye)',
    rue: 'Zone basse / Cuvette',
    categorie: 'Égout & Caniveau',
    titre: 'Caniveau bouché par le sable',
    description: 'Le sable transporté par le ruissellement a obstrué l’avaloir principal au croisement de la ruelle 4. L’eau commence à refluer vers deux concessions voisines. Besoin urgent de renforts pour pelleter.',
    photo: '/images/caniveau-thiaroye.jpg',
    temps: 'Il y a 15 min',
    baseViews: 38,
    baseVotes: 9,
    statut: 'en_cours',
    statutLabel: 'En cours · Traitement requis',
    statutDot: 'bg-amber-500',
    commentairesCount: 4,
  },
  {
    id: 'actu-2',
    auteur: 'Fatoumata Bâ',
    avatar: '/images/avatar-fatou.jpg',
    quartier: 'Thiaroye Plage',
    rue: 'Secteur Débarcadère',
    categorie: 'Pompage actif',
    titre: 'Motopompe en action sur la ruelle',
    description: 'Les équipes techniques de la mairie et de l’ONAS ont branché le grand tuyau de refoulement. Le niveau d’eau baisse rapidement, passage redevenu accessible pour les enfants et les charrettes.',
    photo: '/images/pompage-thiaroye.jpg',
    temps: 'Il y a 45 min',
    baseViews: 54,
    baseVotes: 16,
    statut: 'resolu',
    statutLabel: 'Résolu · Drainage actif',
    statutDot: 'bg-emerald-500',
    commentairesCount: 7,
  },
  {
    id: 'actu-3',
    auteur: 'Cheikh Tidiane Wade',
    avatar: '/images/avatar-ibrahima.jpg',
    quartier: 'Thiaroye Gare',
    rue: 'Rue 10 Marché',
    categorie: 'Passage piéton',
    titre: 'Parpaings posés pour traverser',
    description: 'Suite à l’averse de cet après-midi, les commerçants et jeunes du quartier ont aligné des parpaings pour créer une passerelle surélevée. Prudence tout de même avec les deux-roues.',
    photo: '/images/ruelle-thiaroye.jpg',
    temps: 'Il y a 1h15',
    baseViews: 29,
    baseVotes: 6,
    statut: 'en_cours',
    statutLabel: 'Passage aménagé',
    statutDot: 'bg-amber-500',
    commentairesCount: 2,
  },
  {
    id: 'actu-4',
    auteur: 'Sokhna Fall',
    avatar: '/images/avatar-awa.jpg',
    quartier: 'Thiaroye-sur-Mer',
    rue: 'Secteur Mosquée',
    categorie: 'Prévention',
    titre: 'Curage communautaire terminé',
    description: 'Opération Set-Setal menée avec succès par les mamans et les jeunes. Tous les sacs de sable sont scellés et les buses d’évacuation sont propres avant la prochaine vague de pluie.',
    photo: '/images/solidarite-thiaroye.jpg',
    temps: 'Il y a 2h30',
    baseViews: 71,
    baseVotes: 23,
    statut: 'resolu',
    statutLabel: 'Sécurisé · Canaux propres',
    statutDot: 'bg-emerald-500',
    commentairesCount: 11,
  },
  {
    id: 'actu-5',
    auteur: 'Mamadou Lamine Diouf',
    avatar: '/images/avatar-mamadou.jpg',
    quartier: 'Thiaroye Minam',
    rue: 'Avenue de la Gare',
    categorie: 'Curage & Écoulement',
    titre: 'Bassin tampon opérationnel',
    description: 'Vérification effectuée avec les chefs de bloc : les eaux de ruissellement convergent sans débordement vers le bassin tampon. La circulation reste fluide.',
    photo: '/images/bassin-thiaroye.jpg',
    temps: 'Il y a 3h',
    baseViews: 45,
    baseVotes: 18,
    statut: 'resolu',
    statutLabel: 'Écoulement fluide · Sous contrôle',
    statutDot: 'bg-emerald-500',
    commentairesCount: 5,
  },
];

/**
 * Calcule les votes réels en tenant compte du localStorage
 */
export function getPostsWithLiveVotes() {
  let savedVotes = {};
  try {
    const raw = localStorage.getItem('mbeund_mi_community_upvotes');
    if (raw) savedVotes = JSON.parse(raw);
  } catch {}

  return RIVERAINS_ACTUALITE.map((post) => {
    const userUpvoted = !!savedVotes[post.id];
    return {
      ...post,
      totalVotes: post.baseVotes + (userUpvoted ? 1 : 0),
      userUpvoted,
    };
  });
}

/**
 * Récupère le post ayant le plus de confirmations citoyennes
 */
export function getTopConfirmedPost() {
  const posts = getPostsWithLiveVotes();
  return [...posts].sort((a, b) => b.totalVotes - a.totalVotes)[0];
}
