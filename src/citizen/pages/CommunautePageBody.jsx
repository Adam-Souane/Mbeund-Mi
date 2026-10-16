import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  MapPin,
  Camera,
  Heart,
  MessageCircle,
  Share2,
  Send,
  ShieldCheck,
  Clock,
  Sparkles,
  Flame,
  ArrowLeft,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import { useAuth } from '../../auth/AuthContext';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';

// Publications communautaires réalistes ancrées à Thiaroye-sur-Mer
const INITIAL_POSTS = [
  {
    id: 1,
    author: {
      name: 'Amadou Diallo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      quartier: 'Ndakhane (Thiaroye)',
      role: 'Délégué de quartier',
    },
    date: 'Il y a 15 minutes',
    categorie: 'Égouts & Caniveaux',
    texte: 'Le caniveau d\'évacuation le long de la ruelle principale est encombré de sable et de bouteilles plastiques. L\'eau commence à refouler doucement vers les concessions. Besoin de bras pour curer avant 18h.',
    image: '/images/caniveau-thiaroye.jpg',
    statut: 'en_cours',
    statutLabel: 'Mobilisation en cours',
    likes: 18,
    commentsCount: 5,
    comments: [
      { id: 101, author: 'Moussa S.', text: 'On arrive avec 3 pelles et des bottes depuis le secteur Plage.', time: 'Il y a 10 min' },
      { id: 102, author: 'Fatou K.', text: 'Les sacs de sable sont stockés à côté de la boutique El Hadj.', time: 'Il y a 4 min' },
    ],
  },
  {
    id: 2,
    author: {
      name: 'Khady Ndiaye',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      quartier: 'Thiaroye Plage',
      role: 'Comité de vigilance',
    },
    date: 'Il y a 42 minutes',
    categorie: 'Pompage d\'urgence',
    texte: 'Excellente nouvelle : l\'équipe municipale et l\'ONAS viennent de mettre en route la grande motopompe d\'évacuation. Les gros tuyaux noirs évacuent l\'eau vers le canal collecteur.',
    image: '/images/pompage-thiaroye.jpg',
    statut: 'resolu',
    statutLabel: 'Évacuation active',
    likes: 34,
    commentsCount: 3,
    comments: [
      { id: 201, author: 'Ibrahima D.', text: 'Alhamdoulilah, le niveau de l\'eau commence déjà à baisser dans notre ruelle !', time: 'Il y a 25 min' },
    ],
  },
  {
    id: 3,
    author: {
      name: 'Cheikh Tidiane Sow',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      quartier: 'Thiaroye Gare / Rue 10',
      role: 'Résident',
    },
    date: 'Il y a 1 heure',
    categorie: 'Passage piéton aménagé',
    texte: 'La ruelle reste inondée avec environ 20 cm d\'eau sableuse. Les jeunes ont posé des parpaings et des planches de bois pour permettre aux enfants et aux mamans de traverser à sec.',
    image: '/images/ruelle-thiaroye.jpg',
    statut: 'en_cours',
    statutLabel: 'Passage sécurisé',
    likes: 27,
    commentsCount: 2,
    comments: [
      { id: 301, author: 'Awa M.', text: 'Bravo aux jeunes du quartier pour l\'initiative solidaire.', time: 'Il y a 40 min' },
    ],
  },
  {
    id: 4,
    author: {
      name: 'Ousmane Ba',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      quartier: 'CEM Thiaroye 44',
      role: 'Riverain',
    },
    date: 'Il y a 2 heures',
    categorie: 'Information locale',
    texte: 'Attention pour les véhicules légers et motos jakarta : l\'accès devant le collège est difficilement praticable. Privilégiez le contournement par la voie ferrée pour éviter de caler.',
    image: null, // Exemple sans photo : carte textuelle soignée
    statut: 'info',
    statutLabel: 'Vigilance signalée',
    likes: 12,
    commentsCount: 1,
    comments: [
      { id: 401, author: 'Alioune T.', text: 'Merci pour l\'info, je prends le détour par le marché.', time: 'Il y a 1h' },
    ],
  },
];

