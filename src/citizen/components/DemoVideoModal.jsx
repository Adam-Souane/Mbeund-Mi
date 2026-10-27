import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';

const DEMO_CHAPTERS = [
  {
    id: 'alertes',
    number: '01',
    title: 'Réception des Alertes & Vigilance',
    subtitle: 'Comment les citoyens sont prévenus en temps réel',
    duration: 10, // secondes par chapitre en mode autoplay
    icon: Bell,
    badgeColor: 'bg-red-500/20 text-red-500 border-red-500/30',
    accentColor: '#CC131A',
    description:
      'Lorsque le modèle d\'IA prédictif ou les capteurs IoT détectent un risque critique, une alerte officielle est diffusée instantanément à tous les résidents.',
    actionsList: [
      'Bannière d\'urgence avec le niveau de risque (Jaune, Orange, Rouge)',
      'Consignes claires émises par la Protection Civile et la Mairie de Pikine',
      'Cloche de notifications synchronisée en direct via WebSockets',
    ],
    demoScene: {
      type: 'alert_simulation',
      headline: '⚠️ ALERTE ROUGE — Inondation imminente',
      zone: 'Cuvette Ouest · Thiaroye-sur-Mer',
      conseil: 'Coupez le disjoncteur électrique et préparez-vous à évacuer vers le CEM Thiaroye Gare.',
      indicatorValue: '45 mm pluie / marée haute',
    },
    ctaRoute: '/citoyen/alertes',
    ctaText: 'Voir les prévisions & alertes',
  },
  {
    id: 'signalement',
    number: '02',
    title: 'Comment faire un Signalement',
    subtitle: 'Alerter la communauté en 3 étapes simples',
    duration: 12,
    icon: Camera,
    badgeColor: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    accentColor: '#F59E0B',
    description:
      'Chaque habitant devient une sentinelle : signalez une ruelle inondée avec photo et géolocalisation, même sans connexion Internet grâce au mode hors-ligne.',
    actionsList: [
      'Indiquez la hauteur d\'eau (chevilles, genoux, taille)',
      'Prenez une photo sur le terrain (facultatif mais recommandé)',
      'Validation automatique ou stockage sécurisé dans la file hors-ligne (PWA)',
    ],
    demoScene: {
      type: 'signalement_simulation',
      quartier: 'Rue 12 Fass · Thiaroye',
      hauteur: 'Eau au niveau des genoux (35 cm)',
      etat: 'Envoi instantané validé',
    },
    ctaRoute: '/citoyen/signaler',
    ctaText: 'Faire un signalement',
  },
  {
    id: 'carte',
    number: '03',
    title: 'Carte & Itinéraires vers les Refuges',
    subtitle: 'Trouver un abri sûr sans risquer de se noyer',
    duration: 12,
    icon: MapPin,
    badgeColor: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    accentColor: '#2563EB',
    description:
      'La carte interactive calcule l\'itinéraire piéton sécurisé le plus rapide vers les points de rassemblement officiels de Thiaroye-sur-Mer.',
    actionsList: [
      'Visualisation en direct des ruelles inondées à contourner',
      'Refuges identifiés : CEM Thiaroye Gare, École Serigne Mansour Sy',
      'Guidage pas-à-pas avec bouton « Suivre l\'itinéraire »',
    ],
    demoScene: {
      type: 'map_simulation',
      destination: 'CEM Thiaroye Gare (Refuge Principal)',
      distance: '450 m · 6 min à pied',
      securite: 'Itinéraire 100% hors zone de submersion',
    },
    ctaRoute: '/citoyen/carte',
    ctaText: 'Ouvrir la Carte interactive',
  },
  {
    id: 'ndam',
    number: '04',
    title: 'Assistant IA NDAM & Dictée Vocale',
    subtitle: 'Votre guide vocal et textuel 24h/24',
    duration: 10,
    icon: MessageCircle,
    badgeColor: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
    accentColor: '#06B6D4',
    description:
      'Propulsé par l\'IA Cloud Groq et son moteur expert local, NDAM répond à vos questions en français ou en wolof, par écrit ou au micro.',
    actionsList: [
      'Microphone intégré pour dicter vos questions à la voix',
      'Bouton audio 🔊 pour écouter la réponse à voix haute',
      'Historique complet des discussions sauvegardé',
    ],
    demoScene: {
      type: 'chat_simulation',
      question: '« Quels sont les refuges les plus proches ? »',
      reponse: '« Rendez-vous au CEM Thiaroye Gare ou à l\'École Serigne Mansour Sy. En cas d\'urgence immédiate, composez le 18. »',
    },
    ctaRoute: '/citoyen/chat',
    ctaText: 'Discuter avec NDAM',
  },
];

