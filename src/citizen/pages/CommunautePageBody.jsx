import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  Tag,
  Upload,
  Trash2,
  MoreVertical,
  Video,
  Volume2,
  VolumeX,
  Circle,
  Square,
  RefreshCw,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import { useAuth } from '../../auth/AuthContext';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';
import { useMySignalements } from '../../shared/hooks/useMySignalements';
import { STORIES_COMMUNAUTE, COMMUNAUTE_POSTS } from '../../shared/data/riverainsData';
import { sanitizePublicText, sanitizePublicAuthor } from '../../shared/utils/sanitizer';
import { getPublicAvatar } from '../../shared/utils/avatarResolver';
import { checkContentModeration, isUserBanned, reportContent } from '../../shared/utils/moderation';
import { formatCompactDate } from '../../shared/utils/dateFormatter';

export default function CommunautePageBody() {
  const navigate = useNavigate();
  const { username, user } = useAuth();
  const nomCitoyen = user?.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : (username || 'Citoyen');

  // Récupération des signalements citoyens réels depuis le backend Django
  const { data: signalementsData } = useSignalementsApercu();
  // Récupération des signalements spécifiques au citoyen connecté (tous statuts)
  const { data: mySignalementsData } = useMySignalements();

  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get('postId') || searchParams.get('signalementId');
  const [highlightedPostId, setHighlightedPostId] = useState(null);

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
  const [modalMediaFile, setModalMediaFile] = useState(null);
  const [modalMediaPreview, setModalMediaPreview] = useState(null);
  const [modalMediaType, setModalMediaType] = useState(null); // 'image' | 'video'
  const [modalError, setModalError] = useState(null);
  const modalUploadRef = useRef(null);
  const modalCameraRef = useRef(null);

  const handleModalMediaFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setModalError("Le fichier est trop volumineux (25 Mo maximum).");
      return;
    }

    setModalError(null);
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setModalError("Format non supporté. Veuillez choisir une photo (JPG, PNG) ou une vidéo (MP4, WEBM).");
      return;
    }

    setModalMediaFile(file);
    setModalMediaType(isVideo ? 'video' : 'image');

    if (isVideo) {
      const videoUrl = URL.createObjectURL(file);
      setModalMediaPreview(videoUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setModalMediaPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // État de l'Espace Personnel du citoyen dans la communauté (Volet latéral / Option 1)
  const [isMySpaceOpen, setIsMySpaceOpen] = useState(false);
  const [mySpaceTab, setMySpaceTab] = useState('posts'); // 'posts' | 'stories'
  const [storyToDelete, setStoryToDelete] = useState(null);

  // État de la popup "Créer une Story éphémère (24h)" (Photo / Vidéo ou Texte seul)
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyMode, setStoryMode] = useState('texte'); // 'texte' | 'media'
  const [storyText, setStoryText] = useState('');
  const [storyQuartier, setStoryQuartier] = useState('Ndakhane (Thiaroye)');
  const [storyBgGradient, setStoryBgGradient] = useState('from-[#0B2545] via-[#103565] to-slate-950');
  const [storyMediaFile, setStoryMediaFile] = useState(null);
  const [storyMediaPreview, setStoryMediaPreview] = useState(null);
  const [storyMediaType, setStoryMediaType] = useState(null); // 'image' | 'video'
  const [storyError, setStoryError] = useState(null);
  const [isStoryTextExpanded, setIsStoryTextExpanded] = useState(false);
  const [isStoryVideoMuted, setIsStoryVideoMuted] = useState(true);
  const storyUploadRef = useRef(null);
  const storyCameraRef = useRef(null);

  // Gestion du viseur Caméra réelle en direct (Webcam / Capteur téléphone)
  const [liveCameraTarget, setLiveCameraTarget] = useState(null); // null | 'story' | 'post'
  const [liveFacingMode, setLiveFacingMode] = useState('environment'); // 'environment' | 'user'
  const [liveCaptureMode, setLiveCaptureMode] = useState(null); // null | 'photo' | 'video'
  const [isLiveRecording, setIsLiveRecording] = useState(false);
  const [liveRecordingSeconds, setLiveRecordingSeconds] = useState(0);
  const [liveCameraError, setLiveCameraError] = useState(null);
  const liveVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const stopLiveCamera = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
    setLiveCameraTarget(null);
    setLiveCaptureMode(null);
    setIsLiveRecording(false);
    setLiveRecordingSeconds(0);
    setLiveCameraError(null);
  };

  const startLiveCamera = async (target, facing = liveFacingMode, initialMode = null) => {
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setLiveCameraTarget(target);
    setLiveCaptureMode(initialMode);
    setLiveCameraError(null);
    setIsLiveRecording(false);
    setLiveRecordingSeconds(0);
    setLiveFacingMode(facing);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setLiveCameraError("L'accès direct à la caméra n'est pas supporté par ce navigateur. Vous pouvez utiliser le sélecteur ci-dessous ou importer un fichier.");
      return;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
      }

      mediaStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        try {
          await liveVideoRef.current.play();
        } catch {}
      }
    } catch {
      setLiveCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur ou utilisez le sélecteur ci-dessous.");
    }
  };

  const flipLiveCamera = () => {
    const nextFacing = liveFacingMode === 'environment' ? 'user' : 'environment';
    if (liveCameraTarget) {
      startLiveCamera(liveCameraTarget, nextFacing);
    }
  };

  const captureLivePhoto = () => {
    const video = liveVideoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (liveFacingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      if (liveCameraTarget === 'story') {
        setStoryMediaPreview(dataUrl);
        setStoryMediaType('image');
        setStoryMediaFile(null);
        setStoryError(null);
      } else if (liveCameraTarget === 'post') {
        setModalMediaPreview(dataUrl);
        setModalMediaType('image');
        setModalMediaFile(null);
        setModalError(null);
      }
    } catch (err) {
      console.error("Erreur capture photo :", err);
    } finally {
      stopLiveCamera();
    }
  };

  const startLiveVideoRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];

    let options = {};
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
      } else if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      }
    }

    try {
      const recorder = new MediaRecorder(mediaStreamRef.current, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (recordedChunksRef.current.length > 0) {
          const mimeType = recorder.mimeType || 'video/webm';
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const videoUrl = URL.createObjectURL(blob);

          if (liveCameraTarget === 'story') {
            setStoryMediaPreview(videoUrl);
            setStoryMediaType('video');
            setStoryMediaFile(blob);
            setStoryError(null);
          } else if (liveCameraTarget === 'post') {
            setModalMediaPreview(videoUrl);
            setModalMediaType('video');
            setModalMediaFile(blob);
            setModalError(null);
          }
        }
        stopLiveCamera();
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsLiveRecording(true);
      setLiveRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setLiveRecordingSeconds((prev) => {
          if (prev >= 29) {
            stopLiveVideoRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Erreur démarrage enregistrement vidéo :", err);
    }
  };

  const stopLiveVideoRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  };

  // Attachement du flux vidéo lors du rendu du composant vidéo
  useEffect(() => {
    if (liveCameraTarget && liveVideoRef.current && mediaStreamRef.current) {
      if (liveVideoRef.current.srcObject !== mediaStreamRef.current) {
        liveVideoRef.current.srcObject = mediaStreamRef.current;
        liveVideoRef.current.play().catch(() => {});
      }
    }
  });

  // Nettoyage au démontage du composant
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStoryMediaFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setStoryError("Le fichier est trop volumineux (25 Mo maximum).");
      return;
    }

    setStoryError(null);
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setStoryError("Format non supporté. Veuillez choisir une photo (JPG, PNG) ou une vidéo (MP4, WEBM).");
      return;
    }

    setStoryMediaFile(file);
    setStoryMediaType(isVideo ? 'video' : 'image');

    if (isVideo) {
      const videoUrl = URL.createObjectURL(file);
      setStoryMediaPreview(videoUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setStoryMediaPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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

  // Soutiens et validations citoyennes des stories pour prioriser les quartiers en danger
  const [storySupports, setStorySupports] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_story_supports');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleSupportStory = (storyId) => {
    if (!storyId) return;
    const isAlreadySupported = !!storySupports[`user_${storyId}`];
    setStorySupports((prev) => {
      const currentCount = prev[storyId] || 0;
      const next = {
        ...prev,
        [storyId]: isAlreadySupported ? Math.max(0, currentCount - 1) : currentCount + 1,
        [`user_${storyId}`]: !isAlreadySupported,
      };
      try {
        localStorage.setItem('mbeund_mi_story_supports', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (!isAlreadySupported) {
      setReportSuccessToast("Merci ! Votre confirmation soutient ce riverain et aide à prioriser les secours dans ce quartier.");
      setTimeout(() => setReportSuccessToast(null), 3500);
    }
  };

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
  // Posts créés ou partagés localement par le citoyen (fusion des posts créés et signalements partagés)
  const [userPosts, setUserPosts] = useState(() => {
    try {
      const savedUserPosts = JSON.parse(localStorage.getItem('mbeund_mi_user_community_posts') || '[]');
      const savedV1Posts = JSON.parse(localStorage.getItem('mbeund_mi_community_posts_v1') || '[]');
      const deletedMap = JSON.parse(localStorage.getItem('mbeund_mi_community_deleted_post_ids') || '{}');
      const privateMap = JSON.parse(localStorage.getItem('mbeund_mi_private_signalement_ids') || '{}');

      // Conversion des posts v1 (créés depuis la page Signaler) s'ils ne sont pas déjà dans savedUserPosts
      const existingIds = new Set(savedUserPosts.map((p) => p.id));
      const convertedV1 = [];

      savedV1Posts.forEach((p) => {
        if (!p?.id || existingIds.has(p.id)) return;
        if (deletedMap[p.id] || privateMap[p.id] || (p.signalementId && (deletedMap[p.signalementId] || privateMap[p.signalementId]))) return;

        convertedV1.push({
          id: p.id,
          rawBackendId: p.signalementId,
          signalementId: p.signalementId,
          isUserPost: true,
          isBackendSignalement: true,
          typePost: 'signalement',
          badgeFiltre: 'Signalement terrain',
          author: {
            name: p.authorName || 'Citoyen',
            avatar: p.authorAvatar || getPublicAvatar({ name: p.authorName, id: p.id }),
            quartier: p.zone || 'Thiaroye-sur-Mer',
            role: p.authorRole || 'Résident',
          },
          date: p.timestamp || 'Récemment',
          dureeType: 'Post durable',
          categorie: p.categorie || 'Signalement terrain',
          titre: p.categorie || 'Observation terrain',
          texte: p.content || '',
          image: p.photoUrl || null,
          statut: 'en_cours',
          statutLabel: 'Signalement actif · Traitement requis',
          baseLikes: p.likesCount || 1,
          baseViews: 1,
          comments: p.comments || [],
        });
      });

      return [...savedUserPosts, ...convertedV1].filter(
        (p) => !deletedMap[p.id] && (!p.rawBackendId || !deletedMap[p.rawBackendId])
      );
    } catch {
      return [];
    }
  });

  // Sauvegarde des posts utilisateur dans le localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mbeund_mi_user_community_posts', JSON.stringify(userPosts));
    } catch {}
  }, [userPosts]);

  // Ensemble des identifiants des signalements appartenant au citoyen connecté
  const mySignalementsIdSet = useMemo(() => {
    const set = new Set();
    const list = mySignalementsData?.results ?? (Array.isArray(mySignalementsData) ? mySignalementsData : []);
    list.forEach((s) => {
      if (s?.id != null) {
        set.add(String(s.id));
        set.add(`backend-sig-${s.id}`);
        set.add(`post-sig-${s.id}`);
        set.add(`my-sig-${s.id}`);
      }
    });
    return set;
  }, [mySignalementsData]);

  // Menu 3 points d'options ouvert (identifiant du post dont le dropdown est actif)
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  // Post sélectionné pour confirmation de suppression de l'espace Communauté
  const [postToDelete, setPostToDelete] = useState(null);

  // Fermeture automatique du menu 3 points au clic en dehors
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenMenuPostId(null);
    };
    if (openMenuPostId) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [openMenuPostId]);

  const [copiedShareId, setCopiedShareId] = useState(null);
  const [justLikedPostId, setJustLikedPostId] = useState(null);
  const [justConfirmedPostId, setJustConfirmedPostId] = useState(null);
  const likeFeedbackTimerRef = useRef(null);
  const confirmFeedbackTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (likeFeedbackTimerRef.current) clearTimeout(likeFeedbackTimerRef.current);
      if (confirmFeedbackTimerRef.current) clearTimeout(confirmFeedbackTimerRef.current);
    };
  }, []);

  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Verrouillage du scroll d'arrière-plan lorsque Mon Espace Personnel ou une modale est ouvert(e)
  const isAnyOverlayActive =
    isMySpaceOpen ||
    isPostModalOpen ||
    isStoryModalOpen ||
    !!activeStory ||
    !!liveCameraTarget ||
    !!reportingItem ||
    !!previewImageModal ||
    !!postToDelete ||
    !!storyToDelete;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isAnyOverlayActive) {
      const originalOverflow = document.body.style.overflow;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = '';
      };
    }
  }, [isAnyOverlayActive]);

  // Détection stricte de l'appartenance d'un post au citoyen connecté
  const isPostOwner = (post) => {
    if (!post) return false;
    if (post.isUserPost) return true;
    if (typeof post.id === 'string' && (post.id.startsWith('user-') || post.id.startsWith('post-sig-') || post.id.startsWith('my-sig-') || post.id.startsWith('shared-sig-'))) {
      return true;
    }
    if (userPosts.some((up) => up.id === post.id || (post.rawBackendId && up.rawBackendId === post.rawBackendId))) {
      return true;
    }

    // Détection via les identifiants de signalements retournés pour ce compte
    if (post.rawBackendId && mySignalementsIdSet.has(String(post.rawBackendId))) return true;
    if (post.signalementId && mySignalementsIdSet.has(String(post.signalementId))) return true;
    if (mySignalementsIdSet.has(String(post.id))) return true;

    try {
      const myPostIds = JSON.parse(localStorage.getItem('mbeund_mi_my_post_ids') || '{}');
      if (
        myPostIds[post.id] ||
        (post.rawBackendId && myPostIds[post.rawBackendId]) ||
        (post.rawBackendId && myPostIds[`backend-sig-${post.rawBackendId}`]) ||
        (post.signalementId && myPostIds[post.signalementId])
      ) {
        return true;
      }
    } catch {}

    if (nomCitoyen && post.author?.name && post.author.name.toLowerCase() === nomCitoyen.toLowerCase()) {
      return true;
    }
    if (username && post.author?.name && post.author.name.toLowerCase().includes(username.toLowerCase())) {
      return true;
    }
    if (user?.prenom && post.author?.name && post.author.name.toLowerCase().includes(user.prenom.toLowerCase())) {
      return true;
    }

    return false;
  };

  // Suppression ciblée d'une publication par son auteur (exclusivement de l'espace Communauté)
  // Aucun impact sur l'espace d'administration / autorité
  const handleDeletePost = (post) => {
    if (!post) return;
    const postId = post.id;

    // Retrait immédiat de l'état local des posts de l'utilisateur
    setUserPosts((prev) => prev.filter((p) => p.id !== postId && (!post.rawBackendId || p.rawBackendId !== post.rawBackendId)));

    // Mémorisation dans la liste des posts retirés de la communauté
    try {
      const deletedMap = JSON.parse(localStorage.getItem('mbeund_mi_community_deleted_post_ids') || '{}');
      deletedMap[postId] = true;
      if (post.rawBackendId) {
        deletedMap[post.rawBackendId] = true;
        deletedMap[`backend-sig-${post.rawBackendId}`] = true;
        deletedMap[`post-sig-${post.rawBackendId}`] = true;
        deletedMap[`my-sig-${post.rawBackendId}`] = true;
      }
      if (post.signalementId) {
        deletedMap[post.signalementId] = true;
        deletedMap[`backend-sig-${post.signalementId}`] = true;
        deletedMap[`post-sig-${post.signalementId}`] = true;
        deletedMap[`my-sig-${post.signalementId}`] = true;
      }
      if (post.texte) deletedMap[post.texte.trim()] = true;
      localStorage.setItem('mbeund_mi_community_deleted_post_ids', JSON.stringify(deletedMap));

      // Mémorisation dans les signalements privés si le post provenait d'un signalement
      const privates = JSON.parse(localStorage.getItem('mbeund_mi_private_signalement_ids') || '{}');
      privates[postId] = true;
      if (post.rawBackendId) {
        privates[post.rawBackendId] = true;
        privates[`backend-sig-${post.rawBackendId}`] = true;
        privates[`post-sig-${post.rawBackendId}`] = true;
        privates[`my-sig-${post.rawBackendId}`] = true;
      }
      if (post.signalementId) {
        privates[post.signalementId] = true;
      }
      if (post.texte) privates[post.texte.trim()] = true;
      localStorage.setItem('mbeund_mi_private_signalement_ids', JSON.stringify(privates));

      // Nettoyage immédiat du localStorage des posts utilisateurs
      const savedUserPosts = JSON.parse(localStorage.getItem('mbeund_mi_user_community_posts') || '[]');
      const filtered = savedUserPosts.filter((p) => p.id !== postId && (!post.rawBackendId || p.rawBackendId !== post.rawBackendId));
      localStorage.setItem('mbeund_mi_user_community_posts', JSON.stringify(filtered));

      // Nettoyage de community_posts_v1
      const savedV1 = JSON.parse(localStorage.getItem('mbeund_mi_community_posts_v1') || '[]');
      const filteredV1 = savedV1.filter((p) => p.id !== postId && p.signalementId !== post.rawBackendId && p.signalementId !== post.signalementId);
      localStorage.setItem('mbeund_mi_community_posts_v1', JSON.stringify(filteredV1));

      // Nettoyage de my_post_ids
      const myPostIds = JSON.parse(localStorage.getItem('mbeund_mi_my_post_ids') || '{}');
      delete myPostIds[postId];
      if (post.rawBackendId) {
        delete myPostIds[post.rawBackendId];
        delete myPostIds[`backend-sig-${post.rawBackendId}`];
        delete myPostIds[`post-sig-${post.rawBackendId}`];
        delete myPostIds[`my-sig-${post.rawBackendId}`];
      }
      if (post.signalementId) {
        delete myPostIds[post.signalementId];
      }
      localStorage.setItem('mbeund_mi_my_post_ids', JSON.stringify(myPostIds));
    } catch {}

    setOpenMenuPostId(null);
    setPostToDelete(null);
    setReportSuccessToast("Publication retirée de l'espace Communauté. Les signalements officiels transmis aux autorités restent inchangés.");
    setTimeout(() => {
      setReportSuccessToast(null);
    }, 4000);
  };

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

  // Partages gérés en local avec persistance
  const [sharesState, setSharesState] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_community_shares');
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

  useEffect(() => {
    try {
      localStorage.setItem('mbeund_mi_community_shares', JSON.stringify(sharesState));
    } catch {}
  }, [sharesState]);

  // Confirmations citoyennes "C'est vrai" (attestations terrain persistées)
  const [confirmationsState, setConfirmationsState] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_community_confirmations');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mbeund_mi_community_confirmations', JSON.stringify(confirmationsState));
    } catch {}
  }, [confirmationsState]);

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

  // Options de catégories selon le type de post sélectionné (sans émojis, stylisé par composants d'icônes React)
  const CATEGORIES_BY_TYPE = {
    signalement: [
      { value: 'Eau stagnante', label: 'Eau stagnante' },
      { value: 'Caniveau bouché', label: 'Caniveau bouché' },
      { value: 'Pompage requis', label: 'Pompage requis' },
      { value: 'Reflux ruissellement', label: 'Reflux ruissellement' },
    ],
    entraide: [
      { value: 'Entraide sacs de sable', label: 'Entraide sacs de sable' },
      { value: 'Volontaires & Bénévoles', label: 'Volontaires & Bénévoles' },
      { value: 'Besoin d’outils (pelles/brouettes)', label: 'Besoin d’outils (pelles/brouettes)' },
      { value: 'Soutien aux concessions', label: 'Soutien aux concessions' },
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

  // Avatar haute définition du citoyen connecté
  const currentUserAvatar = useMemo(() => {
    return user?.avatar || getPublicAvatar({ name: nomCitoyen, id: 'current-citizen-avatar', context: 'Citoyen connecté' });
  }, [user?.avatar, nomCitoyen]);

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

    // Récupération des signalements que le citoyen a choisi de ne PAS partager sur la communauté (autorités uniquement)
    let privateMap = {};
    try {
      privateMap = JSON.parse(localStorage.getItem('mbeund_mi_private_signalement_ids') || '{}');
    } catch {}

    let deletedPostsMap = {};
    try {
      deletedPostsMap = JSON.parse(localStorage.getItem('mbeund_mi_community_deleted_post_ids') || '{}');
    } catch {}

    rawFeatures.forEach((feat, idx) => {
      const p = feat.properties || feat;
      const isResolu = !!p.valide;
      // IMPORTANT : Utilise feat.id ou p.id ou fallback avec index pour garantir l'unicité stricte
      const uniqueRawId = feat.id ?? p.id ?? feat.pk ?? p.pk ?? `idx-${idx}`;
      const sigId = `backend-sig-${uniqueRawId}`;

      // Si le citoyen a décoché le partage communautaire ou supprimé le post de la communauté, ce signalement reste uniquement pour les autorités
      if (
        privateMap[uniqueRawId] ||
        privateMap[feat.id] ||
        privateMap[p.id] ||
        (p.description && privateMap[p.description.trim()]) ||
        deletedPostsMap[sigId] ||
        deletedPostsMap[uniqueRawId] ||
        (p.description && deletedPostsMap[p.description.trim()])
      ) {
        return;
      }

      // Nettoyage strict RGPD / Confidentialité : suppression des [SMS de 221...], numéros de tél et mentions privées
      const rawAuthor = p.citoyen_prenom ? `${p.citoyen_prenom} ${p.citoyen_nom || ''}`.trim() : null;
      const cleanAuthor = sanitizePublicAuthor(rawAuthor, 'Sentinelle Citoyenne');
      const cleanTitre = sanitizePublicText(p.titre || p.categorie || 'Observation terrain');
      const cleanTexte = sanitizePublicText(p.description || 'Montée des eaux observée sur la voie publique.');
      const uniqueAvatar = getPublicAvatar({ name: cleanAuthor, id: sigId, context: cleanTexte });

      backendItems.push({
        id: sigId,
        rawBackendId: uniqueRawId,
        isBackendSignalement: true,
        typePost: isResolu ? 'resolu' : 'signalement',
        badgeFiltre: isResolu ? 'Résolu & Sécurisé' : 'Signalement terrain',
        author: {
          name: cleanAuthor,
          avatar: uniqueAvatar,
          quartier: p.citoyen_quartier || p.quartier || 'Thiaroye-sur-Mer',
          role: 'Résident',
        },
        dateRaw: p.date_creation || null,
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

    // 1. bis. Signalements du citoyen connecté (tous statuts : en attente ou validés)
    const myApiList = mySignalementsData?.results ?? (Array.isArray(mySignalementsData) ? mySignalementsData : []);
    const userOwnedSignalementPosts = [];

    myApiList.forEach((s) => {
      const sigRawId = s.id;
      const sigId = `my-sig-${sigRawId}`;

      if (
        deletedPostsMap[sigId] ||
        deletedPostsMap[sigRawId] ||
        deletedPostsMap[`backend-sig-${sigRawId}`] ||
        deletedPostsMap[`post-sig-${sigRawId}`] ||
        privateMap[sigRawId] ||
        privateMap[sigId] ||
        privateMap[`backend-sig-${sigRawId}`] ||
        (s.description && (deletedPostsMap[s.description.trim()] || privateMap[s.description.trim()]))
      ) {
        return;
      }

      const alreadyInBackend = backendItems.some((b) => String(b.rawBackendId) === String(sigRawId));
      const alreadyInUserPosts = userPosts.some(
        (u) => String(u.rawBackendId) === String(sigRawId) || String(u.signalementId) === String(sigRawId) || String(u.id) === String(sigId)
      );
      if (alreadyInBackend || alreadyInUserPosts) {
        return;
      }

      const isResolu = !!s.valide;
      const cleanAuthor = sanitizePublicAuthor(nomCitoyen, 'Citoyen');
      const cleanTitre = sanitizePublicText(s.categorie_display || s.categorie || 'Observation terrain');
      const cleanTexte = sanitizePublicText(s.description || 'Montée des eaux observée sur la voie publique.');
      const uniqueAvatar = currentUserAvatar || getPublicAvatar({ name: cleanAuthor, id: sigId, context: cleanTexte });

      userOwnedSignalementPosts.push({
        id: sigId,
        rawBackendId: sigRawId,
        signalementId: sigRawId,
        isUserPost: true,
        isBackendSignalement: true,
        typePost: isResolu ? 'resolu' : 'signalement',
        badgeFiltre: isResolu ? 'Résolu & Sécurisé' : 'Signalement terrain',
        author: {
          name: cleanAuthor,
          avatar: uniqueAvatar,
          quartier: s.citoyen_quartier || s.quartier || 'Thiaroye-sur-Mer',
          role: 'Résident',
        },
        dateRaw: s.date_creation || null,
        date: s.date_creation
          ? new Date(s.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          : 'Récemment',
        dureeType: 'Post durable',
        categorie: s.categorie_display || s.categorie || 'Inondation',
        titre: cleanTitre,
        texte: cleanTexte,
        image: s.photo || null,
        statut: isResolu ? 'resolu' : 'en_cours',
        statutLabel: isResolu ? 'Vérifié par la mairie' : 'En attente de traitement',
        baseLikes: 1,
        baseViews: 1,
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

    const combined = [...userPosts, ...userOwnedSignalementPosts, ...backendItems, ...riverainsItems];
    return combined.filter(
      (post) =>
        !deletedPostsMap[post.id] &&
        (!post.rawBackendId || !deletedPostsMap[post.rawBackendId]) &&
        (!post.rawBackendId || !deletedPostsMap[`backend-sig-${post.rawBackendId}`]) &&
        (!post.signalementId || !deletedPostsMap[post.signalementId]) &&
        (!post.texte || !deletedPostsMap[post.texte.trim()])
    );
  }, [signalementsData, mySignalementsData, userPosts]);

  // Prédicats de filtrage stricts et mutuellement exclusifs pour garantir une cohérence mathématique absolue
  const isSignalementPost = (p) => (p.typePost === 'signalement' || p.isBackendSignalement) && p.statut !== 'resolu' && p.typePost !== 'resolu';
  const isEntraidePost = (p) => p.typePost === 'entraide';
  const isResoluPost = (p) => p.typePost === 'resolu' || p.statut === 'resolu';

  // Compteurs réels par filtre : la somme des 3 catégories équivaut exactement au total 'tous'
  const counts = useMemo(() => {
    return {
      tous: allPosts.length,
      signalements: allPosts.filter(isSignalementPost).length,
      entraide: allPosts.filter(isEntraidePost).length,
      resolus: allPosts.filter(isResoluPost).length,
    };
  }, [allPosts]);

  // Filtrage strict et fidèle correspondant à 100% aux chiffres affichés entre parenthèses
  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      if (filter === 'signalements') return isSignalementPost(post);
      if (filter === 'entraide') return isEntraidePost(post);
      if (filter === 'resolus') return isResoluPost(post);
      return true;
    });
  }, [allPosts, filter]);

  // Publications du citoyen connecté (pour son Espace Personnel)
  const myPosts = useMemo(() => {
    return allPosts.filter((post) => isPostOwner(post));
  }, [allPosts, userPosts, nomCitoyen, mySignalementsIdSet]);

  // Stories actives du citoyen connecté
  const myStories = useMemo(() => {
    return userStories;
  }, [userStories]);

  const getLikesCount = (postId, baseLikes) => {
    if (!postId) return baseLikes || 1;
    const isLiked = !!likesState[postId];
    return (baseLikes || 1) + (isLiked ? 1 : 0);
  };

  // Cumul des soutiens / likes reçus par l'utilisateur sur ses publications
  const myTotalLikes = useMemo(() => {
    return myPosts.reduce((acc, p) => acc + (getLikesCount(p.id, p.baseLikes || 1)), 0);
  }, [myPosts, likesState]);

  // Deep-linking automatique : scrolle et met en évidence le post ciblé (ex: depuis la Carte ou l'Historique)
  useEffect(() => {
    if (!targetPostId || !allPosts?.length) return;

    const targetStr = String(targetPostId);
    const matched = allPosts.find((p) => {
      const pid = String(p.id);
      const rawId = p.rawBackendId ? String(p.rawBackendId) : null;
      return (
        pid === targetStr ||
        rawId === targetStr ||
        pid === `backend-sig-${targetStr}` ||
        pid === `shared-sig-${targetStr}` ||
        targetStr.includes(pid) ||
        (rawId && targetStr.includes(rawId))
      );
    });

    if (matched) {
      // Si le post n'appartient pas au filtre actif, on bascule sur l'onglet "tous" pour l'afficher
      if (filter !== 'tous') {
        const matchesCurrent =
          (filter === 'signalements' && isSignalementPost(matched)) ||
          (filter === 'entraide' && isEntraidePost(matched)) ||
          (filter === 'resolus' && isResoluPost(matched));
        if (!matchesCurrent) {
          setFilter('tous');
        }
      }

      setHighlightedPostId(matched.id);

      const timer = setTimeout(() => {
        const el = document.getElementById(`communaute-post-${matched.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);

      const clearTimer = setTimeout(() => {
        setHighlightedPostId(null);
      }, 6000);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [targetPostId, allPosts]);

  // Action like / cœurs : bascule UNIQUEMENT le post ciblé par son identifiant unique avec feedback éphémère
  const handleToggleLike = (postId) => {
    if (!postId) return;
    setLikesState((prev) => {
      const isCurrentlyLiked = !prev[postId];
      if (isCurrentlyLiked) {
        if (likeFeedbackTimerRef.current) clearTimeout(likeFeedbackTimerRef.current);
        setJustLikedPostId(postId);
        likeFeedbackTimerRef.current = setTimeout(() => {
          setJustLikedPostId(null);
        }, 1800);
      } else {
        setJustLikedPostId(null);
      }
      return {
        ...prev,
        [postId]: isCurrentlyLiked,
      };
    });
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

  // Action confirmation citoyenne "C'est vrai" (attestation terrain)
  const getConfirmationsCount = (postId, baseCount) => {
    if (!postId) return baseCount || 1;
    const defaultBase = baseCount || Math.max(1, (parseInt(String(postId).replace(/\D/g, '').slice(-2) || '2', 10) % 5) + 1);
    const extra = confirmationsState[postId] ? 1 : 0;
    return defaultBase + extra;
  };

  const handleToggleConfirmation = (postId) => {
    if (!postId) return;
    const isAlreadyConfirmed = !!confirmationsState[postId];
    setConfirmationsState((prev) => ({
      ...prev,
      [postId]: !isAlreadyConfirmed,
    }));
    if (!isAlreadyConfirmed) {
      if (confirmFeedbackTimerRef.current) clearTimeout(confirmFeedbackTimerRef.current);
      setJustConfirmedPostId(postId);
      confirmFeedbackTimerRef.current = setTimeout(() => {
        setJustConfirmedPostId(null);
      }, 1800);
      setReportSuccessToast("Attestation enregistrée ! Vous confirmez cette situation sur le terrain (« C'est vrai »).");
      setTimeout(() => setReportSuccessToast(null), 3500);
    } else {
      setJustConfirmedPostId(null);
    }
  };

  // Action partages : comptage dynamique des partages
  const getSharesCount = (postId, baseShares) => {
    if (!postId) return baseShares || 2;
    const defaultBase = baseShares || Math.max(1, (parseInt(String(postId).replace(/\D/g, '').slice(-2) || '4', 10) % 6) + 1);
    const extra = sharesState[postId] || 0;
    return defaultBase + extra;
  };

  // Action partage : incrémente le compteur et copie le lien / ouvre le partage natif
  const handleShare = async (post) => {
    if (!post?.id) return;
    setSharesState((prev) => ({
      ...prev,
      [post.id]: (prev[post.id] || 0) + 1,
    }));

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

    const chosenImage = modalMediaType === 'image' ? modalMediaPreview : null;
    const chosenVideo = modalMediaType === 'video' ? modalMediaPreview : null;

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
      isUserPost: true,
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
      video: chosenVideo,
      statut: modalType === 'resolu' ? 'resolu' : 'en_cours',
      statutLabel,
      baseLikes: 1,
      baseViews: 1,
      comments: [],
    };

    try {
      const myPostIds = JSON.parse(localStorage.getItem('mbeund_mi_my_post_ids') || '{}');
      myPostIds[newPostId] = true;
      localStorage.setItem('mbeund_mi_my_post_ids', JSON.stringify(myPostIds));
    } catch {}

    setUserPosts([newPost, ...userPosts]);
    setModalPostText('');
    setModalMediaFile(null);
    setModalMediaPreview(null);
    setModalMediaType(null);
    setModalError(null);
    setIsPostModalOpen(false);

    try {
      window.dispatchEvent(
        new CustomEvent('mbeund_mi_new_community_post', { detail: newPost })
      );
    } catch {}
  };

  // Suppression d'une Story créée par l'utilisateur
  const handleDeleteStory = (story) => {
    if (!story) return;
    setUserStories((prev) => {
      const next = prev.filter((s) => s.id !== story.id);
      try {
        localStorage.setItem('mbeund_mi_user_stories', JSON.stringify(next));
      } catch {}
      return next;
    });
    setStoryToDelete(null);
    setReportSuccessToast("Story éphémère retirée de vos publications.");
    setTimeout(() => setReportSuccessToast(null), 3000);
  };

  // Action création d'une Story éphémère 24h (Photo / Vidéo ou Texte seul avec dégradé stylé)
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

    if (storyMode === 'media' && !storyMediaPreview) {
      setStoryError("Veuillez prendre ou sélectionner une photo ou une vidéo.");
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
    let videoUrl = null;
    if (storyMode === 'media') {
      if (storyMediaType === 'video') {
        videoUrl = storyMediaPreview;
      } else {
        photoUrl = storyMediaPreview;
      }
    }

    const createdStory = {
      id: newStoryId,
      isUserStory: true,
      isTextStory: storyMode === 'texte',
      mediaType: storyMode === 'texte' ? 'texte' : storyMediaType,
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
      video: videoUrl,
    };

    const updatedStories = [createdStory, ...userStories];
    setUserStories(updatedStories);
    try {
      localStorage.setItem('mbeund_mi_user_stories', JSON.stringify(updatedStories));
    } catch {}

    setStoryText('');
    setStoryMediaFile(null);
    setStoryMediaPreview(null);
    setStoryMediaType(null);
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
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#103565] to-slate-900 text-white p-4 sm:p-6 md:p-7 shadow-xl border border-blue-900/40 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 relative z-10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                Espace Communauté · Thiaroye
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                En direct
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 sm:line-clamp-1">
              Fil d’actualité citoyen, signalements géolocalisés et entraide solidaire entre voisins
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Bouton avec l'avatar du citoyen connecté (Mon espace personnel) */}
            <button
              type="button"
              onClick={() => setIsMySpaceOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white transition active:scale-95 cursor-pointer shrink-0 shadow-xs group"
              title="Mon espace personnel dans la communauté"
              aria-label="Ouvrir mon espace personnel"
            >
              <div className="relative w-7 h-7 rounded-full overflow-hidden ring-2 ring-amber-400 group-hover:ring-white transition">
                <img
                  src={currentUserAvatar}
                  alt={nomCitoyen}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden sm:inline text-xs font-black tracking-tight">Mon espace</span>
              {myPosts.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-navy-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                  {myPosts.length}
                </span>
              )}
            </button>
          </div>
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
      <section className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={16} className="text-amber-500 shrink-0" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-navy-900 dark:text-white truncate">
              Stories du terrain · En direct
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[10px] sm:text-[11px] font-extrabold text-[#CC131A] dark:text-rose-400 shrink-0">
            <Timer size={13} className="shrink-0" />
            <span>Éphémère · Expire dans 24h</span>
          </div>
        </div>

        {/* Carousel horizontal fluide avec avatars et swipe tactile natif */}
        <div
          className="flex items-start gap-3 sm:gap-5 md:gap-6 overflow-x-auto pb-2 pt-1 scrollbar-none px-1 touch-pan-x snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
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
            className={`flex flex-col items-center flex-shrink-0 snap-start group text-left transition active:scale-95 ${
              userIsBanned ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] border-2 border-dashed border-navy-300 dark:border-navy-700 group-hover:border-[#CC131A] transition-all flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-navy-50 dark:bg-navy-900/60 flex items-center justify-center text-navy-600 dark:text-navy-300 group-hover:bg-red-50 dark:group-hover:bg-red-950/40 group-hover:text-[#CC131A] transition-colors">
                <Plus size={20} className="transition-transform group-hover:scale-110" />
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-black text-navy-800 dark:text-slate-200 mt-1.5 text-center truncate max-w-[64px] sm:max-w-[72px]">
              Votre story
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold text-center">
              24h direct
            </span>
          </button>

          {/* Stories des riverains de Thiaroye (format compact et proportionné, bordure dégradée Instagram si non lue, grisée si lue) */}
          {allStories.map((story) => {
            const isRead = !!viewedStories[story.id];
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => handleOpenStory(story)}
                className="flex flex-col items-center flex-shrink-0 snap-start group cursor-pointer text-left transition-transform active:scale-95"
              >
                <div
                  data-testid={`story-ring-${story.id}`}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] transition-all duration-300 ${
                    isRead
                      ? 'bg-slate-300 dark:bg-slate-700 opacity-70 group-hover:opacity-95 group-hover:bg-slate-400'
                      : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 group-hover:from-red-600 group-hover:to-amber-400 shadow-sm group-hover:shadow-md'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-navy-950 p-[1.5px]">
                    <img
                      src={story.avatar}
                      alt={story.relais}
                      className="w-full h-full rounded-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Point pulsant indicateur d'alerte en direct si non lu, ou discret grisé si déjà lu */}
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#071322] ${
                      isRead ? 'bg-slate-400' : `${story.dotColor || 'bg-emerald-400'} animate-pulse shadow-xs`
                    }`}
                  />
                </div>

                <span
                  className={`text-[11px] sm:text-xs mt-1.5 text-center truncate max-w-[64px] sm:max-w-[72px] ${
                    isRead ? 'font-bold text-slate-500 dark:text-slate-400' : 'font-black text-navy-900 dark:text-white'
                  }`}
                >
                  {story.relais}
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] text-center truncate max-w-[64px] sm:max-w-[72px] ${
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
        {/* Filtres de navigation avec masquage strict et défilement tactile fluide */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar flex-1 touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Tous les posts */}
          <button
            onClick={() => setFilter('tous')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
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
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
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
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
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
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
              filter === 'resolus'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-navy-900 text-navy-600 dark:text-navy-200 border border-slate-200 dark:border-navy-800 hover:border-emerald-300'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Résolus & Sécurisés ({counts.resolus})</span>
          </button>
        </div>

        {/* Bouton Nouveau Post positionné à droite (pleine largeur sur mobile pour zone tactile optimale, compact sur tablette/desktop) */}
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
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md transition-all shrink-0 w-full sm:w-auto ${
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
            const isConfirmed = !!confirmationsState[post.id];
            const areCommentsOpen = !!openComments[post.id];
            const currentLikes = getLikesCount(post.id, post.baseLikes);
            const currentConfirmations = getConfirmationsCount(post.id, post.baseConfirmations);
            const currentViews = getViewsCount(post.id, post.baseViews);
            const currentShares = getSharesCount(post.id, post.baseShares || post.shares);
            const postComments = [
              ...(post.comments || []),
              ...(commentsByPost[post.id] || []),
            ];

            const isHighlighted = highlightedPostId === post.id;

            return (
              <article
                key={post.id}
                id={`communaute-post-${post.id}`}
                onClick={() => handleIncrementView(post.id)}
                className={`bg-white dark:bg-[#0B1E36] border rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 flex flex-col justify-between ${
                  isHighlighted
                    ? 'ring-4 ring-[#CC131A] border-[#CC131A] shadow-2xl scale-[1.015]'
                    : 'border-slate-200 dark:border-navy-800/90 shadow-sm hover:shadow-md ring-1 ring-slate-900/5 dark:ring-white/5'
                }`}
              >
                {/* Bandeau d'accentuation si sélectionné depuis la Carte */}
                {isHighlighted && (
                  <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black px-4 py-2 flex items-center justify-between shadow-sm">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="animate-bounce" />
                      <span>Publication sélectionnée depuis la Carte</span>
                    </span>
                    <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                      En évidence
                    </span>
                  </div>
                )}

                {/* Haut de la carte : Auteur + Quartier + Badges Filtre & Statut (Design unifié 100% cohérent) */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-navy-50 dark:border-navy-800/80">
                  {/* Bloc Auteur à gauche : 2 lignes fixes, nettes et parfaitement alignées */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-navy-800 flex-shrink-0 border-2 border-slate-100 dark:border-navy-700 shadow-xs">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Ligne 1 : Nom de l'auteur + badge optionnel sans wrap perturbateur */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-black text-navy-900 dark:text-white truncate">
                          {post.author.name}
                        </span>
                        {isPostOwner(post) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex-shrink-0">
                            Vous
                          </span>
                        ) : post.author.role === 'Relais Quartier' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700 flex-shrink-0">
                            Relais
                          </span>
                        ) : null}
                      </div>

                      {/* Ligne 2 : Quartier · Date compacte (ex: 2j, 1j, 1m, 1a) avec accès direct à la carte */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 min-w-0 overflow-hidden">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/citoyen/carte?signalementId=${post.rawBackendId || post.id}&quartier=${encodeURIComponent(post.author.quartier || '')}`);
                          }}
                          title="Localiser sur la carte vivante de Thiaroye"
                          className="inline-flex items-center gap-1 text-[#CC131A] font-extrabold truncate shrink min-w-0 hover:underline cursor-pointer group text-left"
                        >
                          <MapPin size={11} className="shrink-0 text-[#CC131A] group-hover:scale-110 transition-transform" />
                          <span className="truncate">{post.author.quartier}</span>
                        </button>
                        <span className="text-slate-300 dark:text-navy-600 shrink-0">·</span>
                        <span
                          className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 shrink-0 font-semibold"
                          title={post.date}
                        >
                          <Clock size={11} className="shrink-0 text-slate-400" />
                          <span>{formatCompactDate(post.dateRaw || post.date)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Côté droit : Badge de type unifié centré verticalement + Menu 3 points (style Facebook / Instagram) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {post.typePost === 'signalement' && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-[#CC131A] dark:text-red-300 border border-red-200 dark:border-red-900 shrink-0 whitespace-nowrap">
                        <Camera size={12} className="shrink-0" />
                        <span className="sm:hidden">Signalement</span>
                        <span className="hidden sm:inline">Signalement terrain</span>
                      </span>
                    )}

                    {post.typePost === 'entraide' && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0 whitespace-nowrap">
                        <Flame size={12} className="shrink-0" />
                        <span className="sm:hidden">Entraide</span>
                        <span className="hidden sm:inline">Entraide & Mobilisation</span>
                      </span>
                    )}

                    {post.typePost === 'resolu' && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 whitespace-nowrap">
                        <CheckCircle2 size={12} className="shrink-0" />
                        <span className="sm:hidden">Résolu</span>
                        <span className="hidden sm:inline">Résolu & Sécurisé</span>
                      </span>
                    )}

                    {/* Menu 3 points unifié sur toutes les publications (Supprimer pour auteur, Signaler pour autrui) */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        aria-label="Options de la publication"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuPostId((prev) => (prev === post.id ? null : post.id));
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition cursor-pointer"
                        title="Options de la publication"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Menu contextuel déroulant */}
                      {openMenuPostId === post.id && (
                        <div
                          role="menu"
                          className="absolute right-0 top-9 w-52 max-w-[calc(100vw-32px)] bg-white dark:bg-[#071322] border border-slate-200 dark:border-navy-700 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-150"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuPostId(null);
                              navigate(`/citoyen/carte?signalementId=${post.rawBackendId || post.id}&quartier=${encodeURIComponent(post.author.quartier || '')}`);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition cursor-pointer text-left border-b border-slate-100 dark:border-navy-800/80"
                          >
                            <MapPin size={15} className="text-[#CC131A] flex-shrink-0" />
                            <span>Voir sur la carte</span>
                          </button>
                          {isPostOwner(post) ? (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuPostId(null);
                                setPostToDelete(post);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer text-left"
                            >
                              <Trash2 size={15} className="flex-shrink-0" />
                              <span>Supprimer la publication</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuPostId(null);
                                if (reportedIds[post.id]) return;
                                setReportingItem({
                                  targetId: post.id,
                                  targetType: 'post',
                                  authorName: post.author.name,
                                  textSnippet: post.texte,
                                });
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition cursor-pointer text-left"
                            >
                              <Flag size={15} className={`flex-shrink-0 ${reportedIds[post.id] ? 'text-emerald-500' : 'text-amber-500'}`} />
                              <span>{reportedIds[post.id] ? 'Publication déjà signalée' : 'Signaler cette publication'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1. Conteneur visuel unifié sous le header : Vidéo, Photo OU Texte stylisé (hauteur identique sur tous les posts) */}
                {post.video ? (
                  <div className="relative w-full h-52 sm:h-60 md:h-68 bg-black overflow-hidden flex items-center justify-center">
                    <video
                      src={post.video}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : post.image ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImageModal(post.image);
                    }}
                    className="relative w-full h-52 sm:h-60 md:h-68 bg-slate-950 overflow-hidden cursor-pointer group"
                  >
                    <img
                      src={post.image}
                      alt={post.texte}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1.5 backdrop-blur-2xs">
                      <Eye size={16} />
                      <span>Agrandir la photo</span>
                    </div>
                  </div>
                ) : (
                  /* Quand le post n'a pas de photo : le texte occupe majestueusement le conteneur de l'image (façon post Facebook) */
                  <div className="relative w-full h-52 sm:h-60 md:h-68 bg-gradient-to-br from-[#0B2545] via-[#103565] to-slate-950 p-6 sm:p-8 flex items-center justify-center text-center overflow-hidden border-b border-navy-50/10 dark:border-navy-800/80 select-none">
                    {/* Lueur d'ambiance et filigrane discret */}
                    <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                    <Droplets className="absolute right-3 bottom-3 text-white/5 w-24 h-24 pointer-events-none" />

                    {/* Texte du post centré et mis en valeur */}
                    <div className="relative z-10 max-w-sm sm:max-w-md mx-auto flex flex-col items-center justify-center px-2">
                      <span className="text-2xl sm:text-3xl text-amber-400/50 font-serif leading-none select-none mb-1">“</span>
                      <p className="text-sm sm:text-base md:text-lg font-bold text-white leading-relaxed drop-shadow-xs line-clamp-5">
                        {post.texte}
                      </p>
                      <span className="text-2xl sm:text-3xl text-amber-400/50 font-serif leading-none select-none mt-1">”</span>
                    </div>
                  </div>
                )}

                {/* 2. Corps du post : Catégorie + Statut + Texte descriptif (si photo présente) */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                        {post.categorie}
                      </span>
                      {post.statutLabel && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                          {post.statutLabel}
                        </span>
                      )}
                      {post.titre && post.titre !== post.categorie && (
                        <span className="text-xs font-black text-navy-800 dark:text-slate-200">
                          {post.titre}
                        </span>
                      )}
                    </div>

                    {/* Si le post possède une photo, le texte descriptif s'affiche ici */}
                    {post.image ? (
                      <p className="text-sm text-navy-900 dark:text-slate-100 leading-relaxed font-medium">
                        {post.texte}
                      </p>
                    ) : (
                      /* Si le post n'a pas de photo, le texte est déjà magnifiquement affiché dans le grand conteneur du haut :
                         la zone du dessous reste aérée et légère pour préserver l'harmonie */
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">
                        Observation terrain partagée pour vigilance communautaire.
                      </p>
                    )}
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* BARRE D'ACTIONS SOCIALES UNIFIÉE EN BLEU                         */}
                {/* À GAUCHE : Cœur, Vues, Commentaires                              */}
                {/* À DROITE : Carte & Partages (épurés sans texte)                 */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 sm:px-3 sm:px-4 py-2 sm:py-2.5 border-t border-navy-50 dark:border-navy-800/80 bg-slate-50/70 dark:bg-navy-900/40 flex items-center justify-between gap-1 sm:gap-2"
                >
                  {/* BLOC GAUCHE : Interactions directes (Cœur, "C'est vrai" / Confirmation, Vues passives, Commentaires) */}
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar">
                    {/* 1. Bouton CŒUR (soutien moral avec feedback éphémère "J'aime !") */}
                    <button
                      type="button"
                      aria-label="J'aime le post"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(post.id);
                      }}
                      title="Soutenir cette publication"
                      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black transition-colors duration-200 active:scale-95 cursor-pointer select-none shrink-0 border ${
                        isLiked
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-blue-50/80 hover:bg-blue-100/90 text-[#0B2545] border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 dark:hover:bg-blue-900/60'
                      }`}
                    >
                      <Heart
                        size={14}
                        className={`transition-transform duration-200 ${
                          isLiked
                            ? 'fill-white text-white'
                            : 'fill-blue-500/20 text-[#0B2545] dark:text-blue-400'
                        }`}
                      />
                      {justLikedPostId === post.id ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-white/25 text-white animate-in fade-in zoom-in-95 duration-200">
                          J'aime !
                        </span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black transition-colors ${
                            isLiked
                              ? 'bg-black/20 text-white'
                              : 'bg-blue-200/70 dark:bg-blue-900/70 text-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {currentLikes}
                        </span>
                      )}
                    </button>

                    {/* 2. Bouton "C'EST VRAI" (Attestation citoyenne terrain avec feedback éphémère "Confirmé !") */}
                    <button
                      type="button"
                      aria-label="Confirmer cette situation (C'est vrai)"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleConfirmation(post.id);
                      }}
                      title="C'est vrai : J'atteste avoir vu cette situation dans le quartier"
                      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black transition-colors duration-200 active:scale-95 cursor-pointer select-none shrink-0 border ${
                        isConfirmed
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-blue-50/80 hover:bg-emerald-50 text-[#0B2545] hover:text-emerald-700 border-blue-200/70 hover:border-emerald-400 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300'
                      }`}
                    >
                      <CheckCircle2
                        size={14}
                        className={`transition-transform duration-200 ${
                          isConfirmed ? 'text-white' : 'text-[#0B2545] dark:text-blue-400'
                        }`}
                      />
                      {justConfirmedPostId === post.id ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-white/25 text-white animate-in fade-in zoom-in-95 duration-200">
                          Confirmé !
                        </span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black transition-colors ${
                            isConfirmed
                              ? 'bg-black/20 text-white'
                              : 'bg-blue-200/70 dark:bg-blue-900/70 text-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {currentConfirmations}
                        </span>
                      )}
                    </button>

                    {/* 3. Badge VUES / AUDIENCE : Passif (lecture seule, reflète l'audience réelle) */}
                    <button
                      type="button"
                      disabled
                      aria-label="Nombre d'explorations du post"
                      title="Audience : nombre de consultations réelles du post"
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black shrink-0 bg-blue-50/80 text-[#0B2545] border border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 cursor-default select-none opacity-90 shadow-xs"
                    >
                      <Eye size={14} className="text-[#0B2545] dark:text-blue-400" />
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-blue-200/70 dark:bg-blue-900/70 text-blue-900 dark:text-blue-200">
                        {currentViews}
                      </span>
                    </button>

                    {/* 4. Bouton COMMENTAIRES / AVIS */}
                    <button
                      type="button"
                      aria-label="Commentaires et avis riverains"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                      }}
                      title="Commentaires et avis riverains"
                      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black transition-colors duration-200 active:scale-95 cursor-pointer shadow-xs shrink-0 border ${
                        areCommentsOpen
                          ? 'bg-[#0B2545] text-white border-[#0B2545]'
                          : 'bg-blue-50/80 hover:bg-blue-100/90 text-[#0B2545] border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 dark:hover:bg-blue-900/60'
                      }`}
                    >
                      <MessageCircle
                        size={14}
                        className={areCommentsOpen ? 'text-white' : 'text-[#0B2545] dark:text-blue-400'}
                      />
                      <span
                        data-testid={`comments-count-${post.id}`}
                        className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black transition-all ${
                          areCommentsOpen
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-200/70 dark:bg-blue-900/70 text-blue-900 dark:text-blue-200'
                        }`}
                      >
                        {postComments.length}
                      </span>
                    </button>
                  </div>

                  {/* BLOC DROITE : Carte & Partager (épurés sans texte à l'intérieur) */}
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                    {/* 4. Bouton CARTE (icône seule sans texte, survol bleu soutenu) */}
                    <button
                      type="button"
                      aria-label="Localiser sur la carte interactive"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/citoyen/carte?signalementId=${post.rawBackendId || post.id}&quartier=${encodeURIComponent(post.author.quartier || '')}`);
                      }}
                      title="Localiser sur la carte interactive avec son avatar"
                      className="group inline-flex items-center justify-center p-1.5 sm:p-2 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer shadow-xs flex-shrink-0 bg-blue-50/80 hover:bg-[#0B2545] text-[#0B2545] hover:text-white border border-blue-200/70 hover:border-[#0B2545] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 dark:hover:bg-blue-600 dark:hover:text-white hover:shadow-md"
                    >
                      <MapPin size={15} className="text-[#0B2545] dark:text-blue-400 group-hover:text-white transition-colors" />
                    </button>

                    {/* 5. Bouton PARTAGER (icône + compteur de partages, survol bleu soutenu) */}
                    <button
                      type="button"
                      aria-label="Partager ce post"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(post);
                      }}
                      title="Partager ce post avec les voisins"
                      className="group inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer shadow-xs flex-shrink-0 bg-blue-50/80 hover:bg-[#0B2545] text-[#0B2545] hover:text-white border border-blue-200/70 hover:border-[#0B2545] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 dark:hover:bg-blue-600 dark:hover:text-white hover:shadow-md"
                    >
                      {copiedShareId === post.id ? (
                        <>
                          <Check size={15} className="text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">Copié</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={15} className="text-[#0B2545] dark:text-blue-400 group-hover:text-white transition-colors" />
                          <span className="px-1 sm:px-1.5 py-0.2 rounded-full text-[10px] sm:text-[11px] font-black bg-blue-200/70 dark:bg-blue-900/70 text-blue-900 dark:text-blue-200 group-hover:bg-white/20 group-hover:text-white transition-colors">
                            {currentShares}
                          </span>
                        </>
                      )}
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
            role="dialog"
            aria-modal="true"
            aria-label="Nouveau post communautaire"
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
                <div className="grid grid-cols-2 gap-2">
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
                  <label className="flex items-center gap-1.5 text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                    <MapPin size={13} className="text-[#0B2545] dark:text-blue-400" />
                    <span>Quartier</span>
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <select
                      value={modalQuartier}
                      onChange={(e) => setModalQuartier(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-bold cursor-pointer"
                    >
                      <option value="Cuvette Ouest (Thiaroye-sur-Mer)">Cuvette Ouest (Zone Historique)</option>
                      <option value="Ndakhane (Thiaroye)">Ndakhane Cuvette</option>
                      <option value="Thiaroye Plage">Thiaroye Plage & Débarcadère</option>
                      <option value="Médina Fass">Médina Fass</option>
                      <option value="Baghdad">Baghdad</option>
                      <option value="Thiaroye Gare">Thiaroye Gare</option>
                      <option value="Guinaw Rail">Guinaw Rail</option>
                      <option value="CEM Thiaroye 44">CEM Thiaroye 44</option>
                      <option value="Thiaroye Minam">Thiaroye Minam</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                    <Tag size={13} className="text-[#0B2545] dark:text-blue-400" />
                    <span>Catégorie</span>
                  </label>
                  <div className="relative">
                    <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <select
                      value={modalCategorie}
                      onChange={(e) => setModalCategorie(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-bold cursor-pointer"
                    >
                      {(CATEGORIES_BY_TYPE[modalType] || []).map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sélection de média : Prise directe ou Upload de photo / vidéo (Optionnel) */}
              <div>
                <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-2">
                  Photo ou Vidéo du constat (Optionnel)
                </label>

                {/* Inputs cachés pour la prise de photo/vidéo et l'upload */}
                <input
                  type="file"
                  ref={modalCameraRef}
                  accept="image/*,video/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleModalMediaFile}
                />
                <input
                  type="file"
                  ref={modalUploadRef}
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleModalMediaFile}
                />

                {/* Boutons d'action pour prendre ou importer une photo / vidéo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => startLiveCamera('post')}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 hover:border-slate-400 dark:hover:border-slate-500 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs group"
                  >
                    <Camera size={16} className="text-slate-600 dark:text-slate-300 group-hover:scale-110 transition" />
                    <span>Prendre photo / vidéo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => modalUploadRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 hover:border-slate-400 dark:hover:border-slate-500 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs group"
                  >
                    <Upload size={16} className="text-slate-600 dark:text-slate-300 group-hover:scale-110 transition" />
                    <span>Importer depuis l'appareil</span>
                  </button>
                </div>

                {/* Aperçu si un média (photo ou vidéo) a été sélectionné */}
                {modalMediaPreview ? (
                  <div className="relative mb-3 rounded-2xl overflow-hidden border-2 border-emerald-500/80 bg-slate-900 shadow-sm animate-in fade-in duration-200">
                    {modalMediaType === 'video' ? (
                      <video
                        src={modalMediaPreview}
                        controls
                        playsInline
                        className="w-full h-40 sm:h-48 object-contain bg-black"
                      />
                    ) : (
                      <img
                        src={modalMediaPreview}
                        alt="Photo capturée pour le post"
                        className="w-full h-36 sm:h-44 object-cover"
                      />
                    )}
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-black flex items-center gap-1 shadow-xs">
                      <Check size={12} strokeWidth={3} />
                      <span>{modalMediaType === 'video' ? 'Vidéo prête' : 'Photo prête'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalMediaFile(null);
                        setModalMediaPreview(null);
                        setModalMediaType(null);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                      title="Retirer ce média"
                      aria-label="Retirer ce média"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Astuce : Les publications avec photo ou vidéo sont plus rapidement remarquées et confirmées par vos voisins.
                  </p>
                )}
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
                  setStoryMediaFile(null);
                  setStoryMediaPreview(null);
                  setStoryMediaType(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-navy-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulaire de création de Story */}
            <form onSubmit={handleCreateStory} className="space-y-4">
              {/* Choix du mode : Story Texte seul ou Story Photo ou Vidéo */}
              <div>
                <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Format de votre Story
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStoryMode('texte');
                      setStoryError(null);
                    }}
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
                    onClick={() => {
                      setStoryMode('media');
                      setStoryError(null);
                    }}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-2 ${
                      storyMode === 'media'
                        ? 'border-[#CC131A] bg-red-50 dark:bg-red-950/40 text-[#CC131A] font-black'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Camera size={15} />
                      <Video size={15} />
                    </div>
                    <span className="text-xs">Story Photo ou Vidéo</span>
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

              {/* Si mode photo ou vidéo : Prise de vue directe ou Import de fichier */}
              {storyMode === 'media' && (
                <div className="space-y-3">
                  <label className="block text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider">
                    Photo ou Vidéo du terrain
                  </label>

                  {/* Inputs réels cachés */}
                  <input
                    ref={storyCameraRef}
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleStoryMediaFile}
                  />
                  <input
                    ref={storyUploadRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleStoryMediaFile}
                  />

                  {/* Boutons d'action pour capturer ou uploader */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => startLiveCamera('story')}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition font-bold text-xs cursor-pointer shadow-xs group"
                    >
                      <Camera size={16} className="text-slate-600 dark:text-slate-300 group-hover:scale-110 transition" />
                      <span>Prendre photo / vidéo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => storyUploadRef.current?.click()}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition font-bold text-xs cursor-pointer shadow-xs group"
                    >
                      <Upload size={16} className="text-slate-600 dark:text-slate-300 group-hover:scale-110 transition" />
                      <span>Importer un fichier</span>
                    </button>
                  </div>

                  {/* Prévisualisation du média chargé */}
                  {storyMediaPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-red-500/40 bg-black max-h-56">
                      {storyMediaType === 'video' ? (
                        <video
                          src={storyMediaPreview}
                          controls
                          playsInline
                          className="w-full max-h-56 object-contain mx-auto"
                        />
                      ) : (
                        <img
                          src={storyMediaPreview}
                          alt="Aperçu Story"
                          className="w-full max-h-56 object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setStoryMediaFile(null);
                          setStoryMediaPreview(null);
                          setStoryMediaType(null);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer shadow-md"
                        title="Retirer ce média"
                        aria-label="Retirer ce média"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1.5">
                        {storyMediaType === 'video' ? (
                          <Video size={12} className="text-amber-400" />
                        ) : (
                          <Camera size={12} className="text-emerald-400" />
                        )}
                        <span>{storyMediaType === 'video' ? 'Vidéo prête' : 'Photo prête'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-900/30 text-center text-xs text-slate-500 dark:text-slate-400">
                      Prenez une photo ou vidéo en direct ou importez un fichier (MP4, MOV, JPG, PNG · max 25 Mo).
                    </div>
                  )}
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
                  <option value="Cuvette Ouest (Thiaroye-sur-Mer)">Cuvette Ouest (Zone Historique)</option>
                  <option value="Ndakhane (Thiaroye)">Ndakhane Cuvette</option>
                  <option value="Thiaroye Plage">Thiaroye Plage & Débarcadère</option>
                  <option value="Médina Fass">Médina Fass</option>
                  <option value="Baghdad">Baghdad</option>
                  <option value="Thiaroye Gare">Thiaroye Gare</option>
                  <option value="Guinaw Rail">Guinaw Rail</option>
                  <option value="CEM Thiaroye 44">CEM Thiaroye 44</option>
                  <option value="Thiaroye Minam">Thiaroye Minam</option>
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
                    setStoryMediaFile(null);
                    setStoryMediaPreview(null);
                    setStoryMediaType(null);
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
      {/* 6. BIS. VISEUR CAMÉRA EN DIRECT (PHOTO / VIDÉO RÉEL SUR TÉLÉPHONE/PC) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {liveCameraTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Viseur Caméra en Direct"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={stopLiveCamera}
        >
          <div
            className="relative w-full max-w-md bg-slate-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du viseur */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-black/60 border-b border-white/10 z-10">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isLiveRecording ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {isLiveRecording
                    ? `Enregistrement 00:${liveRecordingSeconds < 10 ? '0' : ''}${liveRecordingSeconds} / 00:30`
                    : liveCameraTarget === 'story'
                    ? 'Caméra Direct · Story 24h'
                    : 'Caméra Direct · Nouveau Post'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Bascule Caméra Avant / Arrière */}
                <button
                  type="button"
                  onClick={flipLiveCamera}
                  title="Changer de caméra (avant/arrière)"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <RefreshCw size={14} />
                </button>
                {/* Fermer */}
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  title="Fermer la caméra"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Viseur / Vidéo en direct */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[9/16] max-h-[55vh] bg-black flex items-center justify-center overflow-hidden">
              {liveCameraError ? (
                <div className="p-6 text-center space-y-3">
                  <AlertTriangle size={36} className="text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {liveCameraError}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const target = liveCameraTarget;
                      stopLiveCamera();
                      if (target === 'story') {
                        storyCameraRef.current?.click();
                      } else {
                        modalCameraRef.current?.click();
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>Ouvrir l'appareil via sélecteur système</span>
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${liveFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />
                  {/* Coins de visée graphique */}
                  <div className="absolute inset-4 border border-white/20 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <span className="w-4 h-4 border-t-2 border-l-2 border-white/70" />
                      <span className="w-4 h-4 border-t-2 border-r-2 border-white/70" />
                    </div>
                    <div className="flex justify-between">
                      <span className="w-4 h-4 border-b-2 border-l-2 border-white/70" />
                      <span className="w-4 h-4 border-b-2 border-r-2 border-white/70" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Commandes d'action en bas */}
            {!liveCameraError && (
              <div className="p-4 bg-slate-900 border-t border-white/10 flex flex-col gap-3">
                {/* Sélecteur de mode en onglets (Neutres au départ, l'actif devient rouge) */}
                {!isLiveRecording && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLiveCaptureMode('photo')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        liveCaptureMode === 'photo'
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/40 ring-2 ring-red-400'
                          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveCaptureMode('video')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        liveCaptureMode === 'video'
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/40 ring-2 ring-red-400'
                          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      Vidéo
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-around">
                  {!isLiveRecording ? (
                    <>
                      {/* Bouton Prendre Photo */}
                      <button
                        type="button"
                        onClick={() => {
                          setLiveCaptureMode('photo');
                          captureLivePhoto();
                        }}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                        title="Prendre une photo instantanée"
                      >
                        <div
                          className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition active:scale-95 shadow-lg ${
                            liveCaptureMode === 'photo'
                              ? 'border-red-400 bg-red-600 group-hover:scale-105 group-hover:bg-red-500 shadow-red-600/50'
                              : 'border-white/40 bg-white/10 group-hover:border-white group-hover:bg-white/20'
                          }`}
                        >
                          <Camera
                            size={22}
                            className={liveCaptureMode === 'photo' ? 'text-white' : 'text-white'}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-black transition-colors ${
                            liveCaptureMode === 'photo' ? 'text-red-400' : 'text-white'
                          }`}
                        >
                          Prendre photo
                        </span>
                      </button>

                      {/* Bouton Filmer Vidéo */}
                      <button
                        type="button"
                        onClick={() => {
                          setLiveCaptureMode('video');
                          startLiveVideoRecording();
                        }}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                        title="Enregistrer une vidéo du terrain (max 30s)"
                      >
                        <div
                          className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition active:scale-95 shadow-lg ${
                            liveCaptureMode === 'video'
                              ? 'border-red-400 bg-red-600 group-hover:scale-105 group-hover:bg-red-500 shadow-red-600/50'
                              : 'border-white/40 bg-white/10 group-hover:border-white group-hover:bg-white/20'
                          }`}
                        >
                          <Video
                            size={22}
                            className={liveCaptureMode === 'video' ? 'text-white' : 'text-white'}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-black transition-colors ${
                            liveCaptureMode === 'video' ? 'text-red-400' : 'text-white'
                          }`}
                        >
                          Filmer vidéo
                        </span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={stopLiveVideoRecording}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm transition active:scale-95 shadow-xl cursor-pointer"
                    >
                      <Square size={18} className="fill-white" />
                      <span>Arrêter et valider la vidéo</span>
                    </button>
                  )}
                </div>

                {/* Indication visuelle d'état */}
                {!isLiveRecording && (
                  <p className="text-[11px] text-center text-slate-400 italic">
                    {liveCaptureMode === 'photo'
                      ? 'Mode Photo sélectionné en rouge · Prêt à capturer'
                      : liveCaptureMode === 'video'
                      ? 'Mode Vidéo sélectionné en rouge · Prêt à enregistrer (max 30s)'
                      : 'Faites votre choix : cliquez sur Photo ou Vidéo pour activer'}
                  </p>
                )}
              </div>
            )}
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
              activeStory.isTextStory || (!activeStory.image && !activeStory.video)
                ? `bg-gradient-to-br ${activeStory.gradientClass || 'from-[#0B2545] via-[#103565] to-slate-950'}`
                : 'bg-black'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Si story avec photo ou vidéo : affichage en pleine page */}
            {!activeStory.isTextStory && (activeStory.video || activeStory.image) && (
              <>
                {activeStory.video || activeStory.mediaType === 'video' ? (
                  <video
                    src={activeStory.video}
                    autoPlay
                    playsInline
                    muted={isStoryVideoMuted}
                    loop
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={activeStory.image}
                    alt={activeStory.texte}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/85 pointer-events-none" />

                {/* Bouton pour couper ou réactiver le son sur les vidéos */}
                {(activeStory.video || activeStory.mediaType === 'video') && (
                  <button
                    type="button"
                    onClick={() => setIsStoryVideoMuted(!isStoryVideoMuted)}
                    className="absolute top-20 right-4 z-30 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer backdrop-blur-xs shadow-md border border-white/20"
                    title={isStoryVideoMuted ? 'Activer le son' : 'Couper le son'}
                    aria-label={isStoryVideoMuted ? 'Activer le son' : 'Couper le son'}
                  >
                    {isStoryVideoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                )}
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
            {(activeStory.isTextStory || (!activeStory.image && !activeStory.video)) ? (
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
              /* Zone centrale vide pour laisser la photo ou vidéo totalement dégagée */
              <div className="flex-1" />
            )}

            {/* Bas de la Story : Capsule de texte compacte escamotable pour ne pas masquer le média */}
            <div className="relative z-20 p-4 space-y-3">
              {(activeStory.image || activeStory.video) && !activeStory.isTextStory && (
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
                <button
                  type="button"
                  onClick={() => handleSupportStory(activeStory.id)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black text-center shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                    storySupports[`user_${activeStory.id}`]
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#0B2545] hover:bg-[#123969] text-white border border-white/20'
                  }`}
                >
                  <CheckCircle2 size={15} className={storySupports[`user_${activeStory.id}`] ? 'text-white' : 'text-emerald-400'} />
                  <span>
                    {storySupports[`user_${activeStory.id}`]
                      ? `Observation confirmée (${(activeStory.baseVotes || 3) + (storySupports[activeStory.id] || 1)})`
                      : `Soutenir cette observation (${(activeStory.baseVotes || 3) + (storySupports[activeStory.id] || 0)})`}
                  </span>
                </button>
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
          className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
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


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 10. VOLET COULISSANT : MON ESPACE PERSONNEL COMMUNAUTAIRE (OPTION 1) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isMySpaceOpen && (
        <div
          role="dialog"
          aria-label="Mon espace communautaire"
          className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden overscroll-contain"
          onClick={() => setIsMySpaceOpen(false)}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            className="relative w-full max-w-md sm:max-w-lg h-full bg-white dark:bg-[#071322] border-l border-navy-100 dark:border-navy-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 overflow-hidden overscroll-contain"
          >
            {/* En-tête du volet avec profil citoyen */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-navy-800 bg-gradient-to-br from-[#0B2545] via-[#103565] to-slate-950 text-white relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsMySpaceOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Fermer mon espace"
                aria-label="Fermer mon espace"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3.5 pt-1">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-amber-400 shrink-0 shadow-md">
                  <img src={currentUserAvatar} alt={nomCitoyen} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 pr-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black truncate">{nomCitoyen}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                      Mon espace
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-red-400 shrink-0" />
                    <span>Résident de Thiaroye-sur-Mer</span>
                  </p>
                </div>
              </div>

              {/* 3 mini compteurs d'impact citoyen */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15 text-center">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-2xs">
                  <span className="block text-base font-black text-white">{myPosts.length}</span>
                  <span className="text-[10px] text-slate-300 font-semibold">Publications</span>
                </div>
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-2xs">
                  <span className="block text-base font-black text-amber-300">{myStories.length}</span>
                  <span className="text-[10px] text-slate-300 font-semibold">Stories 24h</span>
                </div>
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-2xs">
                  <span className="block text-base font-black text-rose-300">{myTotalLikes}</span>
                  <span className="text-[10px] text-slate-300 font-semibold">Soutiens reçus</span>
                </div>
              </div>
            </div>

            {/* Sélecteur d'onglets du volet : Mes Posts vs Mes Stories */}
            <div className="flex items-center border-b border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-900/60 p-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setMySpaceTab('posts')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mySpaceTab === 'posts'
                    ? 'bg-white dark:bg-[#071322] text-[#0B2545] dark:text-white shadow-xs border border-slate-200 dark:border-navy-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>Mes publications ({myPosts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMySpaceTab('stories')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mySpaceTab === 'stories'
                    ? 'bg-white dark:bg-[#071322] text-[#CC131A] dark:text-rose-400 shadow-xs border border-slate-200 dark:border-navy-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                <Sparkles size={14} />
                <span>Mes Stories 24h ({myStories.length})</span>
              </button>
            </div>

            {/* Contenu défilable de l'espace personnel (isolation stricte du scroll) */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {mySpaceTab === 'posts' ? (
                myPosts.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-navy-900 flex items-center justify-center mx-auto text-slate-400">
                      <MessageSquarePlus size={24} />
                    </div>
                    <h4 className="text-sm font-black text-navy-900 dark:text-white">
                      Aucune publication partagée
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Vos constats et appels à l'entraide pour vos voisins de quartier apparaîtront ici.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMySpaceOpen(false);
                        setIsPostModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#154275] text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer mt-2"
                    >
                      <Plus size={14} />
                      <span>Créer un post</span>
                    </button>
                  </div>
                ) : (
                  myPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-900/40 space-y-2.5 transition hover:border-slate-300 dark:hover:border-navy-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                            {post.categorie || post.badgeFiltre}
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            {post.date}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPostToDelete(post)}
                          className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-[#CC131A] hover:bg-red-100 dark:hover:bg-red-900/60 flex items-center justify-center transition cursor-pointer"
                          title="Supprimer cette publication"
                          aria-label="Supprimer cette publication"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Aperçu média si existant avec agrandissement au clic */}
                      {post.video ? (
                        <div className="w-full h-36 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-200 dark:border-navy-700">
                          <video src={post.video} controls playsInline className="w-full h-full object-contain" />
                        </div>
                      ) : (post.image || post.photo || post.photoUrl) ? (
                        <div
                          onClick={() => setPreviewImageModal(post.image || post.photo || post.photoUrl)}
                          className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-200 dark:bg-navy-950 cursor-pointer group shadow-xs border border-slate-200 dark:border-navy-700"
                          title="Cliquer pour agrandir la photo"
                        >
                          <img
                            src={post.image || post.photo || post.photoUrl}
                            alt={post.texte || 'Aperçu du signalement'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-2xs">
                            <Eye size={15} />
                            <span>Agrandir la photo</span>
                          </div>
                        </div>
                      ) : null}

                      <p className="text-xs text-navy-900 dark:text-white leading-relaxed line-clamp-3">
                        {post.texte}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-navy-800 text-[11px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-black">
                          <Heart size={12} className="fill-current" />
                          <span>{getLikesCount(post.id, post.baseLikes || 1)} soutiens</span>
                        </span>
                        <span>{getViewsCount(post.id, post.baseViews || 15)} vues</span>
                        <span>{(commentsByPost[post.id]?.length || 0)} avis</span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                myStories.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
                      <Sparkles size={24} />
                    </div>
                    <h4 className="text-sm font-black text-navy-900 dark:text-white">
                      Aucune Story active
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Les stories vous permettent de partager un flash d'observation terrain visible 24h par vos voisins.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMySpaceOpen(false);
                        setIsStoryModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer mt-2"
                    >
                      <Sparkles size={14} />
                      <span>Ajouter une story 24h</span>
                    </button>
                  </div>
                ) : (
                  myStories.map((story) => (
                    <div
                      key={story.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-900/40 flex items-center justify-between gap-3"
                    >
                      <div
                        onClick={() => handleOpenStory(story)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative">
                          {story.video ? (
                            <div className="w-full h-full flex items-center justify-center bg-black text-amber-400">
                              <Video size={18} />
                            </div>
                          ) : story.image ? (
                            <img src={story.image} alt={story.texte} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${story.gradientClass || 'from-[#0B2545] to-slate-950'} flex items-center justify-center text-white text-[10px] font-black`}>
                              Texte
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-navy-900 dark:text-white truncate group-hover:text-red-500 transition">
                            {story.texte}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                              <Timer size={10} />
                              <span>{story.expiration || '24h actif'}</span>
                            </span>
                            <span>·</span>
                            <span>{story.quartier}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenStory(story)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-navy-800 text-navy-900 dark:text-white text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
                        >
                          Voir
                        </button>
                        <button
                          type="button"
                          onClick={() => setStoryToDelete(story)}
                          className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-[#CC131A] hover:bg-red-100 flex items-center justify-center transition cursor-pointer"
                          title="Supprimer cette story"
                          aria-label="Supprimer cette story"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Pied du volet */}
            <div className="p-4 border-t border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-900/50 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Espace solidaire Thiaroye-sur-Mer
              </span>
              <button
                type="button"
                onClick={() => setIsMySpaceOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-navy-800 hover:bg-slate-300 text-navy-900 dark:text-white text-xs font-bold transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression d'une Story par son auteur */}
      {storyToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setStoryToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B1E36] rounded-2xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-navy-100 dark:border-navy-800 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-black text-navy-900 dark:text-white">
                Supprimer cette Story ?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Votre observation flash 24h sera immédiatement retirée de l'espace Communauté.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStoryToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStory(storyToDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 size={16} />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression d'une publication par son auteur (au-dessus de Mon Espace) */}
      {postToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPostToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B1E36] rounded-2xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-navy-100 dark:border-navy-800 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-black text-navy-900 dark:text-white">
                Supprimer cette publication ?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Cette publication sera définitivement retirée du fil public de la Communauté.
              </p>
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-left">
                ℹ️ <strong>Espace Autorités préservé :</strong> Cette action retire la publication du fil citoyen sans altérer les signalements officiels enregistrés dans le système.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDeletePost(postToDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 size={16} />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </CitizenShell>
  );
}
