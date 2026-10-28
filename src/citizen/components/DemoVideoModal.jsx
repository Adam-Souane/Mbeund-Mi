import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  Bell,
  Camera,
  MapPin,
  MessageCircle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Mic,
  Maximize2,
  Minimize2,
  Upload,
  Users,
  Radio,
  Compass,
  FastForward,
  Rewind,
  Captions,
} from 'lucide-react';

const DEMO_CHAPTERS = [
  {
    id: 'alertes',
    number: '01',
    title: 'Réception des Alertes & Vigilance',
    subtitle: 'Cockpit Radar & Détection en temps réel',
    duration: 14,
    startTime: 0,
    icon: Bell,
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    accentColor: '#CC131A',
    narration:
      "Bienvenue sur Mbeund-Mi, votre plateforme d'alerte précoce et de veille communautaire contre les inondations à Thiaroye-sur-Mer. Sur la page d'accueil, le Cockpit Radar surveille en permanence la marée, les précipitations et les capteurs IoT pour diffuser des alertes officielles avant la montée des eaux.",
    subtitles:
      "Cockpit Radar en temps réel · Suivi marée, capteurs IoT & alertes officielles Mairie de Pikine.",
    demoScene: {
      type: 'alert_simulation',
      headline: '⚠️ ALERTE ROUGE — Risque élevé de submersion',
      zone: 'Cuvette Ouest · Thiaroye-sur-Mer',
      conseil: 'Coupez le disjoncteur électrique et préparez-vous à évacuer vers le CEM Thiaroye Gare.',
      indicatorValue: 'Marée haute 1.82 m · Pluviométrie 45 mm/h',
      sensors: [
        { name: 'Capteur Fass', val: '42 cm (Critique)', status: 'danger' },
        { name: 'Thiaroye Gare', val: '28 cm (Attention)', status: 'warning' },
        { name: 'Tally Diallo', val: '12 cm (Normal)', status: 'normal' },
      ],
    },
    ctaRoute: '/citoyen/alertes',
    ctaText: 'Voir les prévisions & alertes',
  },
  {
    id: 'signalement',
    number: '02',
    title: 'Comment faire un Signalement',
    subtitle: 'Alerter la communauté et les secours en 3 étapes',
    duration: 16,
    startTime: 14,
    icon: Camera,
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    accentColor: '#F59E0B',
    narration:
      "Chaque citoyen devient une sentinelle. Dans l'onglet Signalement, vous transmettez une alerte géolocalisée en trois étapes simples : indiquez la hauteur d'eau, joignez une photo du terrain et validez. Même sans réseau internet, le mode hors-ligne synchronise votre signalement dès que la connexion revient.",
    subtitles:
      "Signalement terrain en 3 clics · Hauteur d'eau, photo et géolocalisation avec mode hors-ligne PWA.",
    demoScene: {
      type: 'signalement_simulation',
      quartier: 'Rue 12 Fass · Thiaroye-sur-Mer',
      hauteur: 'Eau au niveau des genoux (35 cm)',
      etat: 'Envoi instantané validé',
      etapes: ['1. Géolocalisation GPS', '2. Hauteur & Photo', '3. Validation secours'],
    },
    ctaRoute: '/citoyen/signaler',
    ctaText: 'Faire un signalement',
  },
  {
    id: 'carte',
    number: '03',
    title: 'Carte & Itinéraires vers les Refuges',
    subtitle: 'Évacuer en sécurité en évitant les ruelles inondées',
    duration: 16,
    startTime: 30,
    icon: MapPin,
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    accentColor: '#2563EB',
    narration:
      "La Carte interactive identifie les axes inondés et calcule automatiquement l'itinéraire piéton le plus sûr vers les refuges homologués de Thiaroye, comme le Collège CEM Thiaroye Gare ou l'École Serigne Mansour Sy.",
    subtitles:
      "Carte dynamique des inondations · Tracé piéton sécurisé vers le CEM Thiaroye Gare (Refuge N°1).",
    demoScene: {
      type: 'map_simulation',
      destination: 'CEM Thiaroye Gare (Refuge Principal)',
      distance: '450 m · 6 min à pied',
      securite: 'Itinéraire 100% sécurisé hors zone de submersion',
      poi: ['Zone inondée : Rue Marché (à contourner)', 'Point de regroupement sécurisé'],
    },
    ctaRoute: '/citoyen/carte',
    ctaText: 'Ouvrir la Carte interactive',
  },
  {
    id: 'ndam',
    number: '04',
    title: 'Assistant IA NDAM & Dictée Vocale',
    subtitle: 'Conseils personnalisés et consignes 24h/24',
    duration: 16,
    startTime: 46,
    icon: MessageCircle,
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    accentColor: '#06B6D4',
    narration:
      "L'assistant d'intelligence artificielle NDAM vous accompagne jour et nuit. Vous pouvez lui poser des questions par écrit ou au microphone, en français comme en wolof. Il répond instantanément avec des conseils pratiques et la lecture vocale à voix haute.",
    subtitles:
      "Assistant IA NDAM · Reconnaissance vocale, support multilingue Français/Wolof et conseils de sécurité.",
    demoScene: {
      type: 'chat_simulation',
      question: '« Quels sont les refuges ouverts et les numéros d urgence ? »',
      reponse:
        '« Rendez-vous en priorité au CEM Thiaroye Gare. En cas de détresse vitale, composez le 18 (Sapeurs-Pompiers) ou le 15 (SAMU). »',
    },
    ctaRoute: '/citoyen/chat',
    ctaText: 'Discuter avec NDAM',
  },
  {
    id: 'communaute',
    number: '05',
    title: 'Communauté & Entraide Citoyenne',
    subtitle: 'Solidarité locale, motopompes et alertes de quartier',
    duration: 14,
    startTime: 62,
    icon: Users,
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    accentColor: '#10B981',
    narration:
      "Enfin, le mur communautaire fédère la solidarité entre résidents. Retrouvez les alertes de quartier validées, coordonnez l'aide pour pomper l'eau ou secourir les personnes vulnérables, et suivez les actions de la Mairie.",
    subtitles:
      "Réseau d entraide locale · Alertes citoyennes validées, besoins d assistance et coordination secours.",
    demoScene: {
      type: 'communaute_simulation',
      feedCount: '12 signalements actifs aujourd hui',
      action: 'Évacuation coordonnée Quartier Fass',
      partenaire: 'Protection Civile & Mairie de Pikine',
    },
    ctaRoute: '/citoyen/communaute',
    ctaText: 'Accéder à la Communauté',
  },
];