export default function DemoVideoModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const progressTimerRef = useRef(null);

  const currentChapter = DEMO_CHAPTERS[currentChapterIndex];

  // Progression automatique façon vidéo
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isPlaying || !isOpen) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const intervalMs = 100;
    const totalMs = currentChapter.duration * 1000;
    const stepIncrement = (intervalMs / totalMs) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Passer au chapitre suivant
          setCurrentChapterIndex((idx) => {
            const nextIdx = (idx + 1) % DEMO_CHAPTERS.length;
            return nextIdx;
          });
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, currentChapterIndex, isOpen, currentChapter.duration]);

  const handleSelectChapter = (index) => {
    setCurrentChapterIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentChapterIndex((idx) => (idx === 0 ? DEMO_CHAPTERS.length - 1 : idx - 1));
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentChapterIndex((idx) => (idx + 1) % DEMO_CHAPTERS.length);
    setProgress(0);
  };

  const handleNavigateToAction = (route) => {
    onClose();
    navigate(route);
  };

  if (!isOpen) return null;

  const IconComponent = currentChapter.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0A192F] dark:bg-[#050D18] border border-blue-900/60 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white relative">
        {/* 1. Header du lecteur de démo */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Play size={16} className="fill-red-500 ml-0.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                Démonstration Vidéo · Mbeund-Mi
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
                  Présentation PFE
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Guide interactif étape par étape de la plateforme
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Fermer la vidéo"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Timeline des chapitres cliquables */}
        <div className="grid grid-cols-4 border-b border-white/10 bg-slate-950/40 text-xs">
          {DEMO_CHAPTERS.map((ch, idx) => {
            const isActive = idx === currentChapterIndex;
            const isCompleted = idx < currentChapterIndex;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => handleSelectChapter(idx)}
                className={`py-2.5 px-2 sm:px-4 text-left transition-all border-b-2 cursor-pointer flex flex-col gap-1 ${
                  isActive
                    ? 'border-cyan-400 bg-white/5 font-extrabold text-white'
                    : isCompleted
                    ? 'border-transparent text-slate-400 hover:bg-white/5'
                    : 'border-transparent text-slate-500 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold">
                  <span className={isActive ? 'text-cyan-400' : ''}>Étape {ch.number}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                </div>
                <span className="truncate text-[11px] sm:text-xs">{ch.title.split('&')[0]}</span>

                {/* Barre de progression miniature par chapitre */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-100 ${
                      isActive ? 'bg-cyan-400' : isCompleted ? 'bg-cyan-600' : 'bg-transparent'
                    }`}
                    style={{ width: isActive ? `${progress}%` : isCompleted ? '100%' : '0%' }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. Zone principale : Écran vidéo animé + Panneau explicatif */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-6 items-center">
          {/* Écran de simulation vidéo avec cadre mobile */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#051121] via-slate-950 to-[#0B2545] border border-blue-800/40 p-4 sm:p-6 shadow-2xl flex flex-col justify-between min-h-[300px] sm:min-h-[340px] overflow-hidden">
            {/* Badge de chapitre en superposition */}
            <div className="flex items-center justify-between relative z-10">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${currentChapter.badgeColor}`}>
                <IconComponent size={14} />
                Étape {currentChapter.number} · {currentChapter.title}
              </span>
              <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50">
                DEMO LIVE
              </span>
            </div>

            {/* Simulation visuelle animée selon le chapitre */}
            <div className="my-auto py-4 relative z-10">
              {currentChapter.id === 'alertes' && (
                <div className="space-y-3 p-4 rounded-2xl bg-red-950/40 border border-red-500/40 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center animate-bounce">
                      <ShieldAlert size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-red-200">{currentChapter.demoScene.headline}</h4>
                      <p className="text-xs text-red-300/80">{currentChapter.demoScene.zone}</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 text-xs text-slate-200 leading-relaxed border border-red-500/20">
                    📢 {currentChapter.demoScene.conseil}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-red-300 pt-1">
                    <span>Indicateurs capteurs :</span>
                    <span className="text-white font-mono bg-red-600/40 px-2 py-0.5 rounded">
                      {currentChapter.demoScene.indicatorValue}
                    </span>
                  </div>
                </div>
              )}

              {currentChapter.id === 'signalement' && (
                <div className="space-y-3 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300">Nouveau signalement citoyen</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> {currentChapter.demoScene.etat}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Localisation :</span>
                      <strong className="text-white">{currentChapter.demoScene.quartier}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Niveau d'eau :</span>
                      <strong className="text-amber-400">{currentChapter.demoScene.hauteur}</strong>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-slate-300 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Synchronisé avec le cockpit des secours et la carte
                    </div>
                  </div>
                </div>
              )}

              {currentChapter.id === 'carte' && (
                <div className="space-y-3 p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-300">Itinéraire vers le refuge sécurisé</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                      {currentChapter.demoScene.distance}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-blue-500/20 space-y-2 text-xs">
                    <div className="font-extrabold text-white text-sm flex items-center gap-2">
                      <MapPin size={16} className="text-cyan-400 shrink-0" />
                      {currentChapter.demoScene.destination}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      {currentChapter.demoScene.securite}
                    </div>
                  </div>
                </div>
              )}

              {currentChapter.id === 'ndam' && (
                <div className="space-y-3 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 text-xs font-black text-cyan-300">
                    <Sparkles size={15} />
                    Assistant IA NDAM (Groq LLM & Voix)
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-blue-600/30 text-white border border-blue-500/30 ml-auto max-w-[90%]">
                      {currentChapter.demoScene.question}
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/50 text-slate-100 border border-cyan-500/30 max-w-[90%] leading-relaxed text-[11px]">
                      {currentChapter.demoScene.reponse}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Barre de contrôle du lecteur vidéo */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between relative z-10 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold flex items-center justify-center transition cursor-pointer"
                  title={isPlaying ? 'Mettre en pause' : 'Reprendre la lecture'}
                >
                  {isPlaying ? <Pause size={14} className="fill-slate-950" /> : <Play size={14} className="fill-slate-950 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setProgress(0)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition cursor-pointer"
                  title="Recommencer cette étape"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Étape précédente"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-mono text-[11px] text-slate-400 px-1">
                  {currentChapterIndex + 1} / {DEMO_CHAPTERS.length}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Étape suivante"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Panneau explicatif du chapitre */}
          <div className="flex flex-col justify-between gap-5">
            <div className="space-y-3.5">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                  {currentChapter.subtitle}
                </span>
                <h4 className="text-xl font-black text-white leading-tight">
                  {currentChapter.title}
                </h4>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                {currentChapter.description}
              </p>

              {/* Liste des points clés */}
              <div className="space-y-2 pt-1">
                {currentChapter.actionsList.map((action, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton d'action directe pour essayer la fonctionnalité */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigateToAction(currentChapter.ctaRoute)}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg hover:shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{currentChapter.ctaText}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Footer de la modale */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Démo interactive PFE · Conçue pour Thiaroye-sur-Mer
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
}
