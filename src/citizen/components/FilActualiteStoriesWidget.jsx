import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  MapPin,
  Eye,
  Star,
  ThumbsUp,
  Sparkles,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';
import { useNotifications } from '../../shared/contexts/NotificationContext';

// Stories témoins des différents quartiers de Thiaroye-sur-Mer avec vrais profils sénégalais
const STORIES_QUARTIERS = [
  {
    id: 'story-1',
    quartier: 'Ndakhane',
    relais: 'Moussa Diop',
    role: 'Relais Quartier',
    avatar: '/images/avatar-amadou.jpg',
    statut: 'vigilance', // 'calme' | 'vigilance' | 'alerte'
    statutColor: 'border-amber-500',
    dotColor: 'bg-amber-500',
    heure: 'Il y a 10 min',
    image: '/images/caniveau-thiaroye.jpg',
    texte: 'Cuvette Ndakhane : Léger écoulement dans le caniveau principal. Pas de débordement vers les concessions pour l’instant.',
  },
  {
    id: 'story-2',
    quartier: 'Thiaroye Plage',
    relais: 'Fatou Sow',
    role: 'Comité Plage',
    avatar: '/images/avatar-fatou.jpg',
    statut: 'calme',
    statutColor: 'border-emerald-500',
    dotColor: 'bg-emerald-500',
    heure: 'Il y a 25 min',
    image: '/images/pompage-thiaroye.jpg',
    texte: 'Débarcadère : La motopompe a évacué la grande marre d’eau pluviale. La circulation est rétablie.',
  },
  {
    id: 'story-3',
    quartier: 'Thiaroye Gare',
    relais: 'Ibrahima Fall',
    role: 'Volontaire',
    avatar: '/images/avatar-ibrahima.jpg',
    statut: 'alerte',
    statutColor: 'border-red-500',
    dotColor: 'bg-red-500',
    heure: 'Il y a 40 min',
    image: '/images/ruelle-thiaroye.jpg',
    texte: 'Abords Rue 10 : Parpaings et passerelles disposés par les jeunes pour sécuriser les passages piétons.',
  },
  {
    id: 'story-4',
    quartier: 'Mosquée / École',
    relais: 'Awa Ndiaye',
    role: 'Relais Hygiène',
    avatar: '/images/avatar-awa.jpg',
    statut: 'calme',
    statutColor: 'border-emerald-500',
    dotColor: 'bg-emerald-500',
    heure: 'Il y a 1h',
    image: '/images/prevention-pluie.jpg',
    texte: 'Secteur Mosquée : Sacs de sable bien en place, les caniveaux d’évacuation sont complètement dégagés.',
  },
  {
    id: 'story-5',
    quartier: 'Cité Relais',
    relais: 'Alioune Badara',
    role: 'Sentinelle',
    avatar: '/images/avatar-amadou.jpg',
    statut: 'vigilance',
    statutColor: 'border-amber-500',
    dotColor: 'bg-amber-500',
    heure: 'Il y a 2h',
    image: '/images/bassin-thiaroye.jpg',
    texte: 'Bassin de rétention : Niveau à 45%, pompes industrielles ONAS en veille active.',
  },
];

import { RIVERAINS_ACTUALITE } from '../../shared/data/riverainsData';