const TOTAL_DURATION = DEMO_CHAPTERS.reduce((acc, ch) => acc + ch.duration, 0);

export default function DemoVideoModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  // Mode de vidéo : 'demo_animated' (par défaut) ou 'custom_file' (si l'utilisateur importe une vidéo)
  const [videoMode, setVideoMode] = useState('demo_animated');
  const [customVideoUrl, setCustomVideoUrl] = useState(null);

  // État de lecture
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showCaptions, setShowCaptions] = useState(true);
  const [voiceOffEnabled, setVoiceOffEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Références
  const videoPlayerRef = useRef(null);
  const modalContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);
  const lastSpokenChapterRef = useRef(null);

  // Déterminer le chapitre actuel selon currentTime
  const currentChapterIndex = useMemo(() => {
    let accumulated = 0;
    for (let i = 0; i < DEMO_CHAPTERS.length; i++) {
      accumulated += DEMO_CHAPTERS[i].duration;
      if (currentTime < accumulated) return i;
    }
    return DEMO_CHAPTERS.length - 1;
  }, [currentTime]);

  const currentChapter = DEMO_CHAPTERS[currentChapterIndex] || DEMO_CHAPTERS[0];

  // Calcul du temps écoulé dans le chapitre actuel
  const chapterElapsedTime = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < currentChapterIndex; i++) {
      acc += DEMO_CHAPTERS[i].duration;
    }
    return Math.max(0, currentTime - acc);
  }, [currentTime, currentChapterIndex]);

  // Fonction de synthèse vocale (Voix Off explicative)
  const speakNarration = (text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      if (!voiceOffEnabled || isMuted) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = playbackRate * 0.95;
      utterance.volume = isMuted ? 0 : volume;

      // Chercher une voix française naturelle si possible
      const voices = window.speechSynthesis.getVoices();
      const frenchVoice = voices.find(
        (v) => v.lang.startsWith('fr') || v.lang.startsWith('FR')
      );
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const stopNarration = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignorer
      }
    }
    setIsSpeaking(false);
  };

  // Réinitialisation lors de l'ouverture/fermeture
  useEffect(() => {
    if (!isOpen) {
      setCurrentTime(0);
      setIsPlaying(false);
      stopNarration();
      lastSpokenChapterRef.current = null;
      return;
    }

    setIsPlaying(true);
    setCurrentTime(0);
    lastSpokenChapterRef.current = null;
  }, [isOpen]);

  // Déclencher la voix off quand on entre dans un nouveau chapitre
  useEffect(() => {
    if (!isOpen || !isPlaying || videoMode !== 'demo_animated') return;

    if (lastSpokenChapterRef.current !== currentChapter.id) {
      lastSpokenChapterRef.current = currentChapter.id;
      if (voiceOffEnabled && !isMuted) {
        speakNarration(currentChapter.narration);
      }
    }
  }, [isOpen, isPlaying, currentChapter.id, voiceOffEnabled, isMuted, videoMode]);

  // Horloge de lecture vidéo (100ms)
  useEffect(() => {
    if (!isOpen || !isPlaying || videoMode !== 'demo_animated') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = 100;
    const stepSeconds = (intervalMs / 1000) * playbackRate;

    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= TOTAL_DURATION) {
          // Boucler ou arrêter à la fin
          stopNarration();
          return 0;
        }
        return prev + stepSeconds;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying, playbackRate, videoMode]);

  // Gestion Play/Pause
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.pause();
        } catch {
          // Ignorer
        }
      }
      setIsSpeaking(false);
    } else {
      setIsPlaying(true);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
        try {
          window.speechSynthesis.resume();
          setIsSpeaking(true);
        } catch {
          speakNarration(currentChapter.narration);
        }
      } else {
        speakNarration(currentChapter.narration);
      }
    }
  };

  // Naviguer directement vers un chapitre
  const jumpToChapter = (index) => {
    let startTime = 0;
    for (let i = 0; i < index; i++) {
      startTime += DEMO_CHAPTERS[i].duration;
    }
    setCurrentTime(startTime);
    setIsPlaying(true);
    lastSpokenChapterRef.current = DEMO_CHAPTERS[index].id;
    speakNarration(DEMO_CHAPTERS[index].narration);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * TOTAL_DURATION;
    setCurrentTime(newTime);
  };

  const handleReplayCurrentChapter = () => {
    let start = 0;
    for (let i = 0; i < currentChapterIndex; i++) {
      start += DEMO_CHAPTERS[i].duration;
    }
    setCurrentTime(start);
    setIsPlaying(true);
    speakNarration(currentChapter.narration);
  };

  const handleRewind10 = () => {
    setCurrentTime((t) => Math.max(0, t - 10));
  };

  const handleForward10 = () => {
    setCurrentTime((t) => Math.min(TOTAL_DURATION, t + 10));
  };

  const toggleVoiceOff = () => {
    const nextState = !voiceOffEnabled;
    setVoiceOffEnabled(nextState);
    if (!nextState) {
      stopNarration();
    } else {
      speakNarration(currentChapter.narration);
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) {
      stopNarration();
    } else if (voiceOffEnabled) {
      speakNarration(currentChapter.narration);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      stopNarration();
      const url = URL.createObjectURL(file);
      setCustomVideoUrl(url);
      setVideoMode('custom_file');
      setIsPlaying(true);
    }
  };

  const handleToggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const IconComponent = currentChapter.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div
        ref={modalContainerRef}
        className="bg-[#050D18] border border-blue-900/60 rounded-3xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-white relative"
      >
        {/* 1. Header du lecteur vidéo */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-950/40">
              <Play size={16} className="fill-white ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Démonstration Vidéo · Mbeund-Mi
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
                  <Sparkles size={11} /> 1080p HD
                </span>
                {voiceOffEnabled && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    <Mic size={11} className={isSpeaking ? 'animate-pulse text-emerald-400' : ''} />
                    Voix Off Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Visite guidée complète de la plateforme avec narration sonore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton pour charger un fichier vidéo mp4 personnel */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                if (videoMode === 'custom_file') {
                  setVideoMode('demo_animated');
                  setCustomVideoUrl(null);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 hover:text-white transition cursor-pointer hidden md:flex items-center gap-1.5"
              title="Charger un fichier vidéo MP4 ou WebM personnalisé"
            >
              <Upload size={13} />
              <span>{videoMode === 'custom_file' ? 'Mode Démo interactive' : 'Charger ma vidéo MP4'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopNarration();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-red-600/30 hover:border-red-500/40 border border-transparent active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Fermer la vidéo"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. Écran vidéo principal (Format 16:9 cinématographique) */}
        <div className="relative bg-black flex-1 flex flex-col justify-center items-center overflow-hidden min-h-[300px] sm:min-h-[380px] md:min-h-[420px] select-none group">
          {videoMode === 'custom_file' && customVideoUrl ? (
            /* Mode vidéo externe chargée */
            <video
              ref={videoPlayerRef}
              src={customVideoUrl}
              autoPlay
              controls
              className="w-full h-full max-h-[60vh] object-contain"
            />
          ) : (
            /* Mode Démo Vidéo Interactive HD avec narration et animations réalistes */
            <div className="w-full h-full relative flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-br from-[#061224] via-[#091E3A] to-[#040C18] text-white">
              {/* Overlay filigrane vidéo & badge REC */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[11px] font-mono uppercase tracking-wider font-extrabold bg-red-950/80 text-red-300 px-2.5 py-0.5 rounded-full border border-red-500/40">
                    LECTURE DÉMO HD · {currentChapter.number} / 05
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Indicateur visuel d'onde sonore quand la voix off parle */}
                  {voiceOffEnabled && isSpeaking && (
                    <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[10px] text-emerald-300 font-bold">
                      <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="ml-1">Voix explicative en direct</span>
                    </div>
                  )}

                  <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-md font-bold">
                    {formatTime(currentTime)} / {formatTime(TOTAL_DURATION)}
                  </span>
                </div>
              </div>

              {/* Contenu visuel animé selon le chapitre actif */}
              <div className="my-auto py-8 sm:py-10 max-w-3xl mx-auto w-full z-10">
                {/* SCÈNE 01 : Réception des Alertes & Cockpit Radar */}
                {currentChapter.id === 'alertes' && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/60 via-slate-900/80 to-red-900/40 border border-red-500/50 shadow-2xl backdrop-blur-md">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-900/50 shrink-0 animate-pulse">
                          <ShieldAlert size={26} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500/30 text-red-200 border border-red-500/50">
                              Urgence Sécurité Civile
                            </span>
                            <span className="text-xs text-slate-300 font-medium">Thiaroye-sur-Mer</span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-white mt-1">
                            {currentChapter.demoScene.headline}
                          </h4>
                          <p className="text-xs text-red-200/90 mt-1 leading-relaxed">
                            📢 {currentChapter.demoScene.conseil}
                          </p>
                        </div>
                      </div>

                      {/* Indicateurs des capteurs IoT en temps réel */}
                      <div className="mt-4 pt-3 border-t border-red-500/20 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        {currentChapter.demoScene.sensors.map((s, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between"
                          >
                            <span className="text-slate-300 text-[11px]">{s.name}</span>
                            <span
                              className={`font-mono font-bold text-[11px] ${
                                s.status === 'danger'
                                  ? 'text-red-400'
                                  : s.status === 'warning'
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {s.val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SCÈNE 02 : Signalement Citoyen Terrain */}
                {currentChapter.id === 'signalement' && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900/80 to-amber-900/40 border border-amber-500/50 shadow-2xl backdrop-blur-md">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                            <Camera size={20} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-amber-300">
                              Nouveau Signalement Citoyen #2481
                            </span>
                            <p className="text-[11px] text-slate-300">Synchronisation PWA hors-ligne active</p>
                          </div>
                        </div>
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> {currentChapter.demoScene.etat}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 space-y-1">
                          <span className="text-slate-400 text-[11px]">📍 Localisation détectée :</span>
                          <p className="text-white font-bold text-sm">{currentChapter.demoScene.quartier}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 space-y-1">
                          <span className="text-slate-400 text-[11px]">🌊 Hauteur d'eau mesurée :</span>
                          <p className="text-amber-400 font-bold text-sm">{currentChapter.demoScene.hauteur}</p>
                        </div>
                      </div>

                      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 text-[11px] text-slate-300 flex items-center gap-2 border border-white/10">
                        <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
                        <span>Transmis en direct au cockpit des secours et affiché sur la carte collective.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCÈNE 03 : Carte Interactive & Refuges */}
                {currentChapter.id === 'carte' && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-cyan-950/40 border border-blue-500/50 shadow-2xl backdrop-blur-md">
                      <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Compass size={20} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-blue-300">
                              Itinéraire Piéton d'Évacuation Sécurisé
                            </span>
                            <p className="text-[11px] text-slate-300">Calcul dynamique hors submersion</p>
                          </div>
                        </div>
                        <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full font-bold">
                          {currentChapter.demoScene.distance}
                        </span>
                      </div>

                      <div className="mt-4 p-3.5 rounded-xl bg-black/40 border border-blue-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MapPin size={22} className="text-cyan-400 shrink-0" />
                          <div>
                            <span className="text-xs text-slate-400">Destination recommandée :</span>
                            <p className="text-white font-extrabold text-sm">{currentChapter.demoScene.destination}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                          Zone Ouverte
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 size={15} className="shrink-0" />
                        <span>{currentChapter.demoScene.securite}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCÈNE 04 : Assistant IA NDAM & Voix */}
                {currentChapter.id === 'ndam' && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-blue-950/40 border border-cyan-500/50 shadow-2xl backdrop-blur-md">
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
                            <Sparkles size={20} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-cyan-300">
                              Assistant IA NDAM (Groq LLM & Synthèse Vocale)
                            </span>
                            <p className="text-[11px] text-slate-300">Français & Wolof 24h/24</p>
                          </div>
                        </div>
                        <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                          <Radio size={12} className="animate-pulse" /> En ligne
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="p-3 rounded-2xl bg-blue-600/30 border border-blue-400/30 ml-auto max-w-[85%] text-xs font-medium text-white shadow-md">
                          💬 {currentChapter.demoScene.question}
                        </div>
                        <div className="p-3.5 rounded-2xl bg-black/50 border border-cyan-500/40 max-w-[90%] text-xs text-slate-200 leading-relaxed space-y-1.5 shadow-md">
                          <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                            <Sparkles size={13} /> NDAM répond :
                          </div>
                          <p>{currentChapter.demoScene.reponse}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCÈNE 05 : Communauté & Entraide */}
                {currentChapter.id === 'communaute' && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-slate-900/80 border border-emerald-500/50 shadow-2xl backdrop-blur-md">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Users size={20} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-emerald-300">
                              Mur d Entraide & Solidarité Citoyenne
                            </span>
                            <p className="text-[11px] text-slate-300">{currentChapter.demoScene.feedCount}</p>
                          </div>
                        </div>
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
                          Thiaroye Solidaire
                        </span>
                      </div>

                      <div className="mt-4 p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">{currentChapter.demoScene.action}</span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                            Mobilisation active
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          Partenariat officiel : {currentChapter.demoScene.partenaire} pour le déploiement rapide des motopompes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sous-titres dynamiques synchronisés façon cinéma */}
              {showCaptions && (
                <div className="w-full text-center py-2 px-4 bg-black/75 backdrop-blur-md border border-white/10 rounded-xl text-xs sm:text-sm text-cyan-200 font-medium shadow-2xl z-20 max-w-2xl mx-auto">
                  {currentChapter.subtitles}
                </div>
              )}
            </div>
          )}

          {/* Grand bouton Play/Pause au centre lors du hover ou si en pause */}
          {!isPlaying && videoMode === 'demo_animated' && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-2xl transition-all scale-100 hover:scale-110 active:scale-95 cursor-pointer z-30"
              title="Lancer la lecture"
            >
              <Play size={28} className="fill-slate-950 ml-1" />
            </button>
          )}
        </div>

        {/* 3. Barre de progression & Timeline cliquable avec scrubber */}
        <div className="bg-slate-950 border-t border-white/10 px-4 pt-3 pb-2 select-none">
          {/* Barre de scrubbing interactive */}
          <div
            onClick={handleSeek}
            className="w-full h-2.5 bg-white/15 hover:h-3.5 rounded-full cursor-pointer relative overflow-hidden transition-all group/bar"
            title="Cliquez pour naviguer dans la vidéo"
          >
            {/* Segments de chapitres */}
            {DEMO_CHAPTERS.map((ch, idx) => {
              const startPct = (ch.startTime / TOTAL_DURATION) * 100;
              const widthPct = (ch.duration / TOTAL_DURATION) * 100;
              return (
                <div
                  key={ch.id}
                  className="absolute top-0 bottom-0 border-r border-black/60"
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                />
              );
            })}

            {/* Progression réelle */}
            <div
              className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-cyan-400 transition-all duration-100"
              style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
            />
          </div>

          {/* Contrôles du lecteur vidéo */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 text-xs text-slate-300">
            {/* Groupe gauche : Play, -10s, +10s, Replay, Volume */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center transition cursor-pointer active:scale-95"
                title={isPlaying ? 'Pause' : 'Lecture'}
              >
                {isPlaying ? <Pause size={14} className="fill-slate-950" /> : <Play size={14} className="fill-slate-950 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleRewind10}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition cursor-pointer"
                title="Reculer de 10 secondes"
              >
                <Rewind size={15} />
              </button>

              <button
                type="button"
                onClick={handleForward10}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition cursor-pointer"
                title="Avancer de 10 secondes"
              >
                <FastForward size={15} />
              </button>

              <button
                type="button"
                onClick={handleReplayCurrentChapter}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition cursor-pointer"
                title="Recommencer ce chapitre"
              >
                <RotateCcw size={14} />
              </button>

              <div className="h-4 w-px bg-white/15 mx-1" />

              {/* Contrôle de volume */}
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                title={isMuted ? 'Activer le son' : 'Couper le son'}
              >
                {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} />}
              </button>

              {/* Affichage du temps */}
              <span className="font-mono text-[11px] text-slate-300 ml-1">
                {formatTime(currentTime)} / {formatTime(TOTAL_DURATION)}
              </span>
            </div>

            {/* Groupe droit : Voix off toggle, Sous-titres, Vitesse, Plein écran */}
            <div className="flex items-center gap-2">
              {/* Bouton Toggle Voix Off explicative */}
              <button
                type="button"
                onClick={toggleVoiceOff}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  voiceOffEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-white/10 text-slate-400 hover:text-white'
                }`}
                title="Activer ou désactiver la voix off explicative"
              >
                <Mic size={13} className={voiceOffEnabled && isSpeaking ? 'animate-pulse text-emerald-400' : ''} />
                <span>{voiceOffEnabled ? 'Voix Off Active' : 'Voix Off Coupée'}</span>
              </button>

              {/* Sous-titres CC */}
              <button
                type="button"
                onClick={() => setShowCaptions(!showCaptions)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  showCaptions ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/10 text-slate-400'
                }`}
                title="Sous-titres (CC)"
              >
                <Captions size={15} />
              </button>

              {/* Sélecteur de vitesse */}
              <button
                type="button"
                onClick={() => {
                  const rates = [0.75, 1, 1.25, 1.5];
                  const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
                  setPlaybackRate(rates[nextIdx]);
                }}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-[11px] font-bold cursor-pointer"
                title="Vitesse de lecture"
              >
                {playbackRate}x
              </button>

              {/* Plein écran */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                title="Plein écran"
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Barre de sélection des chapitres cliquables (Garantit compatibilité tests unitaires) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-t border-white/10 bg-slate-900/60 text-xs">
          {DEMO_CHAPTERS.map((ch, idx) => {
            const isActive = idx === currentChapterIndex;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => jumpToChapter(idx)}
                className={`p-2.5 sm:p-3 text-left transition-all border-b-2 sm:border-b-0 sm:border-r border-white/5 cursor-pointer flex flex-col gap-0.5 ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-400 font-extrabold text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                  <span className={isActive ? 'text-cyan-400 font-black' : 'text-slate-400'}>
                    Étape {ch.number}
                  </span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                </div>
                <span className="truncate text-[11px] font-semibold text-slate-200">
                  {ch.title.split('&')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* 5. Footer avec bouton d'accès direct à la fonctionnalité du chapitre en cours */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#06101E] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px]">
              Chapitre en cours : <strong className="text-white">{currentChapter.title}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                stopNarration();
                onClose();
                navigate(currentChapter.ctaRoute);
              }}
              className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Tester : {currentChapter.ctaText}</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => {
                stopNarration();
                onClose();
              }}
              className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