export default function CommunautePageBody() {
  const { username } = useAuth();
  const nomCitoyen = username || 'Citoyen';

  const [filter, setFilter] = useState('tous'); // 'tous' | 'tendances' | 'en_cours' | 'resolus'
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [newPostText, setNewPostText] = useState('');
  const [selectedQuartier, setSelectedQuartier] = useState('Ndakhane (Thiaroye)');
  const [selectedCategorie, setSelectedCategorie] = useState('Eau stagnante');
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [userLikes, setUserLikes] = useState({});

  // Basculer le like (+1 Vu aussi / Soutenir)
  const toggleLike = (postId) => {
    setUserLikes((prev) => {
      const isLiked = !!prev[postId];
      const newLiked = !isLiked;
      
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              likes: isLiked ? p.likes - 1 : p.likes + 1,
            };
          }
          return p;
        })
      );
      
      return { ...prev, [postId]: newLiked };
    });
  };

  // Basculer l'affichage des commentaires
  const toggleComments = (postId) => {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Ajouter un nouveau commentaire
  const handleAddComment = (postId, e) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.id === postId) {
          const newComment = {
            id: Date.now(),
            author: nomCitoyen,
            text,
            time: 'À l’instant',
          };
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...(p.comments || []), newComment],
          };
        }
        return p;
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setOpenComments((prev) => ({ ...prev, [postId]: true }));
  };

  // Publier un nouveau post
  const handlePublishPost = (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost = {
      id: Date.now(),
      author: {
        name: nomCitoyen,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        quartier: selectedQuartier,
        role: 'Citoyen vérifié',
      },
      date: 'À l’instant',
      categorie: selectedCategorie,
      texte: newPostText,
      image: null,
      statut: 'en_cours',
      statutLabel: 'Signalé au quartier',
      likes: 1,
      commentsCount: 0,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
  };

  // Filtrage des posts
  const filteredPosts = posts.filter((p) => {
    if (filter === 'tendances') return p.likes >= 15;
    if (filter === 'en_cours') return p.statut === 'en_cours';
    if (filter === 'resolus') return p.statut === 'resolu';
    return true;
  });

  return (
    <CitizenShell>
      {/* 1. En-tête stylisé de la communauté façon hub social */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#103565] to-slate-900 text-white p-6 sm:p-7 shadow-xl border border-blue-900/40">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <Link
              to="/citoyen/accueil"
              aria-label="Retour à l'accueil"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition active:scale-95"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Espace Communauté · Thiaroye
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  En direct
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Fil d’actualité citoyen, signalements géolocalisés et entraide solidaire entre voisins
              </p>
            </div>
          </div>

          <Link
            to="/citoyen/signaler"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white text-xs sm:text-sm font-black shadow-md transition active:scale-95 cursor-pointer"
          >
            <Camera size={16} />
            Signaler avec photo
          </Link>
        </div>
      </div>

      {/* 2. Barre de Publication Sociale (façon Facebook / Instagram) */}
      <div className="bg-white dark:bg-navy border border-navy-100 dark:border-navy-800 rounded-2xl p-4 sm:p-5 shadow-sm transition-all">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0B2545] to-blue-600 text-white font-black flex items-center justify-center flex-shrink-0 shadow-xs">
            {nomCitoyen.charAt(0).toUpperCase()}
          </div>
          <form onSubmit={handlePublishPost} className="flex-1 space-y-3">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Que se passe-t-il dans votre ruelle ? Partagez une alerte, un besoin d'aide ou une information pour le quartier..."
              rows={3}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900/60 text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedQuartier}
                  onChange={(e) => setSelectedQuartier(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-800 dark:text-slate-200 font-bold"
                >
                  <option value="Ndakhane (Thiaroye)">📍 Ndakhane Cuvette</option>
                  <option value="Thiaroye Plage">📍 Thiaroye Plage</option>
                  <option value="Thiaroye Gare">📍 Thiaroye Gare / Rue 10</option>
                  <option value="CEM Thiaroye 44">📍 CEM Thiaroye 44</option>
                </select>

                <select
                  value={selectedCategorie}
                  onChange={(e) => setSelectedCategorie(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-800 dark:text-slate-200 font-bold"
                >
                  <option value="Caniveau bouché">💧 Caniveau bouché</option>
                  <option value="Eau stagnante">🌊 Eau stagnante</option>
                  <option value="Pompage requis">🚜 Pompage requis</option>
                  <option value="Entraide sacs de sable">🧱 Entraide sacs de sable</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!newPostText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0B2545] hover:bg-[#154275] disabled:opacity-50 text-white text-xs sm:text-sm font-black transition shadow-xs cursor-pointer active:scale-95"
              >
                <Send size={14} />
                Publier sur le fil
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Filtres du Fil Communautaire */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilter('tous')}
          className={`px-4 py-1.5 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap ${
            filter === 'tous'
              ? 'bg-[#0B2545] text-white'
              : 'bg-white dark:bg-navy text-navy-600 dark:text-navy-200 border border-navy-100 dark:border-navy-800 hover:border-navy-300'
          }`}
        >
          <Users size={14} />
          Toutes les alertes ({posts.length})
        </button>

        <button
          onClick={() => setFilter('tendances')}
          className={`px-4 py-1.5 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap ${
            filter === 'tendances'
              ? 'bg-amber-600 text-white'
              : 'bg-white dark:bg-navy text-navy-600 dark:text-navy-200 border border-navy-100 dark:border-navy-800 hover:border-amber-300'
          }`}
        >
          <Flame size={14} className="text-amber-400" />
          Les plus soutenues (+1)
        </button>

        <button
          onClick={() => setFilter('en_cours')}
          className={`px-4 py-1.5 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap ${
            filter === 'en_cours'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-navy text-navy-600 dark:text-navy-200 border border-navy-100 dark:border-navy-800 hover:border-blue-300'
          }`}
        >
          <Clock size={14} />
          Interventions en cours
        </button>

        <button
          onClick={() => setFilter('resolus')}
          className={`px-4 py-1.5 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap ${
            filter === 'resolus'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-navy text-navy-600 dark:text-navy-200 border border-navy-100 dark:border-navy-800 hover:border-emerald-300'
          }`}
        >
          <CheckCircle2 size={14} />
          Résolus
        </button>
      </div>

      {/* 4. Liste des Publications Sociales du Quartier (style Instagram / Facebook) */}
      <div className="space-y-5 max-w-2xl mx-auto w-full">
        {filteredPosts.map((post) => {
          const isLiked = !!userLikes[post.id];
          const areCommentsOpen = !!openComments[post.id];

          return (
            <article
              key={post.id}
              className="bg-white dark:bg-navy border border-navy-100 dark:border-navy-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* En-tête du post : Auteur + Quartier + Statut d'intervention */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-navy-50 dark:border-navy-800/80">
                <div className="flex items-center gap-3">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-navy-700"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-navy-900 dark:text-white">
                        {post.author.name}
                      </span>
                      {post.author.role && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                          {post.author.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 text-[#CC131A] font-bold">
                        <MapPin size={12} />
                        {post.author.quartier}
                      </span>
                      <span>·</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                </div>

                {/* Badge officiel de statut */}
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full ${
                      post.statut === 'resolu'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <ShieldCheck size={13} />
                    {post.statutLabel}
                  </span>
                </div>
              </div>

              {/* Contenu Texte du Post */}
              <div className="p-4 sm:p-5 pt-3">
                <div className="inline-block mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                    {post.categorie}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-navy-900 dark:text-slate-100 leading-relaxed">
                  {post.texte}
                </p>
              </div>

              {/* Photo Authentique du Terrain (si présente) */}
              {post.image && (
                <div className="relative w-full bg-slate-100 dark:bg-navy-950 border-y border-navy-50 dark:border-navy-800 overflow-hidden max-h-[460px]">
                  <img
                    src={post.image}
                    alt={post.texte}
                    className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                  />
                </div>
              )}

              {/* Barre d'actions sociales : Soutenir (+1 Vu aussi) + Commenter + Partager */}
              <div className="px-4 sm:px-5 py-3 flex items-center justify-between border-t border-navy-50 dark:border-navy-800/80 bg-slate-50/50 dark:bg-navy-900/30">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer ${
                      isLiked
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-white dark:bg-navy text-navy-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700 hover:border-red-300 hover:text-red-600'
                    }`}
                  >
                    <Heart size={16} className={isLiked ? 'fill-white' : ''} />
                    <span>+1 Vu aussi</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[11px] bg-black/10">
                      {post.likes}
                    </span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-navy text-navy-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 transition active:scale-95 cursor-pointer"
                  >
                    <MessageCircle size={16} />
                    <span>Commentaires</span>
                    <span className="ml-0.5 text-xs text-slate-500">
                      ({post.commentsCount})
                    </span>
                  </button>
                </div>

                <Link
                  to="/citoyen/carte"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-600 dark:text-slate-300 hover:text-[#0B2545] dark:hover:text-white"
                >
                  <MapPin size={14} className="text-[#CC131A]" />
                  <span>Sur la carte</span>
                </Link>
              </div>

              {/* Section Commentaires des Voisins */}
              {areCommentsOpen && (
                <div className="p-4 sm:p-5 pt-3 bg-slate-50/70 dark:bg-navy-900/50 border-t border-navy-50 dark:border-navy-800 space-y-3">
                  {post.comments && post.comments.length > 0 ? (
                    <div className="space-y-2.5">
                      {post.comments.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl bg-white dark:bg-navy border border-slate-200/80 dark:border-navy-800 text-xs shadow-2xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-navy-900 dark:text-white">
                              {c.author}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.time}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                            {c.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">
                      Soyez le premier voisin à commenter cette situation.
                    </p>
                  )}

                  {/* Formulaire pour répondre */}
                  <form
                    onSubmit={(e) => handleAddComment(post.id, e)}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                      }
                      placeholder="Ajouter une précision ou informer les voisins..."
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy text-navy-900 dark:text-white focus:outline-none focus:border-[#0B2545]"
                    />
                    <button
                      type="submit"
                      disabled={!(commentInputs[post.id] || '').trim()}
                      className="p-2 rounded-xl bg-[#0B2545] text-white hover:bg-[#154275] disabled:opacity-40 transition cursor-pointer"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </CitizenShell>
  );
}
