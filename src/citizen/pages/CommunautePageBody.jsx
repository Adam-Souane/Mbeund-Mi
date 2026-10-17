import { useState, useMemo, useEffect } from 'react';
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
  Plus,
  X,
  Eye,
  Check,
  Droplets,
  MessageSquarePlus,
  Image as ImageIcon,
  Timer,
  Info,
  Flag,
  AlertTriangle,
  ShieldAlert,
  AlignLeft,
  Palette,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import { useAuth } from '../../auth/AuthContext';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';
import { STORIES_COMMUNAUTE, COMMUNAUTE_POSTS } from '../../shared/data/riverainsData';
import { sanitizePublicText, sanitizePublicAuthor } from '../../shared/utils/sanitizer';
import { getPublicAvatar } from '../../shared/utils/avatarResolver';
import { checkContentModeration, isUserBanned, reportContent } from '../../shared/utils/moderation';

export default function CommunautePageBody() {
  const { username, user } = useAuth();
  const nomCitoyen = user?.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : (username || 'Citoyen');

  // Récupération des signalements citoyens réels depuis le backend Django
  const { data: signalementsData } = useSignalementsApercu();

  // Filtres : 'tous' | 'signalements' | 'entraide' | 'resolus'
  const [filter, setFilter] = useState('tous');
  const [activeStory, setActiveStory] = useState(null);

  // Stories lues / vues stockées en local pour griser l'anneau de l'avatar comme sur l'accueil
  const [viewedStories, setViewedStories] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_community_viewed_stories');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleOpenStory = (story) => {
    setActiveStory(story);
    setViewedStories((prev) => {
      const next = { ...prev, [story.id]: true };
      try {
        localStorage.setItem('mbeund_mi_community_viewed_stories', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Vérification de suspension / bannissement exclusif de l'Espace Communauté
  const userIsBanned = useMemo(() => {
    return isUserBanned(username) || isUserBanned(nomCitoyen);
  }, [username, nomCitoyen]);

  // État de la popup "Nouveau post"
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [modalPostText, setModalPostText] = useState('');
  const [modalType, setModalType] = useState('signalement'); // 'signalement' | 'entraide' | 'resolu'
  const [modalQuartier, setModalQuartier] = useState('Ndakhane (Thiaroye)');
  const [modalCategorie, setModalCategorie] = useState('Eau stagnante');
  const [modalPhotoChoice, setModalPhotoChoice] = useState('none');
  const [modalError, setModalError] = useState(null);

  // État de la popup "Créer une Story éphémère (24h)" (Photo ou Texte seul)
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyMode, setStoryMode] = useState('texte'); // 'texte' | 'photo'
  const [storyText, setStoryText] = useState('');
  const [storyQuartier, setStoryQuartier] = useState('Ndakhane (Thiaroye)');
  const [storyBgGradient, setStoryBgGradient] = useState('from-[#0B2545] via-[#103565] to-slate-950');
  const [storyPhotoChoice, setStoryPhotoChoice] = useState('ruelle');
  const [storyError, setStoryError] = useState(null);
  const [isStoryTextExpanded, setIsStoryTextExpanded] = useState(false);

  // Stories créées localement par l'utilisateur
  const [userStories, setUserStories] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_user_stories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fusion de toutes les stories (Stories du citoyen connecté + Stories des relais de quartier)
  const allStories = useMemo(() => {
    return [...userStories, ...STORIES_COMMUNAUTE];
  }, [userStories]);

  // Signalement citoyen pour modération (pour préserver un espace sain)
  const [reportingItem, setReportingItem] = useState(null);
  const [reportingReason, setReportingReason] = useState('Propos inappropriés / agressifs');
  const [reportSuccessToast, setReportSuccessToast] = useState(null);
  const [reportedIds, setReportedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_user_reported_ids');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [copiedShareId, setCopiedShareId] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Commentaires stockés en local par identifiant de post pour incrémenter instantanément le bouton Avis
  const [commentsByPost, setCommentsByPost] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_community_comments');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mbeund_mi_community_comments', JSON.stringify(commentsByPost));
    } catch {}
  }, [commentsByPost]);

  // Likes gérés en local avec nettoyage strict des clés corrompues (ex: 'undefined', 'backend-undefined')
  const [likesState, setLikesState] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_community_likes');
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      delete parsed['undefined'];
      delete parsed['backend-undefined'];
      delete parsed['null'];
      return parsed;
    } catch {
      return {};
    }
  });

  // Sauvegarde des likes dans le localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mbeund_mi_community_likes', JSON.stringify(likesState));
    } catch {}
  }, [likesState]);

  // Vues gérées en local (séparées des cœurs/likes)
  const [viewsState, setViewsState] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_community_views');
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      delete parsed['undefined'];
      delete parsed['backend-undefined'];
      delete parsed['null'];
      return parsed;
    } catch {
      return {};
    }
  });

  // Sauvegarde des vues dans le localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mbeund_mi_community_views', JSON.stringify(viewsState));
    } catch {}
  }, [viewsState]);

  // Palettes de dégradés modernes pour les Stories Citoyennes de type "Texte seul"
  const STORY_GRADIENTS = [
    { id: 'navy', label: 'Océan Nuit', class: 'from-[#0B2545] via-[#103565] to-slate-950', previewBg: 'bg-gradient-to-br from-[#0B2545] via-[#103565] to-slate-950' },
    { id: 'sunset', label: 'Crépuscule', class: 'from-amber-600 via-rose-600 to-purple-900', previewBg: 'bg-gradient-to-br from-amber-600 via-rose-600 to-purple-900' },
    { id: 'emerald', label: 'Espoir Vert', class: 'from-emerald-700 via-teal-800 to-slate-950', previewBg: 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950' },
    { id: 'danger', label: 'Alerte Rouge', class: 'from-red-700 via-rose-800 to-slate-950', previewBg: 'bg-gradient-to-br from-red-700 via-rose-800 to-slate-950' },
    { id: 'purple', label: 'Sérénité', class: 'from-indigo-700 via-purple-800 to-slate-950', previewBg: 'bg-gradient-to-br from-indigo-700 via-purple-800 to-slate-950' },
  ];

  // Options de photos disponibles pour la modale (enrichies avec des situations variées de Thiaroye)
  const PHOTO_PRESETS = [
    { id: 'none', label: 'Sans photo (texte)', url: null },
    { id: 'ruelle', label: 'Ruelle inondée', url: '/images/communaute-ruelle.jpg' },
    { id: 'pluie', label: 'Carrefour submergé', url: '/images/communaute-pluie.jpg' },
    { id: 'caniveau', label: 'Curage caniveau', url: '/images/communaute-caniveau.jpg' },
    { id: 'entraide', label: 'Sacs de sable', url: '/images/communaute-entraide.jpg' },
    { id: 'pompage', label: 'Pompage ONAS', url: '/images/communaute-pompage.jpg' },
    { id: 'passerelle', label: 'Passerelle piétonne', url: '/images/communaute-passerelle.jpg' },
  ];

  // Options de catégories selon le type de post sélectionné
  const CATEGORIES_BY_TYPE = {
    signalement: [
      { value: 'Eau stagnante', label: '💧 Eau stagnante' },
      { value: 'Caniveau bouché', label: '🚰 Caniveau bouché' },
      { value: 'Pompage requis', label: '🚜 Pompage requis' },
      { value: 'Reflux ruissellement', label: '🌊 Reflux ruissellement' },
    ],
    entraide: [
      { value: 'Entraide sacs de sable', label: '🧱 Entraide sacs de sable' },
      { value: 'Volontaires & Bénévoles', label: '🤝 Volontaires & Bénévoles' },
      { value: 'Besoin d’outils (pelles/brouettes)', label: '🛠️ Besoin d’outils' },
      { value: 'Soutien aux concessions', label: '🏠 Soutien aux concessions' },
    ],
    resolu: [
      { value: 'Passage piéton aménagé', label: '🚶 Passage piéton aménagé' },
      { value: 'Décrue constatée', label: '📉 Décrue constatée' },
      { value: 'Voie sécurisée & Canaux dégagés', label: '✅ Voie sécurisée' },
      { value: 'Pompage terminé', label: '✨ Pompage terminé' },
    ],
  };

  // Synchroniser la catégorie par défaut quand le type change
  const handleTypeChange = (newType) => {
    setModalType(newType);
    const available = CATEGORIES_BY_TYPE[newType];
    if (available && available.length > 0) {
      setModalCategorie(available[0].value);
    }
  };

  // Fusion des publications locales + signalements réels du backend avec identifiants strictement uniques
  const allPosts = useMemo(() => {
    // 1. Signalements réels issus de la base de données Django (extraction souple et ID 100% unique)
    const backendItems = [];
    const rawFeatures = Array.isArray(signalementsData?.results?.features)
      ? signalementsData.results.features
      : Array.isArray(signalementsData?.features)
      ? signalementsData.features
      : Array.isArray(signalementsData?.results)
      ? signalementsData.results
      : Array.isArray(signalementsData)
      ? signalementsData
      : [];

    rawFeatures.forEach((feat, idx) => {
      const p = feat.properties || feat;
      const isResolu = !!p.valide;
      // IMPORTANT : Utilise feat.id ou p.id ou fallback avec index pour garantir l'unicité stricte
      const uniqueRawId = feat.id ?? p.id ?? feat.pk ?? p.pk ?? `idx-${idx}`;
      const sigId = `backend-sig-${uniqueRawId}`;

      // Nettoyage strict RGPD / Confidentialité : suppression des [SMS de 221...], numéros de tél et mentions privées
      const rawAuthor = p.citoyen_prenom ? `${p.citoyen_prenom} ${p.citoyen_nom || ''}`.trim() : null;
      const cleanAuthor = sanitizePublicAuthor(rawAuthor, 'Sentinelle Citoyenne');
      const cleanTitre = sanitizePublicText(p.titre || p.categorie || 'Observation terrain');
      const cleanTexte = sanitizePublicText(p.description || 'Montée des eaux observée sur la voie publique.');
      const uniqueAvatar = getPublicAvatar({ name: cleanAuthor, id: sigId, context: cleanTexte });

      backendItems.push({
        id: sigId,
        isBackendSignalement: true,
        typePost: isResolu ? 'resolu' : 'signalement',
        badgeFiltre: isResolu ? 'Résolu & Sécurisé' : 'Signalement terrain',
        author: {
          name: cleanAuthor,
          avatar: uniqueAvatar,
          quartier: p.citoyen_quartier || p.quartier || 'Thiaroye-sur-Mer',
          role: 'Signalement Terrain',
        },
        date: p.date_creation
          ? new Date(p.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          : 'Récemment',
        dureeType: 'Post durable',
        categorie: p.categorie || 'Inondation',
        titre: cleanTitre,
        texte: cleanTexte,
        image: p.photo || null,
        statut: isResolu ? 'resolu' : 'en_cours',
        statutLabel: isResolu ? 'Vérifié par la mairie' : 'En attente de traitement',
        baseLikes: 5,
        baseViews: 38 + ((idx * 17) % 52),
        comments: [],
      });
    });

    // 2. Posts durables de la communauté avec nouvelles images de Thiaroye et posts sans images
    const riverainsItems = COMMUNAUTE_POSTS.map((r) => {
      const authorAvatar = getPublicAvatar({ name: r.auteur, id: r.id, preferredAvatar: r.avatar, context: r.description });
      return {
        id: r.id,
        isBackendSignalement: false,
        typePost: r.typePost || (r.statut === 'resolu' ? 'resolu' : 'signalement'),
        badgeFiltre: r.badgeFiltre || (r.statut === 'resolu' ? 'Résolu & Sécurisé' : 'Signalement terrain'),
        author: {
          name: sanitizePublicAuthor(r.auteur),
          avatar: authorAvatar,
          quartier: r.quartier,
          role: r.statut === 'resolu' ? 'Relais Quartier' : 'Résident',
        },
        date: r.temps,
        dureeType: r.dureeType,
        categorie: r.categorie,
        titre: sanitizePublicText(r.titre),
        texte: sanitizePublicText(r.description),
        image: r.photo || null,
        statut: r.statut,
        statutLabel: r.statutLabel,
        baseLikes: r.baseVotes,
        baseViews: r.baseViews || 64,
        comments: [
          { id: `${r.id}-c1`, author: 'Moussa S.', text: 'On arrive avec des renforts depuis le secteur Plage.', time: 'Il y a 10 min' },
          { id: `${r.id}-c2`, author: 'Fatou K.', text: 'Bien noté, courage à tous les voisins !', time: 'Il y a 5 min' },
        ],
      };
    });

    return [...userPosts, ...backendItems, ...riverainsItems];
  }, [signalementsData, userPosts]);

  // Compteurs par filtre
  const counts = useMemo(() => {
    return {
      tous: allPosts.length,
      signalements: allPosts.filter((p) => p.typePost === 'signalement' || p.isBackendSignalement).length,
      entraide: allPosts.filter((p) => p.typePost === 'entraide').length,
      resolus: allPosts.filter((p) => p.typePost === 'resolu' || p.statut === 'resolu').length,
    };
  }, [allPosts]);

  // Filtrage strict et adapté demandé par l'utilisateur
  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      if (filter === 'signalements') {
        return post.typePost === 'signalement' || post.isBackendSignalement;
      }
      if (filter === 'entraide') {
        return post.typePost === 'entraide';
      }
      if (filter === 'resolus') {
        return post.typePost === 'resolu' || post.statut === 'resolu';
      }
      return true;
    });
  }, [allPosts, filter]);

  // Action like / cœurs : bascule UNIQUEMENT le post ciblé par son identifiant unique
  const handleToggleLike = (postId) => {
    if (!postId) return;
    setLikesState((prev) => {
      const isCurrentlyLiked = !!prev[postId];
      return {
        ...prev,
        [postId]: !isCurrentlyLiked,
      };
    });
  };

  const getLikesCount = (postId, baseLikes) => {
    if (!postId) return baseLikes;
    const isLiked = !!likesState[postId];
    return baseLikes + (isLiked ? 1 : 0);
  };

  // Action vues : incrémente UNIQUEMENT le post ciblé
  const getViewsCount = (postId, baseViews) => {
    if (!postId) return baseViews || 15;
    const extra = viewsState[postId] || 0;
    return (baseViews || 15) + extra;
  };

  const handleIncrementView = (postId) => {
    if (!postId) return;
    setViewsState((prev) => {
      const current = prev[postId] || 0;
      return {
        ...prev,
        [postId]: current + 1,
      };
    });
  };

  // Action partage
  const handleShare = async (post) => {
    const shareData = {
      title: `Observation Mbeund-Mi : ${post.categorie}`,
      text: `${post.author.name} (${post.author.quartier}) : ${post.texte}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      navigator.clipboard?.writeText(`${shareData.text} — Suivi sur Mbeund-Mi : ${window.location.href}`);
      setCopiedShareId(post.id);
      setTimeout(() => setCopiedShareId(null), 2500);
    }
  };

  // Action ajout commentaire : vérifie la modération, enregistre dans commentsByPost et incrémente aussitôt le compteur du bouton Avis
  const handleAddComment = (postId, e) => {
    e.preventDefault();
    if (userIsBanned) {
      setReportSuccessToast("Votre participation à l'espace communauté est suspendue suite à des signalements.");
      setTimeout(() => setReportSuccessToast(null), 4000);
      return;
    }
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    // Modération automatique (injures, propos haineux wolof/français)
    const modCheck = checkContentModeration(text);
    if (!modCheck.isValid) {
      setReportSuccessToast(`⚠️ Modération Mbeund-Mi : ${modCheck.reason}`);
      setTimeout(() => setReportSuccessToast(null), 4000);
      return;
    }

    const sanitizedComment = sanitizePublicText(text);
    const sanitizedAuthor = sanitizePublicAuthor(nomCitoyen, 'Citoyen');

    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author: sanitizedAuthor,
      text: sanitizedComment,
      time: 'À l’instant',
    };

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setOpenComments((prev) => ({ ...prev, [postId]: true }));
  };

  // Action publication via la modale avec contrôle de modération strict
  const handleSubmitModalPost = (e) => {
    e.preventDefault();
    setModalError(null);

    if (userIsBanned) {
      setModalError("Votre participation à l'espace communauté est actuellement suspendue.");
      return;
    }

    if (!modalPostText.trim()) return;

    // Vérification de modération du texte du post
    const modCheck = checkContentModeration(modalPostText);
    if (!modCheck.isValid) {
      setModalError(modCheck.reason);
      return;
    }

    const selectedPreset = PHOTO_PRESETS.find((p) => p.id === modalPhotoChoice);
    const chosenImage = selectedPreset ? selectedPreset.url : null;

    const badgeLabel =
      modalType === 'signalement'
        ? 'Signalement terrain'
        : modalType === 'entraide'
        ? 'Entraide & Mobilisation'
        : 'Résolu & Sécurisé';

    const statutLabel =
      modalType === 'resolu'
        ? 'Résolu & Sécurisé'
        : modalType === 'entraide'
        ? 'Mobilisation citoyenne active'
        : 'Signalement actif · Traitement requis';

    const cleanText = sanitizePublicText(modalPostText.trim());
    const cleanAuthor = sanitizePublicAuthor(nomCitoyen, 'Citoyen');
    const cleanCategorie = sanitizePublicText(modalCategorie);
    const newPostId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const userAvatar = getPublicAvatar({ name: cleanAuthor, id: newPostId, context: cleanText });

    const newPost = {
      id: newPostId,
      isBackendSignalement: false,
      typePost: modalType,
      badgeFiltre: badgeLabel,
      author: {
        name: cleanAuthor,
        avatar: userAvatar,
        quartier: modalQuartier,
        role: modalType === 'entraide' ? 'Volontaire engagé' : 'Citoyen mobilisé',
      },
      date: 'Posté à l’instant',
      dureeType: modalType === 'resolu' ? 'Post durable (résolu)' : 'Post durable (actif)',
      categorie: cleanCategorie,
      titre: cleanCategorie,
      texte: cleanText,
      image: chosenImage,
      statut: modalType === 'resolu' ? 'resolu' : 'en_cours',
      statutLabel,
      baseLikes: 1,
      baseViews: 1,
      comments: [],
    };

    setUserPosts([newPost, ...userPosts]);
    setModalPostText('');
    setModalPhotoChoice('none');
    setModalError(null);
    setIsPostModalOpen(false);
  };

  // Action création d'une Story éphémère 24h (Photo ou Texte seul avec dégradé stylé)
  const handleCreateStory = (e) => {
    e.preventDefault();
    setStoryError(null);

    if (userIsBanned) {
      setStoryError("Votre participation à l'espace communauté est actuellement suspendue.");
      return;
    }

    const trimmed = storyText.trim();
    if (!trimmed) {
      setStoryError("Veuillez saisir votre observation ou message terrain.");
      return;
    }

    const modCheck = checkContentModeration(trimmed);
    if (!modCheck.isValid) {
      setStoryError(modCheck.reason);
      return;
    }

    const cleanText = sanitizePublicText(trimmed);
    const cleanAuthor = sanitizePublicAuthor(nomCitoyen, 'Moi');
    const newStoryId = `user-story-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const userAvatar = getPublicAvatar({ name: cleanAuthor, id: newStoryId, context: cleanText });

    let photoUrl = null;
    if (storyMode === 'photo') {
      const preset = PHOTO_PRESETS.find((p) => p.id === storyPhotoChoice);
      photoUrl = preset && preset.url ? preset.url : '/images/communaute-ruelle.jpg';
    }

    const createdStory = {
      id: newStoryId,
      isUserStory: true,
      isTextStory: storyMode === 'texte',
      gradientClass: storyBgGradient,
      relais: cleanAuthor,
      avatar: userAvatar,
      role: 'Citoyen',
      quartier: storyQuartier,
      heure: 'À l’instant',
      expiration: 'Expire dans 24h',
      dotColor: 'bg-emerald-400',
      texte: cleanText,
      image: photoUrl,
    };

    const updatedStories = [createdStory, ...userStories];
    setUserStories(updatedStories);
    try {
      localStorage.setItem('mbeund_mi_user_stories', JSON.stringify(updatedStories));
    } catch {}

    setStoryText('');
    setStoryError(null);
    setIsStoryModalOpen(false);
    handleOpenStory(createdStory);
  };

  // Action signalement d'un contenu abusif par un riverain
  const handleConfirmReport = () => {
    if (!reportingItem) return;

    reportContent({
      targetId: reportingItem.targetId,
      targetType: reportingItem.targetType,
      authorName: reportingItem.authorName,
      reason: reportingReason,
    });

    const newReported = { ...reportedIds, [reportingItem.targetId]: true };
    setReportedIds(newReported);
    try {
      localStorage.setItem('mbeund_mi_user_reported_ids', JSON.stringify(newReported));
    } catch {}

    setReportingItem(null);
    setReportSuccessToast('Signalement transmis aux modérateurs. Merci de veiller sur la communauté.');
    setTimeout(() => {
      setReportSuccessToast(null);
    }, 4000);
  };

  return (
    <CitizenShell>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. HEADER COMMUNAUTÉ CONSERVÉ STRICTEMENT INTÉGRALEMENT            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#103565] to-slate-900 text-white p-5 sm:p-7 shadow-xl border border-blue-900/40 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              to="/citoyen/accueil"
              aria-label="Retour à l'accueil"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition active:scale-95 flex-shrink-0"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Espace Communauté · Thiaroye
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  En direct
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 truncate">
                Fil d’actualité citoyen, signalements géolocalisés et entraide solidaire entre voisins
              </p>
            </div>
          </div>

          <Link
            to="/citoyen/signaler"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white text-xs sm:text-sm font-black shadow-md transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Camera size={16} />
            Signaler avec photo
          </Link>
        </div>
      </div>

      {/* Toast de confirmation de signalement */}
      {reportSuccessToast && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
          <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{reportSuccessToast}</span>
        </div>
      )}

      {/* Bannière d'avertissement si l'utilisateur est banni de l'espace Communauté */}
      {userIsBanned && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 dark:from-red-950/50 dark:via-red-900/40 dark:to-amber-950/30 border border-red-200 dark:border-red-900/60 flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/60 text-[#CC131A] dark:text-red-300 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div className="space-y-1 text-xs sm:text-sm">
            <h4 className="font-black text-red-900 dark:text-red-200">
              Participation à l'espace Communauté suspendue
            </h4>
            <p className="text-red-800 dark:text-red-300/90 leading-relaxed font-medium">
              Suite à des signalements répétés pour non-respect des règles de respect communautaire (propos déplacés ou insultes), la publication de posts, de stories et de commentaires est temporairement bloquée.
            </p>
            <div className="inline-flex items-center gap-1.5 pt-1 text-[11px] font-extrabold text-navy-800 dark:text-slate-200">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Vos accès vitaux restent 100% opérationnels : Carte des zones inondées, Alertes météo et Numéros d’urgence.</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. STORIES INSTAGRAM · ÉPHÉMÈRES (24 HEURES)                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-navy-900 dark:text-white">
              Stories du terrain · En direct
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] font-extrabold text-[#CC131A] dark:text-rose-400">
            <Timer size={13} />
            <span>Éphémère · Expire dans 24h</span>
          </div>
        </div>

        {/* Carousel horizontal fluide avec avatars de grande taille */}
        <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-2 pt-1 scrollbar-none px-1">
          {/* Cercle 1 : Ajouter sa propre observation terrain éphémère (Texte ou Photo) */}
          <button
            type="button"
            onClick={() => {
              if (userIsBanned) {
                setReportSuccessToast("Votre participation à l'espace communauté est suspendue suite à des signalements.");
                setTimeout(() => setReportSuccessToast(null), 4000);
                return;
              }
              setIsStoryModalOpen(true);
            }}
            disabled={userIsBanned}
            className={`flex flex-col items-center flex-shrink-0 group text-left transition active:scale-95 ${
              userIsBanned ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full p-[3px] border-2 border-dashed border-navy-300 dark:border-navy-700 group-hover:border-[#CC131A] transition-all flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-navy-50 dark:bg-navy-900/60 flex items-center justify-center text-navy-600 dark:text-navy-300 group-hover:bg-red-50 dark:group-hover:bg-red-950/40 group-hover:text-[#CC131A] transition-colors">
                <Plus size={28} className="transition-transform group-hover:scale-110" />
              </div>
            </div>
            <span className="text-xs font-black text-navy-800 dark:text-slate-200 mt-2 text-center truncate max-w-[76px] sm:max-w-[88px]">
              Votre story
            </span>
            <span className="text-[10px] text-slate-400 font-semibold text-center">
              24h direct
            </span>
          </button>

          {/* Stories des riverains de Thiaroye (taille agrandie avec bordure dégradée Instagram si non lue, grisée si lue) */}
          {allStories.map((story) => {
            const isRead = !!viewedStories[story.id];
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => handleOpenStory(story)}
                className="flex flex-col items-center flex-shrink-0 group cursor-pointer text-left transition-transform active:scale-95"
              >
                <div
                  data-testid={`story-ring-${story.id}`}
                  className={`relative w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full p-[3px] transition-all duration-300 ${
                    isRead
                      ? 'bg-slate-300 dark:bg-slate-700 opacity-70 group-hover:opacity-95 group-hover:bg-slate-400'
                      : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 group-hover:from-red-600 group-hover:to-amber-400 shadow-md group-hover:shadow-lg'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-navy-950 p-[2px]">
                    <img
                      src={story.avatar}
                      alt={story.relais}
                      className="w-full h-full rounded-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Point pulsant indicateur d'alerte en direct si non lu, ou discret grisé si déjà lu */}
                  <span
                    className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#071322] ${
                      isRead ? 'bg-slate-400' : `${story.dotColor || 'bg-emerald-400'} animate-pulse shadow-xs`
                    }`}
                  />
                </div>

                <span
                  className={`text-xs mt-2 text-center truncate max-w-[76px] sm:max-w-[88px] ${
                    isRead ? 'font-bold text-slate-500 dark:text-slate-400' : 'font-black text-navy-900 dark:text-white'
                  }`}
                >
                  {story.relais}
                </span>
                <span
                  className={`text-[10px] text-center truncate max-w-[76px] sm:max-w-[88px] ${
                    isRead ? 'font-semibold text-slate-400 dark:text-slate-500' : 'font-extrabold text-[#CC131A] dark:text-red-400'
                  }`}
                >
                  {story.quartier}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. BARRE D'ACTIONS : FILTRES ADAPTÉS À GAUCHE + BOUTON « NOUVEAU POST » À DROITE */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl p-3 sm:p-4 shadow-xs">
        {/* Filtres de navigation avec noms explicites demandés par l'utilisateur */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
          {/* Tous les posts */}
          <button
            onClick={() => setFilter('tous')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filter === 'tous'
                ? 'bg-[#0B2545] text-white shadow-xs'
                : 'bg-slate-50 dark:bg-navy-900 text-navy-600 dark:text-navy-200 border border-slate-200 dark:border-navy-800 hover:border-navy-300'
            }`}
          >
            <Users size={14} />
            <span>Tous les posts ({counts.tous})</span>
          </button>

          {/* Signalements terrain */}
          <button
            onClick={() => setFilter('signalements')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filter === 'signalements'
                ? 'bg-[#CC131A] text-white shadow-xs'
                : 'bg-slate-50 dark:bg-navy-900 text-navy-600 dark:text-navy-200 border border-slate-200 dark:border-navy-800 hover:border-red-300'
            }`}
          >
            <Camera size={14} />
            <span>Signalements terrain ({counts.signalements})</span>
          </button>

          {/* Entraide et mobilisation */}
          <button
            onClick={() => setFilter('entraide')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filter === 'entraide'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-navy-900 text-navy-600 dark:text-navy-200 border border-slate-200 dark:border-navy-800 hover:border-amber-300'
            }`}
          >
            <Flame size={14} />
            <span>Entraide & Mobilisation ({counts.entraide})</span>
          </button>

          {/* Résolus et sécurisés */}
          <button
            onClick={() => setFilter('resolus')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filter === 'resolus'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-navy-900 text-navy-600 dark:text-navy-200 border border-slate-200 dark:border-navy-800 hover:border-emerald-300'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Résolus & Sécurisés ({counts.resolus})</span>
          </button>
        </div>

        {/* Bouton Nouveau Post positionné à droite */}
        <button
          type="button"
          onClick={() => {
            if (userIsBanned) {
              setReportSuccessToast("Votre participation à l'espace communauté est suspendue suite à des signalements.");
              setTimeout(() => setReportSuccessToast(null), 4000);
              return;
            }
            setIsPostModalOpen(true);
          }}
          disabled={userIsBanned}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md transition-all flex-shrink-0 ${
            userIsBanned
              ? 'bg-slate-300 dark:bg-navy-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#0B2545] to-[#154275] hover:from-[#154275] hover:to-[#1e5899] text-white hover:shadow-lg active:scale-95 cursor-pointer'
          }`}
        >
          <MessageSquarePlus size={16} className={userIsBanned ? 'text-slate-400' : 'text-amber-400'} />
          <span>Nouveau post</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. FIL D'ACTUALITÉ : GRILLE 2 COLONNES AVEC ANIMATION DU J'AIME     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-3xl p-8 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-navy-900 flex items-center justify-center text-slate-400">
            <Users size={28} />
          </div>
          <h3 className="text-base font-black text-navy-900 dark:text-white">
            Aucun post dans cette section pour le moment
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Soyez le premier riverain à partager une mise à jour ou revenez sur l’onglet de tous les posts.
          </p>
          <button
            type="button"
            onClick={() => setFilter('tous')}
            className="px-4 py-2 rounded-xl bg-[#0B2545] text-white text-xs font-black hover:bg-[#154275] transition"
          >
            Afficher tous les posts
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredPosts.map((post) => {
            const isLiked = !!likesState[post.id];
            const areCommentsOpen = !!openComments[post.id];
            const currentLikes = getLikesCount(post.id, post.baseLikes);
            const currentViews = getViewsCount(post.id, post.baseViews);
            const postComments = [
              ...(post.comments || []),
              ...(commentsByPost[post.id] || []),
            ];

            return (
              <article
                key={post.id}
                onClick={() => handleIncrementView(post.id)}
                className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Haut de la carte : Auteur + Quartier + Badges Filtre & Statut */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-navy-50 dark:border-navy-800/80">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-navy-800 flex-shrink-0 border-2 border-slate-100 dark:border-navy-700">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-navy-900 dark:text-white truncate">
                          {post.author.name}
                        </span>
                        {post.author.role && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 truncate">
                            {post.author.role}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 text-[#CC131A] font-extrabold truncate">
                          <MapPin size={12} className="flex-shrink-0" />
                          {post.author.quartier}
                        </span>
                        <span>·</span>
                        <span className="truncate flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          {post.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges explicites selon le filtrage demandé */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {post.typePost === 'signalement' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-[#CC131A] dark:text-red-300 border border-red-200 dark:border-red-900">
                        <Camera size={12} />
                        Signalement terrain
                      </span>
                    )}

                    {post.typePost === 'entraide' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Flame size={12} />
                        Entraide & Mobilisation
                      </span>
                    )}

                    {post.typePost === 'resolu' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={12} />
                        Résolu & Sécurisé
                      </span>
                    )}

                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {post.statutLabel}
                    </span>
                  </div>
                </div>

                {/* Corps du post : Catégorie + Texte */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                        {post.categorie}
                      </span>
                      {post.titre && post.titre !== post.categorie && (
                        <span className="text-xs font-black text-navy-800 dark:text-slate-200">
                          {post.titre}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-navy-900 dark:text-slate-100 leading-relaxed font-medium">
                      {post.texte}
                    </p>
                  </div>

                  {/* Image du post si présente, ou bloc stylisé pour post sans image */}
                  <div className="mt-3.5">
                    {post.image ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImageModal(post.image);
                        }}
                        className="relative w-full h-48 sm:h-56 bg-slate-100 dark:bg-navy-950 rounded-2xl overflow-hidden cursor-pointer group border border-navy-50 dark:border-navy-800 shadow-xs"
                      >
                        <img
                          src={post.image}
                          alt={post.texte}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1.5 backdrop-blur-2xs">
                          <Eye size={16} />
                          <span>Agrandir la photo</span>
                        </div>
                      </div>
                    ) : (
                      /* Format typographique moderne pour publication textuelle sans photo */
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-slate-50 dark:from-navy-900/60 dark:to-navy-950/40 border-l-4 border-[#0B2545] dark:border-blue-400 border-y border-r border-slate-200/80 dark:border-navy-800 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#0B2545] dark:text-blue-300 flex items-center justify-center flex-shrink-0">
                          <Droplets size={18} />
                        </div>
                        <p className="text-xs text-navy-700 dark:text-slate-300 leading-snug">
                          <span className="font-bold">Point de situation sans photo</span> · Partagé pour coordination et maintien de la vigilance riveraine.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* BARRE D'ACTIONS SOCIALES AVEC COULEURS ET ANIMATION ROUGE       */}
                {/* Clic isolé strictement sur le post avec e.stopPropagation()    */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="px-3.5 py-3 sm:px-4 border-t border-navy-50 dark:border-navy-800/80 bg-slate-50/70 dark:bg-navy-900/40 flex items-center justify-between gap-1.5 flex-wrap"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {/* 1. Bouton CŒURS / J'AIME avec animation rouge et isolation stricte du post */}
                    <button
                      type="button"
                      aria-label="J'aime le post"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(post.id);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-300 active:scale-90 cursor-pointer shadow-xs select-none ${
                        isLiked
                          ? 'bg-rose-600 text-white border border-rose-600 shadow-md ring-2 ring-rose-400 dark:ring-rose-800 scale-[1.02]'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60 dark:hover:bg-rose-900/60'
                      }`}
                    >
                      <Heart
                        size={14}
                        className={`transition-all duration-300 ${
                          isLiked
                            ? 'fill-white text-white scale-125 animate-pulse'
                            : 'fill-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}
                      />
                      <span>J’aime</span>
                      <span
                        className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-black transition-colors ${
                          isLiked
                            ? 'bg-white/20 text-white'
                            : 'bg-rose-200/70 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200'
                        }`}
                      >
                        {currentLikes}
                      </span>
                    </button>

                    {/* 2. Bouton VUES / EXPLORATIONS (Bleu / Cyan lumineux interactif) */}
                    <button
                      type="button"
                      aria-label="Nombre d'explorations du post"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleIncrementView(post.id);
                      }}
                      title="Explorations : personnes ayant consulté ce post"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer shadow-xs bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60 dark:hover:bg-sky-900/60"
                    >
                      <Eye size={14} className="text-sky-600 dark:text-sky-400" />
                      <span>Vues</span>
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-black bg-sky-200/70 dark:bg-sky-900/70 text-sky-800 dark:text-sky-200">
                        {currentViews}
                      </span>
                    </button>

                    {/* 3. Bouton COMMENTAIRES / AVIS (Ambre / Or chaleureux interactif) */}
                    <button
                      type="button"
                      aria-label="Commentaires et avis riverains"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer shadow-xs ${
                        areCommentsOpen
                          ? 'bg-amber-500 text-white border border-amber-500 shadow-md ring-2 ring-amber-300 dark:ring-amber-900/50'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 dark:hover:bg-amber-900/60'
                      }`}
                    >
                      <MessageCircle
                        size={14}
                        className={areCommentsOpen ? 'text-white' : 'text-amber-600 dark:text-amber-400'}
                      />
                      <span>Avis</span>
                      <span
                        data-testid={`comments-count-${post.id}`}
                        className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-black transition-all ${
                          areCommentsOpen
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-200/70 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200'
                        }`}
                      >
                        {postComments.length}
                      </span>
                    </button>
                  </div>

                  {/* 4. Bouton PARTAGER (Violet / Pourpre élégant interactif) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 4. Bouton PARTAGER (Violet / Pourpre élégant interactif) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(post);
                      }}
                      title="Partager ce post avec les voisins"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer shadow-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60 dark:hover:bg-purple-900/60"
                    >
                      {copiedShareId === post.id ? (
                        <>
                          <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-700 dark:text-emerald-300">Copié</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={14} className="text-purple-600 dark:text-purple-400" />
                          <span>Partager</span>
                        </>
                      )}
                    </button>

                    {/* 5. Bouton SIGNALER UN ABUS (Flag) pour modération citoyenne */}
                    <button
                      type="button"
                      aria-label="Signaler ce post"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (reportedIds[post.id]) return;
                        setReportingItem({
                          targetId: post.id,
                          targetType: 'post',
                          authorName: post.author.name,
                          textSnippet: post.texte,
                        });
                      }}
                      title={reportedIds[post.id] ? "Post déjà signalé pour modération" : "Signaler un contenu inapproprié ou abusif"}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs ${
                        reportedIds[post.id]
                          ? 'bg-slate-100 dark:bg-navy-800 text-slate-400 border border-slate-200 dark:border-navy-700 cursor-default'
                          : 'bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-red-600 border border-slate-200 dark:border-navy-800 dark:bg-navy-900/40 dark:text-slate-400 dark:hover:text-red-400'
                      }`}
                    >
                      <Flag size={13} className={reportedIds[post.id] ? 'text-slate-400' : 'text-slate-400 group-hover:text-red-500'} />
                      <span className="hidden sm:inline">{reportedIds[post.id] ? 'Signalé' : 'Signaler'}</span>
                    </button>
                  </div>
                </div>

                {/* Tiroir des commentaires interactif */}
                {areCommentsOpen && (
                  <div className="p-4 border-t border-navy-100 dark:border-navy-800 bg-slate-50/80 dark:bg-navy-950/50 space-y-3">
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {postComments.length > 0 ? (
                        postComments.map((c) => (
                          <div key={c.id} className="p-2.5 rounded-xl bg-white dark:bg-navy-800 text-xs border border-slate-200/60 dark:border-navy-700">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-1">
                              <span>{c.author}</span>
                              <div className="flex items-center gap-2">
                                <span>{c.time}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (reportedIds[c.id]) return;
                                    setReportingItem({
                                      targetId: c.id,
                                      targetType: 'commentaire',
                                      authorName: c.author,
                                      textSnippet: c.text,
                                    });
                                  }}
                                  title="Signaler ce commentaire"
                                  className={`p-1 rounded-md transition ${
                                    reportedIds[c.id]
                                      ? 'text-slate-300 dark:text-slate-600'
                                      : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50'
                                  }`}
                                >
                                  <Flag size={11} />
                                </button>
                              </div>
                            </div>
                            <p className="text-navy-800 dark:text-slate-200 font-medium">{c.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-2">
                          Aucun commentaire pour le moment. Soyez le premier à répondre !
                        </p>
                      )}
                    </div>

                    <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        placeholder="Ajouter une précision ou proposer de l'aide..."
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B2545]"
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[post.id]?.trim()}
                        className="p-2 rounded-xl bg-[#0B2545] text-white disabled:opacity-40 transition active:scale-95 cursor-pointer"
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
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. POPUP MODALE : NOUVEAU POST COMMUNAUTAIRE (DURABLE)              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isPostModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsPostModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header de la modale */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0B2545] text-white flex items-center justify-center">
                  <MessageSquarePlus size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-navy-900 dark:text-white">
                    Nouveau post communautaire
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Publication durable · Visible plusieurs jours par les riverains
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-navy-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Note d'information distinction Story vs Post */}
            <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-navy-900/60 border border-blue-100 dark:border-navy-700 flex items-start gap-2.5">
              <Info size={16} className="text-[#0B2545] dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-navy-700 dark:text-slate-300 leading-relaxed">
                Contrairement aux <span className="font-bold">Stories éphémères (24h)</span>, ce <span className="font-bold">Post</span> reste visible sur le fil pour permettre le suivi des ruelles et l’organisation de l’entraide.
              </p>
            </div>

            {/* Formulaire de publication */}
            <form onSubmit={handleSubmitModalPost} className="space-y-4">
              {/* Type de post adapté aux 3 catégories de filtrage */}
              <div>
                <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Type de publication
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('signalement')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      modalType === 'signalement'
                        ? 'border-[#CC131A] bg-red-50 dark:bg-red-950/40 text-[#CC131A] font-black'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Camera size={16} />
                    <span className="text-[11px] leading-tight">Signalement terrain</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('entraide')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      modalType === 'entraide'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-black'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Flame size={16} />
                    <span className="text-[11px] leading-tight">Entraide & Mobilisation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('resolu')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      modalType === 'resolu'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span className="text-[11px] leading-tight">Résolu & Sécurisé</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Votre observation ou message
                </label>
                <textarea
                  value={modalPostText}
                  onChange={(e) => setModalPostText(e.target.value)}
                  placeholder="Que se passe-t-il dans votre ruelle ? Décrivez l'état de l'eau, les besoins en sacs de sable ou l'avancement..."
                  rows={3}
                  required
                  className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Quartier
                  </label>
                  <select
                    value={modalQuartier}
                    onChange={(e) => setModalQuartier(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-bold"
                  >
                    <option value="Ndakhane (Thiaroye)">📍 Ndakhane Cuvette</option>
                    <option value="Thiaroye Plage">📍 Thiaroye Plage</option>
                    <option value="Thiaroye Gare">📍 Thiaroye Gare</option>
                    <option value="CEM Thiaroye 44">📍 CEM Thiaroye 44</option>
                    <option value="Thiaroye Minam">📍 Thiaroye Minam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Catégorie
                  </label>
                  <select
                    value={modalCategorie}
                    onChange={(e) => setModalCategorie(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-bold"
                  >
                    {(CATEGORIES_BY_TYPE[modalType] || []).map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sélection optionnelle d'image */}
              <div>
                <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Illustration de la situation (Optionnel)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PHOTO_PRESETS.map((p) => {
                    const isSelected = modalPhotoChoice === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setModalPhotoChoice(p.id)}
                        className={`p-2 rounded-xl border text-left flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0B2545] dark:border-blue-400 bg-blue-50 dark:bg-blue-950/40 text-[#0B2545] dark:text-white font-black ring-2 ring-[#0B2545]/20'
                            : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900/40 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {p.url ? (
                          <div className="w-full h-14 rounded-lg overflow-hidden bg-slate-200">
                            <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-14 rounded-lg bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-400">
                            <ImageIcon size={20} />
                          </div>
                        )}
                        <span className="text-[11px] truncate w-full text-center">
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message d'erreur de modération pour le post */}
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-[#CC131A] dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Actions de validation */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsPostModalOpen(false);
                    setModalError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-100 dark:hover:bg-navy-800 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!modalPostText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#154275] text-white text-xs sm:text-sm font-black disabled:opacity-50 transition active:scale-95 shadow-md cursor-pointer"
                >
                  <Send size={14} />
                  <span>Publier le post</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. POPUP MODALE : CRÉATION D'UNE STORY ÉPHÉMÈRE (24H DIRECT)       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isStoryModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            setIsStoryModalOpen(false);
            setStoryError(null);
          }}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header de la modale */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-navy-900 dark:text-white">
                    Votre Story éphémère (24h)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Flash terrain visible 24 heures par tous les riverains
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsStoryModalOpen(false);
                  setStoryError(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-navy-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulaire de création de Story */}
            <form onSubmit={handleCreateStory} className="space-y-4">
              {/* Choix du mode : Story Texte seul ou Story Photo */}
              <div>
                <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Format de votre Story
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStoryMode('texte')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-2 ${
                      storyMode === 'texte'
                        ? 'border-[#0B2545] dark:border-blue-400 bg-blue-50 dark:bg-blue-950/40 text-[#0B2545] dark:text-white font-black'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <AlignLeft size={16} />
                    <span className="text-xs">Story Texte seul</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStoryMode('photo')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-2 ${
                      storyMode === 'photo'
                        ? 'border-[#CC131A] bg-red-50 dark:bg-red-950/40 text-[#CC131A] font-black'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Camera size={16} />
                    <span className="text-xs">Story avec Photo</span>
                  </button>
                </div>
              </div>

              {/* Si mode texte : Palette de fonds dégradés stylés */}
              {storyMode === 'texte' && (
                <div>
                  <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Palette size={14} className="text-amber-500" />
                    <span>Ambiance & Dégradé d’arrière-plan</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STORY_GRADIENTS.map((grad) => {
                      const isSelected = storyBgGradient === grad.class;
                      return (
                        <button
                          key={grad.id}
                          type="button"
                          onClick={() => setStoryBgGradient(grad.class)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                            isSelected
                              ? 'border-white ring-2 ring-[#0B2545] dark:ring-blue-400 font-bold'
                              : 'border-slate-200 dark:border-navy-700 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg ${grad.previewBg} shadow-xs flex-shrink-0`} />
                          <span className="text-xs text-navy-900 dark:text-white truncate">
                            {grad.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Si mode photo : Choix de la photo terrain */}
              {storyMode === 'photo' && (
                <div>
                  <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Photo du terrain
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PHOTO_PRESETS.filter((p) => p.url).map((p) => {
                      const isSelected = storyPhotoChoice === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setStoryPhotoChoice(p.id)}
                          className={`p-1.5 rounded-xl border text-left flex flex-col items-center gap-1 transition cursor-pointer ${
                            isSelected
                              ? 'border-[#CC131A] bg-red-50 dark:bg-red-950/40 font-black ring-2 ring-red-400'
                              : 'border-slate-200 dark:border-navy-700 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="w-full h-14 rounded-lg overflow-hidden bg-slate-200">
                            <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] text-center truncate w-full">
                            {p.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Texte du message */}
              <div>
                <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Votre observation terrain (Flash 24h)
                </label>
                <textarea
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="Ex: Eau en baisse rue 14, ou passage praticable sur les passerelles en bois..."
                  rows={3}
                  required
                  className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B2545] resize-none"
                />
              </div>

              {/* Choix du quartier */}
              <div>
                <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Quartier concerné
                </label>
                <select
                  value={storyQuartier}
                  onChange={(e) => setStoryQuartier(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-bold"
                >
                  <option value="Ndakhane (Thiaroye)">📍 Ndakhane Cuvette</option>
                  <option value="Thiaroye Plage">📍 Thiaroye Plage</option>
                  <option value="Thiaroye Gare">📍 Thiaroye Gare</option>
                  <option value="CEM Thiaroye 44">📍 CEM Thiaroye 44</option>
                  <option value="Thiaroye Minam">📍 Thiaroye Minam</option>
                </select>
              </div>

              {/* Message d'erreur de modération pour la story */}
              {storyError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-[#CC131A] dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span>{storyError}</span>
                </div>
              )}

              {/* Actions de validation */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsStoryModalOpen(false);
                    setStoryError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-100 dark:hover:bg-navy-800 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!storyText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-black disabled:opacity-50 transition active:scale-95 shadow-md cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Partager ma story (24h)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 7. MODALE FULLSCREEN POUR LES STORIES : VUE DÉGAGÉE & TEXTE COMPACT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeStory && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            setActiveStory(null);
            setIsStoryTextExpanded(false);
          }}
        >
          <div
            className={`relative w-full max-w-sm sm:max-w-md h-[85vh] sm:h-[82vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/20 select-none ${
              activeStory.isTextStory || !activeStory.image
                ? `bg-gradient-to-br ${activeStory.gradientClass || 'from-[#0B2545] via-[#103565] to-slate-950'}`
                : 'bg-black'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Si story avec photo : photo en pleine page avec vignettes légères haut/bas pour laisser la photo visible à > 80% */}
            {activeStory.image && !activeStory.isTextStory && (
              <>
                <img
                  src={activeStory.image}
                  alt={activeStory.texte}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/85 pointer-events-none" />
              </>
            )}

            {/* Header de la Story : Barre de progression + Relais + Badge 24h */}
            <div className="relative z-20 p-4 space-y-3">
              <div className="w-full bg-white/30 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white h-full w-3/4 animate-pulse rounded-full" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={activeStory.avatar}
                    alt={activeStory.relais}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-white">{activeStory.relais}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold uppercase">
                        {activeStory.role || 'Citoyen'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                      <MapPin size={12} className="text-red-400" />
                      <span>{activeStory.quartier}</span>
                      <span>·</span>
                      <span>{activeStory.heure}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-rose-500/80 text-white">
                    <Timer size={11} />
                    {activeStory.expiration || '24h'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStory(null);
                      setIsStoryTextExpanded(false);
                    }}
                    className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Centre de la Story : Message en grand si story texte seule */}
            {(activeStory.isTextStory || !activeStory.image) ? (
              <div className="relative z-20 p-6 my-auto text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center text-amber-300 backdrop-blur-sm">
                  <Sparkles size={24} />
                </div>
                <p className="text-lg sm:text-xl md:text-2xl font-black text-white leading-relaxed drop-shadow-md px-2">
                  « {activeStory.texte} »
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-extrabold text-white/80 bg-black/25 px-3 py-1 rounded-full">
                  <MapPin size={12} className="text-red-400" />
                  <span>{activeStory.quartier}</span>
                </div>
              </div>
            ) : (
              /* Zone centrale vide pour laisser la photo totalement dégagée et sans obstruction */
              <div className="flex-1" />
            )}

            {/* Bas de la Story : Capsule de texte compacte escamotable pour ne pas masquer la photo */}
            <div className="relative z-20 p-4 space-y-3">
              {activeStory.image && !activeStory.isTextStory && (
                <div className="p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 transition-all">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase">
                      <Sparkles size={12} />
                      <span>Observation terrain</span>
                    </div>
                    {/* Bouton pour plier / déplier le texte afin de contempler la photo */}
                    <button
                      type="button"
                      onClick={() => setIsStoryTextExpanded(!isStoryTextExpanded)}
                      className="inline-flex items-center gap-1 text-[10px] text-white/90 hover:text-white bg-white/15 px-2 py-0.5 rounded-full transition cursor-pointer"
                    >
                      <span>{isStoryTextExpanded ? 'Réduire' : 'Détails'}</span>
                      {isStoryTextExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                    </button>
                  </div>

                  <p
                    className={`text-xs text-white leading-relaxed font-medium transition-all ${
                      isStoryTextExpanded ? '' : 'line-clamp-2'
                    }`}
                  >
                    {activeStory.texte}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Link
                  to="/citoyen/signaler"
                  className="flex-1 py-2.5 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white text-xs font-black text-center shadow-lg transition active:scale-95"
                >
                  Confirmer à proximité
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setActiveStory(null);
                    setIsStoryTextExpanded(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 8. MODALE LIGHTBOX POUR AGRANDIR LA PHOTO D'UN POST                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <img
              src={previewImageModal}
              alt="Aperçu agrandi du signalement"
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 9. MODALE DE SIGNALEMENT CITOYEN POUR MODÉRATION                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {reportingItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setReportingItem(null)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-navy-800">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-[#CC131A] dark:text-red-400 flex items-center justify-center flex-shrink-0">
                <Flag size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-navy-900 dark:text-white">
                  Signaler un abus ou propos déplacés
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Auteur : {reportingItem.authorName} ({reportingItem.targetType})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Mbeund-Mi est un espace d'entraide et de solidarité pour les riverains. Les contenus insultants, vulgaires ou haineux seront vérifiés par l'équipe de modération.
            </p>

            {reportingItem.textSnippet && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-navy-900 text-xs italic text-slate-700 dark:text-slate-300 line-clamp-2 border border-slate-200 dark:border-navy-800">
                « {reportingItem.textSnippet} »
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                Motif du signalement
              </label>
              <select
                value={reportingReason}
                onChange={(e) => setReportingReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-bold"
              >
                <option value="Propos inappropriés / agressifs">Propos inappropriés ou agressifs</option>
                <option value="Insultes ou langage haineux">Insultes ou langage vulgaire (français/wolof)</option>
                <option value="Fausse alerte ou désinformation">Fausse alerte / Désinformation</option>
                <option value="Spam ou contenu hors sujet">Spam ou publicité non liée</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
              <button
                type="button"
                onClick={() => setReportingItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-navy-800 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReport}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
              >
                <Flag size={14} />
                <span>Confirmer le signalement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </CitizenShell>
  );
}