export default function FilActualiteStoriesWidget({ className = '' }) {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // 1. Gestion des VUES réelles stockées en local
  const [vues, setVues] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_actu_views');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 2. Gestion des VOTES "+1 Vu aussi" stockés en local
  const [votes, setVotes] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_community_upvotes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 3. Gestion des FAVORIS ⭐ stockés en local
  const [favoris, setFavoris] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_actu_favoris');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 4. État de la Story ouverte
  const [activeStory, setActiveStory] = useState(null);

  // 5. État du Post de Riverain ouvert (détail du signalement)
  const [activePost, setActivePost] = useState(null);

  // Incrémenter automatiquement les vues au premier affichage du fil
  useEffect(() => {
    setVues((prev) => {
      const next = { ...prev };
      let changed = false;
      RIVERAINS_ACTUALITE.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = item.baseViews + 1;
          changed = true;
        }
      });
      if (changed) {
        try {
          localStorage.setItem('mbeund_mi_actu_views', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  // Clic sur un signalement pour incrémenter réellement la vue
  const handleItemClick = (id) => {
    setVues((prev) => {
      const next = { ...prev, [id]: (prev[id] || 0) + 1 };
      try {
        localStorage.setItem('mbeund_mi_actu_views', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Bascule vote "+1 Vu aussi"
  const handleVote = (id, e) => {
    if (e) e.stopPropagation();
    handleItemClick(id);
    const item = RIVERAINS_ACTUALITE.find((r) => r.id === id);

    setVotes((prev) => {
      const userVoted = prev[id];
      const next = { ...prev, [id]: !userVoted };
      try {
        localStorage.setItem('mbeund_mi_community_upvotes', JSON.stringify(next));
      } catch {}

      if (!userVoted && item) {
        addNotification({
          type: 'signalement',
          data: {
            titre: 'Confirmation "+1 Vu" enregistrée',
            message: `Vous avez confirmé le constat "${item.titre}" à ${item.quartier}. Les services municipaux en sont informés.`,
          },
        });
      }

      return next;
    });
  };

  // Bascule favori ⭐
  const handleFavori = (id, e) => {
    if (e) e.stopPropagation();
    setFavoris((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('mbeund_mi_actu_favoris', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Ouvrir une Story
  const handleOpenStory = (story) => {
    setActiveStory(story);
    setVues((prev) => {
      const next = { ...prev, [story.id]: (prev[story.id] || 0) + 1 };
      try {
        localStorage.setItem('mbeund_mi_actu_views', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Ouvrir le Post détaillé du riverain
  const handleOpenPost = (item) => {
    handleItemClick(item.id);
    setActivePost(item);
  };

  return (
    <div className={`bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-3xl p-4 sm:p-6 shadow-xl transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:border-navy-300 dark:hover:border-navy-600 will-change-transform flex flex-col justify-between ${className}`}>
      {/* ── 1. SECTION STORIES (Avatars sénégalais authentiques en cercle) ── */}
      <div className="pb-3 border-b border-navy-100 dark:border-navy-800/80">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-navy-900 dark:text-white">
              Stories
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[11px] font-bold text-navy-500 dark:text-navy-400">
            Relais Thiaroye 24/7
          </span>
        </div>

        {/* Défilement horizontal des Stories avec dimensions d'images strictement verrouillées */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth w-full">
          {STORIES_QUARTIERS.map((s) => {
            const hasViewed = !!vues[s.id];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleOpenStory(s)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 group cursor-pointer focus:outline-hidden"
              >
                {/* Cercle Story avec double anneau */}
                <div
                  className={`relative p-0.5 rounded-full border-2 transition-transform group-hover:scale-105 active:scale-95 ${
                    hasViewed ? 'border-slate-300 dark:border-slate-700 opacity-80' : `${s.statutColor} shadow-xs`
                  }`}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white dark:border-[#071322] flex-shrink-0">
                    <img
                      src={s.avatar}
                      alt={s.relais}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Pastille de statut en direct */}
                  <span
                    className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#071322] ${s.dotColor}`}
                    title={s.statut}
                  />
                </div>
                <span className="text-[11px] font-bold text-navy-800 dark:text-navy-200 truncate w-full text-center">
                  {s.quartier}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. SECTION FIL DES RIVERAINS (Occupe élégamment tout le reste de la hauteur avec flex-1) ── */}
      <div className="flex-1 flex flex-col justify-between pt-3 min-h-0">
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-navy-900 dark:text-white">
            Fil des Riverains
          </h3>
          <Link
            to="/citoyen/communaute"
            className="text-xs font-bold text-[#CC131A] hover:underline flex items-center gap-1"
          >
            <span>Voir tout</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Liste des riverains : un clic ouvre le post complet (3 visibles sur mobile, 4 sur grand écran) */}
        <div className="flex-1 flex flex-col justify-between gap-1 min-h-0">
          {RIVERAINS_ACTUALITE.map((item, idx) => {
            const currentViews = (vues[item.id] || item.baseViews);
            const userHasVoted = !!votes[item.id];
            const currentVotes = item.baseVotes + (userHasVoted ? 1 : 0);
            const isFav = !!favoris[item.id];

            return (
              <div
                key={item.id}
                onClick={() => handleOpenPost(item)}
                className={`${idx >= 3 ? 'hidden sm:flex' : 'flex'} items-center justify-between gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-2xl hover:bg-navy-50/80 dark:hover:bg-white/5 transition-colors cursor-pointer group`}
                title="Cliquer pour afficher la publication du voisin"
              >
                {/* Avatar avec pastille de statut */}
                <div className="relative flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-navy-100 dark:border-navy-800">
                  <img
                    src={item.avatar}
                    alt={item.auteur}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#071322] ${item.statutDot}`}
                  />
                </div>

                {/* Infos Riverain & Signalement */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-navy-900 dark:text-white truncate group-hover:text-[#CC131A] transition-colors">
                      {item.auteur}
                    </span>
                    <span className="text-[10px] font-semibold text-navy-400 dark:text-navy-400 truncate hidden sm:inline">
                      · {item.temps}
                    </span>
                  </div>

                  <p className="text-xs text-navy-600 dark:text-navy-300 truncate">
                    <span className="font-semibold text-navy-800 dark:text-navy-200">{item.quartier}</span>
                    {' · '}
                    {item.titre}
                  </p>

                  {/* Compteur de vues réel */}
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-navy-500 dark:text-navy-400">
                    <span className="flex items-center gap-1 font-semibold text-navy-600 dark:text-navy-300">
                      <Eye size={12} className="text-blue-500" />
                      {currentViews} vue{currentViews > 1 ? 's' : ''}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <ThumbsUp size={11} />
                      {currentVotes} confirmation{currentVotes > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Actions à droite : Bouton Vu aussi + Favori ⭐ */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Bouton "+1 Vu" */}
                  <button
                    type="button"
                    onClick={(e) => handleVote(item.id, e)}
                    title="Confirmer que vous avez vu ce signalement"
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 ${
                      userHasVoted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-navy-100/70 dark:bg-navy-800 text-navy-700 dark:text-navy-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600'
                    }`}
                  >
                    <ThumbsUp size={12} />
                    <span>{userHasVoted ? 'Vu ✓' : '+1'}</span>
                  </button>

                  {/* Étoile de favori ⭐ */}
                  <button
                    type="button"
                    onClick={(e) => handleFavori(item.id, e)}
                    title={isFav ? 'Retirer des favoris' : 'Marquer comme favori'}
                    className={`p-1.5 rounded-full transition-colors ${
                      isFav
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                        : 'text-navy-300 dark:text-navy-600 hover:text-amber-500 hover:bg-navy-100 dark:hover:bg-navy-800'
                    }`}
                  >
                    <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. MODALE / POP-UP : POST COMPLET DU RIVERAIN (Clic sur un riverain) ── */}
      {activePost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActivePost(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-[#071322] rounded-3xl overflow-hidden shadow-2xl border border-navy-100 dark:border-navy-800 flex flex-col max-h-[90vh]"
          >
            {/* Header du post riverain */}
            <div className="p-4 sm:p-5 border-b border-navy-100 dark:border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activePost.avatar}
                  alt={activePost.auteur}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#CC131A]"
                />
                <div>
                  <h4 className="text-sm sm:text-base font-black text-navy-900 dark:text-white">
                    {activePost.auteur}
                  </h4>
                  <p className="text-xs text-navy-500 dark:text-navy-400">
                    {activePost.quartier} · {activePost.temps}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePost(null)}
                className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-800 hover:bg-navy-200 dark:hover:bg-navy-700 text-navy-600 dark:text-navy-200 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps du post avec photo de la situation */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Badge de statut */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white ${
                  activePost.statut === 'resolu' ? 'bg-emerald-600' : 'bg-amber-600'
                }`}>
                  <CheckCircle2 size={13} />
                  {activePost.statutLabel}
                </span>
                <span className="text-xs font-semibold text-navy-500 dark:text-navy-400">
                  {activePost.rue}
                </span>
              </div>

              {/* Titre & Description du riverain */}
              <div>
                <h3 className="text-base sm:text-lg font-black text-navy-900 dark:text-white mb-1.5">
                  {activePost.titre}
                </h3>
                <p className="text-xs sm:text-sm text-navy-700 dark:text-navy-200 leading-relaxed">
                  {activePost.description}
                </p>
              </div>

              {/* Photo du signalement sur le terrain */}
              {activePost.photo && (
                <div className="relative rounded-2xl overflow-hidden aspect-16/10 border border-navy-100 dark:border-navy-800 shadow-xs">
                  <img
                    src={activePost.photo}
                    alt={activePost.titre}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-[11px] font-bold text-white flex items-center gap-1.5">
                    <MapPin size={12} className="text-red-400" />
                    <span>Constaté sur place · Thiaroye</span>
                  </div>
                </div>
              )}

              {/* Statistiques d'impact communautaire */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-navy-50 dark:bg-[#050D18] border border-navy-100 dark:border-navy-800 text-xs">
                <span className="flex items-center gap-1 font-bold text-navy-700 dark:text-navy-200">
                  <Eye size={14} className="text-blue-500" />
                  {(vues[activePost.id] || activePost.baseViews)} consultations
                </span>
                <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <ThumbsUp size={14} />
                  {activePost.baseVotes + (votes[activePost.id] ? 1 : 0)} riverains confirment
                </span>
                <span className="flex items-center gap-1 font-bold text-navy-500 dark:text-navy-400">
                  <MessageCircle size={14} />
                  {activePost.commentairesCount} réactions
                </span>
              </div>
            </div>

            {/* Pied du post avec actions d'entraide */}
            <div className="p-4 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between gap-3 bg-navy-50/50 dark:bg-[#050D18]">
              {/* Bouton +1 Vu aussi interactif */}
              <button
                type="button"
                onClick={() => handleVote(activePost.id)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
                  votes[activePost.id]
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-navy-200/80 dark:bg-navy-800 text-navy-900 dark:text-white hover:bg-emerald-600 hover:text-white'
                }`}
              >
                <ThumbsUp size={16} />
                <span>{votes[activePost.id] ? 'Constat validé (✓)' : '+1 Vu aussi'}</span>
              </button>

              {/* Bouton Voir dans l'espace Communauté */}
              <button
                type="button"
                onClick={() => {
                  setActivePost(null);
                  navigate('/citoyen/communaute');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
              >
                <span>Espace Communauté</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. MODALE VISUALISEUR DE STORY FLASH QUARTIER ── */}
      {activeStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActiveStory(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#071322] rounded-3xl overflow-hidden shadow-2xl border border-navy-100 dark:border-navy-800 flex flex-col"
          >
            {/* Image de la Story avec barre de progression */}
            <div className="relative aspect-4/3 bg-navy-900">
              <img
                src={activeStory.image}
                alt={activeStory.quartier}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

              {/* Header de la story */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <img
                    src={activeStory.avatar}
                    alt={activeStory.relais}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white"
                  />
                  <div>
                    <h4 className="text-xs font-black">{activeStory.quartier}</h4>
                    <p className="text-[10px] text-slate-200">
                      {activeStory.relais} · {activeStory.heure}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStory(null)}
                  className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Badge de statut */}
              <div className="absolute bottom-3 left-3">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 text-navy-900 backdrop-blur-xs">
                  Point Relais Quartier
                </span>
              </div>
            </div>

            {/* Texte de la story */}
            <div className="p-4 flex flex-col gap-3">
              <p className="text-sm text-navy-800 dark:text-navy-100 font-medium leading-relaxed">
                {activeStory.texte}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-navy-100 dark:border-navy-800 text-xs">
                <span className="text-navy-500 dark:text-navy-400 flex items-center gap-1 font-semibold">
                  <Eye size={13} className="text-blue-500" />
                  {(vues[activeStory.id] || 1) + 12} vues
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveStory(null);
                    navigate('/citoyen/communaute');
                  }}
                  className="text-xs font-bold text-[#CC131A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Rejoindre l'échange</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
