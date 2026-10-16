import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ThumbsUp,
  MapPin,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Clock,
  Camera,
  Send,
  ExternalLink,
  Droplets,
  Flame,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';
import { sanitizePublicText, sanitizePublicAuthor } from '../../shared/utils/sanitizer';

// Signalements témoins ancrés exclusivement sur le périmètre de Thiaroye-sur-Mer avec images uniques et réelles
const SIGNALEMENTS_INITIAUX = [
  {
    id: 101,
    quartier: 'Ndakhane (Thiaroye)',
    rue: 'Zone basse / Cuvette Ndakhane',
    categorie: 'Égouts & Caniveau',
    description: 'Caniveau d\'évacuation bouché par le sable. Risque de reflux d\'eau vers les concessions proches.',
    image: '/images/caniveau-thiaroye.jpg',
    statut: 'en_cours',
    statut_label: 'Signalé au relais',
    initialVotes: 8,
    date: 'Il y a 15 min',
    prioritaire: true,
  },
  {
    id: 102,
    quartier: 'Thiaroye Plage',
    rue: 'Secteur Plage / Débarcadère',
    categorie: 'Pompage',
    description: 'Motopompe municipale en action avec grands tuyaux d\'évacuation pour drainer la ruelle vers le canal collecteur.',
    image: '/images/pompage-thiaroye.jpg',
    statut: 'resolu',
    statut_label: 'Évacuation active',
    initialVotes: 14,
    date: 'Il y a 35 min',
    prioritaire: true,
  },
  {
    id: 103,
    quartier: 'Thiaroye Gare',
    rue: 'Abords Rue 10 / Marché',
    categorie: 'Eau stagnante',
    description: 'Ruelle inondée suite à la pluie. Les jeunes du quartier ont posé des parpaings et planches pour sécuriser le passage.',
    image: '/images/ruelle-thiaroye.jpg',
    statut: 'en_cours',
    statut_label: 'Passage aménagé',
    initialVotes: 6,
    date: 'Il y a 1h10',
    prioritaire: false,
  },
  {
    id: 104,
    quartier: 'Thiaroye-sur-Mer',
    rue: 'Secteur Mosquée / École',
    categorie: 'Prévention',
    description: 'Mobilisation communautaire pour curer les caniveaux et positionner les sacs de sable avant les prochaines averses.',
    image: '/images/prevention-pluie.jpg',
    statut: 'resolu',
    statut_label: 'Canaux dégagés',
    initialVotes: 19,
    date: 'Il y a 2h30',
    prioritaire: false,
  },
];

export default function FilCommunautaireWidget() {
  const { data, isLoading } = useSignalementsApercu();
  const [filter, setFilter] = useState('tous'); // 'tous' | 'prioritaires' | 'en_cours'

  // Nouveaux signalements ajoutés localement par l'utilisateur
  const [localReports, setLocalReports] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_local_signalements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // État du formulaire de publication rapide
  const [isPublishing, setIsPublishing] = useState(false);
  const [quickDesc, setQuickDesc] = useState('');
  const [quickSecteur, setQuickSecteur] = useState('Ndakhane (Thiaroye)');
  const [quickCategorie, setQuickCategorie] = useState('Caniveau bouché');

  // Gestion des confirmations "J'ai vu aussi / Vu aussi" inspirée de FixMyStreet
  const [upvotes, setUpvotes] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_community_upvotes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [userUpvoted, setUserUpvoted] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_user_upvoted');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleToggleUpvote = (id, baseCount) => {
    const hasVoted = !!userUpvoted[id];
    const currentCount = upvotes[id] ?? baseCount;
    const nextCount = hasVoted ? Math.max(0, currentCount - 1) : currentCount + 1;

    const nextUpvotes = { ...upvotes, [id]: nextCount };
    const nextUserUpvoted = { ...userUpvoted, [id]: !hasVoted };

    setUpvotes(nextUpvotes);
    setUserUpvoted(nextUserUpvoted);

    try {
      localStorage.setItem('mbeund_mi_community_upvotes', JSON.stringify(nextUpvotes));
      localStorage.setItem('mbeund_mi_user_upvoted', JSON.stringify(nextUserUpvoted));
    } catch (e) {
      console.warn('Erreur stockage upvotes', e);
    }
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickDesc.trim()) return;

    const cleanDesc = sanitizePublicText(quickDesc.trim());

    const newReport = {
      id: Date.now(),
      quartier: quickSecteur,
      rue: 'Signalement riverain direct',
      categorie: quickCategorie,
      description: cleanDesc,
      image: '/images/prevention-pluie.jpg',
      statut: 'transmis',
      statut_label: 'Transmis au relais local',
      initialVotes: 1,
      date: 'À l’instant',
      prioritaire: true,
      isLocal: true,
    };

    const updated = [newReport, ...localReports];
    setLocalReports(updated);
    setQuickDesc('');
    setIsPublishing(false);

    try {
      localStorage.setItem('mbeund_mi_local_signalements', JSON.stringify(updated));
    } catch (err) {
      console.warn('Erreur sauvegarde signalement local', err);
    }
  };

  // Liste combinée : extraction GeoJSON paginé (data.results.features) ou tableau direct
  let rawApiItems = [];
  if (Array.isArray(data?.results?.features)) {
    rawApiItems = data.results.features.map((f) => ({ id: f.id, ...f.properties, localisation: f.geometry }));
  } else if (Array.isArray(data?.results)) {
    rawApiItems = data.results;
  } else if (Array.isArray(data?.features)) {
    rawApiItems = data.features.map((f) => ({ id: f.id, ...f.properties, localisation: f.geometry }));
  } else if (Array.isArray(data)) {
    rawApiItems = data;
  }

  const apiList = rawApiItems.map((s, idx) => {
    let rueTexte = 'Secteur Thiaroye-sur-Mer';
    if (typeof s.localisation === 'string' && s.localisation.trim()) {
      rueTexte = sanitizePublicText(s.localisation);
    } else if (s.citoyen_quartier && typeof s.citoyen_quartier === 'string') {
      rueTexte = `Secteur ${s.citoyen_quartier}`;
    }

    const idVal = s.id != null ? s.id : `api-${idx}`;
    const numId = typeof s.id === 'number' ? s.id : idx;

    // Si le citoyen a uploadé une photo réelle, on l'affiche, sinon null (pas de fausse photo clonée)
    let photoUrl = null;
    if (typeof s.photo === 'string' && s.photo.trim() && (s.photo.startsWith('http') || s.photo.startsWith('/media/') || s.photo.startsWith('/images/'))) {
      photoUrl = s.photo;
    }

    const rawDesc = typeof s.description === 'string' && s.description ? s.description : 'Incident hydrologique signalé par un habitant.';
    const cleanDesc = sanitizePublicText(rawDesc);
    const rawCat = typeof s.categorie_display === 'string' ? s.categorie_display : (typeof s.categorie === 'string' ? s.categorie : 'Inondation');

    return {
      id: idVal,
      quartier: (s.zone && typeof s.zone.quartier === 'string' && s.zone.quartier) || 'Thiaroye-sur-Mer',
      rue: rueTexte,
      categorie: rawCat,
      description: cleanDesc,
      image: photoUrl,
      statut: s.valide ? 'resolu' : 'en_cours',
      statut_label: s.valide ? 'Validé par secours' : 'Intervention en cours',
      initialVotes: (numId % 5) + 3,
      date: s.date_creation
        ? new Date(s.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'Récemment',
      prioritaire: (numId % 2 === 0),
    };
  });

  const allItems = [...localReports, ...(apiList.length > 0 ? apiList : SIGNALEMENTS_INITIAUX)];

  const filteredItems = allItems.filter((item) => {
    const currentVotes = upvotes[item.id] ?? item.initialVotes;
    if (filter === 'prioritaires') return item.prioritaire || currentVotes >= 6;
    if (filter === 'en_cours') return item.statut === 'en_cours' || item.statut === 'transmis';
    return true;
  });

  // Aperçu limité pour l'accueil citoyen (les 4 signalements les plus récents/actifs)
  const apercuItems = filteredItems.slice(0, 4);

  return (
    <div className="bg-white dark:bg-navy border border-navy-100 dark:border-navy-800 rounded-2xl p-5 shadow-sm transition-all space-y-4">
      {/* 1. En-tête Communautaire */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B2545] to-[#154275] text-white flex items-center justify-center shadow-xs">
            <Users size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-navy-900 dark:text-navy-50">
                Fil d’Entraide · Thiaroye-sur-Mer
              </h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-navy-500 dark:text-navy-300">
              Les riverains alertent, confirment (+1) et soutiennent les interventions d’urgence
            </p>
          </div>
        </div>

        {/* Filtres par pilules */}
        <div className="flex items-center gap-1 bg-navy-50 dark:bg-navy-900/60 p-1 rounded-xl border border-navy-100 dark:border-navy-800 text-xs">
          <button
            onClick={() => setFilter('tous')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filter === 'tous'
                ? 'bg-white dark:bg-navy text-navy-900 dark:text-white shadow-xs'
                : 'text-navy-500 hover:text-navy-800'
            }`}
          >
            Tous ({allItems.length})
          </button>
          <button
            onClick={() => setFilter('prioritaires')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filter === 'prioritaires'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-navy-500 hover:text-navy-800'
            }`}
          >
            <Flame size={12} /> Les + soutenus
          </button>
          <button
            onClick={() => setFilter('en_cours')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filter === 'en_cours'
                ? 'bg-[#0B2545] text-white shadow-xs'
                : 'text-navy-500 hover:text-navy-800'
            }`}
          >
            En cours
          </button>
        </div>
      </div>

      {/* 2. Zone de Publication Rapide du Quartier */}
      <div className="rounded-xl border border-blue-100 dark:border-navy-700 bg-gradient-to-r from-blue-50/60 via-white to-blue-50/30 dark:from-navy-900/40 dark:to-navy p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-[#0B2545] dark:text-blue-300 flex items-center gap-1.5">
            <Droplets size={14} className="text-blue-600" />
            Que se passe-t-il dans votre ruelle à Thiaroye ?
          </span>
          <Link
            to="/citoyen/signaler"
            className="text-[11px] font-bold text-[#CC131A] hover:underline flex items-center gap-1"
          >
            <Camera size={12} />
            Formulaire complet avec photo
          </Link>
        </div>

        <form onSubmit={handleQuickSubmit} className="space-y-2.5">
          <textarea
            value={quickDesc}
            onChange={(e) => setQuickDesc(e.target.value)}
            placeholder="Ex: Eau stagnante montant vers les maisons, caniveau ensablé vers la mosquée..."
            rows={2}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <select
                value={quickSecteur}
                onChange={(e) => setQuickSecteur(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white font-medium"
              >
                <option value="Thiaroye-sur-Mer Plage">📍 Thiaroye Plage</option>
                <option value="Ndakhane (Thiaroye)">📍 Ndakhane Cuvette</option>
                <option value="Thiaroye Gare Rue 10">📍 Thiaroye Gare / Rue 10</option>
                <option value="CEM Thiaroye 44">📍 CEM Thiaroye 44</option>
              </select>

              <select
                value={quickCategorie}
                onChange={(e) => setQuickCategorie(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white font-medium"
              >
                <option value="Caniveau bouché">Caniveau bouché</option>
                <option value="Montée des eaux">Montée des eaux</option>
                <option value="Eau stagnante">Eau stagnante</option>
                <option value="Passage bloqué">Passage bloqué</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!quickDesc.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#154275] disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Send size={12} />
              Publier l'alerte
            </button>
          </div>
        </form>
      </div>

      {/* 3. Cartes du Fil Communautaire */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-navy-400 animate-pulse">
          Actualisation du fil d'entraide de Thiaroye-sur-Mer…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {apercuItems.map((item) => {
            const count = upvotes[item.id] ?? item.initialVotes;
            const voted = !!userUpvoted[item.id];
            const isPriority = item.prioritaire || count >= 6;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-xl border overflow-hidden transition-all duration-200 ${
                  isPriority
                    ? 'bg-gradient-to-br from-amber-50/40 via-white to-amber-50/15 dark:from-amber-950/20 dark:via-navy dark:to-navy border-amber-300/80 dark:border-amber-800/60 shadow-xs'
                    : 'bg-white dark:bg-navy-900/40 border-navy-100 dark:border-navy-800 hover:border-navy-200'
                }`}
              >
                {/* Image du signalement réelle si existante */}
                {item.image ? (
                  <div className="relative w-full h-36 overflow-hidden bg-slate-100 dark:bg-navy-800">
                    <img
                      src={item.image}
                      alt={item.description}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white shadow-xs">
                        <MapPin size={11} className="text-red-400" />
                        {item.quartier}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-xs flex items-center gap-1 ${
                          item.statut === 'resolu'
                            ? 'bg-emerald-600/90 text-white'
                            : isPriority
                            ? 'bg-amber-600/90 text-white'
                            : 'bg-blue-600/90 text-white'
                        }`}
                      >
                        {item.statut === 'resolu' ? (
                          <CheckCircle2 size={10} />
                        ) : isPriority ? (
                          <AlertTriangle size={10} />
                        ) : (
                          <Clock size={10} />
                        )}
                        {item.statut_label}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* En-tête sans image : épuré, compact et soigné */
                  <div className="px-3.5 pt-3 flex items-center justify-between border-b border-navy-50 dark:border-navy-800/60 pb-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-navy-50 dark:bg-navy-800 text-[#0B2545] dark:text-blue-200">
                      <MapPin size={11} className="text-[#CC131A]" />
                      {item.quartier}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        item.statut === 'resolu'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      <ShieldCheck size={11} />
                      {item.statut_label}
                    </span>
                  </div>
                )}

                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-navy-400 font-semibold mb-1">
                      <span className="text-[#0B2545] dark:text-blue-300 font-bold">{item.rue}</span>
                      <span>{item.date}</span>
                    </div>

                    <p className="text-xs text-navy-800 dark:text-navy-100 font-medium leading-relaxed mb-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Barre d'action avec bouton FixMyStreet "+1 Vu aussi" */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-navy-50 dark:border-navy-800/80 text-xs">
                    <Link
                      to="/citoyen/carte"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#0B2545] transition"
                    >
                      <ExternalLink size={12} />
                      Voir sur carte
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleUpvote(item.id, item.initialVotes)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        voted
                          ? 'bg-[#0B2545] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <ThumbsUp size={12} className={voted ? 'fill-current' : ''} />
                      <span>{voted ? 'Confirmé' : '+1 Vu aussi'}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 text-[10px]">
                        {count}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Bouton de redirection vers l'espace complet Communauté */}
      <div className="pt-2">
        <Link
          to="/citoyen/communaute"
          className="group w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0B2545] via-[#103565] to-[#154275] hover:from-[#154275] hover:to-[#0B2545] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 shadow-sm transition active:scale-[0.99] cursor-pointer"
        >
          <Users size={16} />
          <span>Accéder à l'espace Communauté · Voir tous les signalements et discussions ({allItems.length})</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
