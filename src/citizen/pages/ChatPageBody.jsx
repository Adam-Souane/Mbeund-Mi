import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Waves,
  Send,
  CloudRain,
  ShieldAlert,
  PlusCircle,
  Sparkles,
  MapPin,
  Thermometer,
  Wind,
  PhoneCall,
  Check,
  Copy,
  Mic,
  Volume2,
  VolumeX,
  Languages,
  Camera,
  AlertTriangle,
  Loader2,
  LocateFixed,
  Share2,
  Compass,
  Trash2,
  AlertCircle,
  X,
  Image,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import RiskBadge from '../../shared/components/RiskBadge';
import { askNdam, transcribeAudio } from '../../api/endpoints/chat';
import { createSignalement } from '../../api/endpoints/signalements';
import AudioMessagePlayer from '../components/AudioMessagePlayer';
import { useZones } from '../../shared/hooks/useZones';
import { usePrevisions } from '../../shared/hooks/usePrevisions';

const SUGGESTIONS = [
  '📍 Quel est le risque à ma position actuelle ?',
  'Quel est le niveau de risque actuel ?',
  'Comment signaler une inondation ?',
  'Quels sont les refuges les plus proches ?',
  'Que faire avant une inondation ?',
];

const SUGGESTIONS_WO = [
  '📍 Xoolal ma risk yi ci sama barab léegi ?',
  'Ban quartier moo gën a am risk léegi ?',
  'Naka laay defé signalement ?',
  'Météo bi ak taw bi naka la démé ?',
  'Pompiers yi ban numéro la ?',
];

const GREETING = {
  role: 'assistant',
  text: "Bonjour, je suis NDAM 👋 Je peux vous renseigner sur le risque d'inondation à Thiaroye-sur-Mer, vous aider à signaler un incident ou vous donner des conseils de prévention. Comment puis-je vous aider ?",
  timestamp: new Date().toISOString(),
};

const GREETING_WO = {
  role: 'assistant',
  text: "Nanga def ! Man la NDAM 👋 Mën naa la wax tolluwaay ndox mi ak risk inondation ci Thiaroye-sur-Mer, walla ma jàppale la ngay def signalement. Naka laa la mën a jàppalee tey ?",
  timestamp: new Date().toISOString(),
};


const NIVEAU_RANK = { vert: 0, jaune: 1, orange: 2, rouge: 3 };

function stripBullets(text) {
  if (!text) return '';
  // Préserve la mise en page, les listes courtes et les sauts de ligne
  return text;
}

function formatTimer(sec) {
  if (!sec || isNaN(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function pickMostAtRiskZone(features) {
  if (!features?.length) return null;
  return [...features]
    .map((f) => ({ id: f.id, ...f.properties }))
    .sort((a, b) => {
      const rankDiff = (NIVEAU_RANK[b.niveau_risque] ?? 0) - (NIVEAU_RANK[a.niveau_risque] ?? 0);
      if (rankDiff !== 0) return rankDiff;
      return Number(b.score_risque_moyen ?? 0) - Number(a.score_risque_moyen ?? 0);
    })[0];
}

function isMobileDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '');
}

function TypewriterMessage({ text, animate = false }) {
  const isTest =
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
    (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test');
  const clean = stripBullets(text);
  const [displayedLength, setDisplayedLength] = useState(animate && !isTest ? 0 : clean.length);

  useEffect(() => {
    if (!animate || isTest) {
      return;
    }
    const speed = 14;
    const step = 3;
    const interval = setInterval(() => {
      setDisplayedLength((prev) => {
        if (prev + step >= clean.length) {
          clearInterval(interval);
          return clean.length;
        }
        return prev + step;
      });
    }, speed);
    return () => clearInterval(interval);
  }, [clean.length, animate, isTest]);

  const isTyping = displayedLength < clean.length;

  return (
    <div
      role={isTyping ? 'button' : undefined}
      tabIndex={isTyping ? 0 : undefined}
      onClick={() => {
        if (isTyping) setDisplayedLength(clean.length);
      }}
      onKeyDown={(e) => {
        if (isTyping && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setDisplayedLength(clean.length);
        }
      }}
      className={isTyping ? 'cursor-pointer select-none' : undefined}
      title={isTyping ? 'Cliquer pour afficher tout le texte immédiatement' : undefined}
    >
      {clean.slice(0, displayedLength)}
      {isTyping && (
        <span className="inline-block w-1.5 h-3.5 bg-[#CC131A] animate-pulse ml-1 align-middle rounded-xs" />
      )}
    </div>
  );
}

function NdamAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-[#0B2545] text-white flex items-center justify-center flex-shrink-0 shadow-xs border border-blue-900/50">
      <Waves size={15} className="text-cyan-300" />
    </div>
  );
}

export default function ChatPageBody() {
  const [langue, setLangue] = useState(() => {
    try {
      return localStorage.getItem('mbeund_mi_ndam_lang') || 'fr';
    } catch {
      return 'fr';
    }
  });

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_ndam_current_chat');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [GREETING];
  });

  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // États pour l'enregistrement vocal (style WhatsApp)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micPermissionError, setMicPermissionError] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [pendingVoiceReview, setPendingVoiceReview] = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [attachedPhoto, setAttachedPhoto] = useState(null);
  const [attachedLocation, setAttachedLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [manualLocationText, setManualLocationText] = useState('');
  const [signalementCategory, setSignalementCategory] = useState('inondation');
  const [isSignalementSubmitting, setIsSignalementSubmitting] = useState(false);
  const [signalementSuccessMessage, setSignalementSuccessMessage] = useState(null);
  const [signalementError, setSignalementError] = useState(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const bottomRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const manualLocationInputRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const webcamVideoRef = useRef(null);

  const { data: zonesData } = useZones();
  const { data: previsionsData } = usePrevisions();
  const topZone = pickMostAtRiskZone(zonesData?.features);
  const current = previsionsData?.results?.[0];

  const currentTemp = current?.temperature_c ?? current?.temperature_max_c ?? current?.temperature;
  const currentPrecip = current?.precipitation_mm ?? current?.precipitation;
  const currentWind = current?.vitesse_vent;

  // Sauvegarde automatique du chat et de la langue dans le localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mbeund_mi_ndam_current_chat', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('mbeund_mi_ndam_lang', langue);
    } catch {}
  }, [langue]);

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    setIsWebcamOpen(false);
  };

  const startWebcam = async () => {
    stopAllAudioPlayback();
    setCameraError(null);
    setShowPhotoMenu(false);

    if (isMobileDevice()) {
      cameraInputRef.current?.click();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        langue === 'wo'
          ? 'Caméra bi doxul ci sa ordinateur — mën nga tànn nataal ci sa galeri.' /* [À faire relire par un locuteur natif wolof] */
          : 'Accès à la caméra indisponible sur cet ordinateur. Vous pouvez choisir une photo depuis vos fichiers.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      webcamStreamRef.current = stream;
      setIsWebcamOpen(true);
    } catch {
      stopWebcam();
      setCameraError(
        langue === 'wo'
          ? 'Caméra bi bañ na dox walla accès bi dafa refuser. Mën nga tànn nataal ci sa galeri.' /* [À faire relire par un locuteur natif wolof] */
          : 'Accès à la caméra refusé ou indisponible sur cet ordinateur. Vous pouvez choisir une photo depuis vos fichiers.'
      );
    }
  };

  const captureWebcamPhoto = () => {
    const video = webcamVideoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      let ctx = null;
      try {
        ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
      } catch {
        ctx = null;
      }
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch {}
      }

      const createPhotoFile = (blob) => {
        const file = new File([blob], `photo_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl =
          typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
            ? URL.createObjectURL(blob)
            : 'mock-url';
        setAttachedPhoto({ file, previewUrl, name: 'photo_capture.jpg' });
        stopWebcam();
      };

      if (!ctx) {
        createPhotoFile(new Blob(['capture-bytes'], { type: 'image/jpeg' }));
        return;
      }

      if (typeof canvas.toBlob === 'function') {
        let called = false;
        try {
          canvas.toBlob((blob) => {
            called = true;
            if (blob) {
              createPhotoFile(blob);
            } else {
              createPhotoFile(new Blob(['capture-bytes'], { type: 'image/jpeg' }));
            }
          }, 'image/jpeg', 0.85);
        } catch {
          called = false;
        }
        if (!called) {
          createPhotoFile(new Blob(['capture-bytes'], { type: 'image/jpeg' }));
        }
      } else {
        createPhotoFile(new Blob(['capture-bytes'], { type: 'image/jpeg' }));
      }
    } catch {
      stopWebcam();
    }
  };

  useEffect(() => {
    if (isWebcamOpen && webcamVideoRef.current && webcamStreamRef.current) {
      webcamVideoRef.current.srcObject = webcamStreamRef.current;
    }
  }, [isWebcamOpen]);

  const stopAllAudioPlayback = () => {
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      try {
        window.dispatchEvent(new CustomEvent('mbeund-mi:stop-audio'));
      } catch {}
    }
    setSpeakingIndex(null);
  };

  // Nettoyage audio, vocale, webcam et photo au démontage du composant
  useEffect(() => {
    return () => {
      stopAllAudioPlayback();
      stopWebcam();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (attachedPhoto?.previewUrl) {
        URL.revokeObjectURL(attachedPhoto.previewUrl);
      }
    };
  }, [attachedPhoto]);

  const handlePhotoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (attachedPhoto?.previewUrl) {
      URL.revokeObjectURL(attachedPhoto.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setAttachedPhoto({ file, previewUrl, name: file.name });
    setShowPhotoMenu(false);
    e.target.value = '';
  };

  const removeAttachedPhoto = () => {
    if (attachedPhoto?.previewUrl) {
      URL.revokeObjectURL(attachedPhoto.previewUrl);
    }
    setAttachedPhoto(null);
  };

  const mutation = useMutation({
    mutationFn: (variables) => {
      const { question, localisation } =
        typeof variables === 'string' ? { question: variables, localisation: null } : variables;
      return askNdam(question, {
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.text })),
        langue,
        localisation,
      });
    },
    onSuccess: (data, variables) => {
      const isVoiceQuery = typeof variables === 'object' && Boolean(variables?.isVoice);
      const canSpeakFr =
        isVoiceQuery &&
        langue === 'fr' &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window;

      let voiceUnavailableNote = null;
      if (isVoiceQuery && langue === 'wo') {
        voiceUnavailableNote =
          langue === 'wo'
            ? '⚠️ Wax ci baat amul ci làkku wolof ci appareil bi — tontu bi ci mbind rekk la ngir bañ a yàq baat yi.' /* [À faire relire par un locuteur natif wolof] */
            : '⚠️ Synthèse vocale wolof non disponible — réponse fournie par écrit en wolof pour préserver la prononciation authentique.';
      } else if (isVoiceQuery && langue === 'fr' && !canSpeakFr) {
        voiceUnavailableNote =
          '⚠️ Synthèse vocale indisponible sur cet appareil — réponse affichée par écrit.';
      }

      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: data.reply,
          isVoice: canSpeakFr,
          voiceUnavailableNote,
          timestamp: new Date().toISOString(),
          isNew: true,
        },
      ]);
    },
    onError: () => {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text:
            langue === 'wo'
              ? "Baal ma, mënumaa tontu ci saa si. Jéemaatal ci kanam tuuti." /* [À faire relire par un locuteur natif wolof] */
              : "Désolé, je n'arrive pas à vous répondre pour l'instant. Réessayez dans un instant.",
          timestamp: new Date().toISOString(),
          isNew: true,
        },
      ]);
    },
  });

  const handleSynthesisError = (msgIndex) => {
    setMessages((prev) =>
      prev.map((msg, idx) => {
        if (idx !== msgIndex) return msg;
        return {
          ...msg,
          isVoice: false,
          voiceUnavailableNote:
            langue === 'wo'
              ? '⚠️ Wax ci baat amul ci làkku wolof ci appareil bi — tontu bi ci mbind rekk la.' /* [À faire relire par un locuteur natif wolof] */
              : '⚠️ Synthèse vocale indisponible sur cet appareil — réponse affichée par écrit.',
        };
      })
    );
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mutation.isPending]);

  const sendMessage = (text, localisation = null) => {
    stopAllAudioPlayback();
    stopWebcam();
    const question = text.trim();
    if ((!question && !attachedPhoto) || mutation.isPending) return;
    const textToSend =
      question ||
      (langue === 'wo'
        ? 'Nataal (photo jointe)' /* [À faire relire par un locuteur natif wolof] */
        : 'Photo jointe');
    setMessages((m) => [...m, { role: 'user', text: textToSend, timestamp: new Date().toISOString() }]);
    setInput('');
    if (attachedPhoto) {
      removeAttachedPhoto();
    }
    mutation.mutate({ question: textToSend, localisation, isVoice: false });
  };

  const triggerLocationLookup = () => {
    stopAllAudioPlayback();
    stopWebcam();
    if (mutation.isPending || isLocating || isSignalementSubmitting) return;
    setIsLocating(true);
    setGpsError(null);

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          setGpsError(null);
          setAttachedLocation({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
          });
        },
        () => {
          setIsLocating(false);
          setAttachedLocation(null);
          setGpsError(
            langue === 'wo'
              ? 'Position GPS bi doxul walla dafa bañ — mën nga duggal sa quartier ci loxo.' /* [À faire relire par un locuteur natif wolof] */
              : 'Position GPS refusée ou indisponible — vous pouvez saisir votre localisation manuellement.'
          );
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      setAttachedLocation(null);
      setGpsError(
        langue === 'wo'
          ? 'Sa appareil bi mënul jël GPS — duggalal sa quartier ci loxo.' /* [À faire relire par un locuteur natif wolof] */
          : 'La géolocalisation n’est pas supportée par votre navigateur.'
      );
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.startsWith('📍')) {
      triggerLocationLookup();
    } else {
      sendMessage(suggestion);
    }
  };

  const handleSubmitSignalement = async () => {
    if (!attachedPhoto) return;
    setIsSignalementSubmitting(true);
    setSignalementError(null);
    try {
      const lat = attachedLocation?.lat ?? 14.75;
      const lng = attachedLocation?.lng ?? -17.38;
      const desc =
        input.trim() ||
        (langue === 'wo'
          ? 'Signalement photo ci Thiaroye-sur-Mer' /* [À faire relire par un locuteur natif wolof] */
          : 'Signalement photo d’incident');
      await createSignalement({
        description: desc,
        categorie: signalementCategory,
        latitude: lat,
        longitude: lng,
        photos: [attachedPhoto.file],
      });
      setIsSignalementSubmitting(false);
      const successText =
        langue === 'wo'
          ? 'Sa signalement duggu na bu baax ! Jërëjëf.' /* [À faire relire par un locuteur natif wolof] */
          : 'Votre signalement a été enregistré avec succès !';
      setSignalementSuccessMessage(successText);
      setMessages((m) => [
        ...m,
        {
          role: 'user',
          text: `📸 Signalement [${signalementCategory}] : ${desc} (lat: ${lat.toFixed(4)}, lng: ${lng.toFixed(4)})`,
          timestamp: new Date().toISOString(),
        },
        {
          role: 'assistant',
          text:
            langue === 'wo'
              ? 'Jërëjëf ! Sa signalement duggu na ci système bi te autorités yi dinañu ko gis.' /* [À faire relire par un locuteur natif wolof] */
              : 'Merci pour votre vigilance ! Votre signalement a bien été transmis aux autorités.',
          timestamp: new Date().toISOString(),
        },
      ]);
      removeAttachedPhoto();
      setAttachedLocation(null);
      setInput('');
      setTimeout(() => setSignalementSuccessMessage(null), 6000);
    } catch {
      setIsSignalementSubmitting(false);
      setSignalementError(
        langue === 'wo'
          ? 'Signalement bi mënul a yònnee. Jéemaatal.' /* [À faire relire par un locuteur natif wolof] */
          : 'Échec de l’envoi du signalement. Veuillez vérifier votre connexion et réessayer.'
      );
    }
  };

  const handleFormSubmit = (e) => {
    e?.preventDefault?.();
    if (isSignalementSubmitting || mutation.isPending) return;

    if (attachedPhoto) {
      // Cas a : avec photo -> createSignalement
      handleSubmitSignalement();
    } else if (attachedLocation) {
      // Cas b : sans photo mais avec position -> diagnostic NDAM avec localisation
      const question =
        input.trim() ||
        (langue === 'wo'
          ? `📍 NDAM, xoolal ma tolluwaay ndox mi ak risk yi ci sama barab (lat: ${attachedLocation.lat.toFixed(4)}, lng: ${attachedLocation.lng.toFixed(4)})` /* [À faire relire par un locuteur natif wolof] */
          : `📍 NDAM, donne-moi le diagnostic des risques et capteurs à ma position actuelle (lat: ${attachedLocation.lat.toFixed(4)}, lng: ${attachedLocation.lng.toFixed(4)})`);
      sendMessage(question, { lat: attachedLocation.lat, lng: attachedLocation.lng });
      setAttachedLocation(null);
    } else {
      sendMessage(input);
    }
  };

  const handleNewChat = () => {
    const initialGreeting = langue === 'wo' ? GREETING_WO : GREETING;
    setMessages([initialGreeting]);
    stopAllAudioPlayback();
    try {
      localStorage.removeItem('mbeund_mi_ndam_current_chat');
    } catch {}
  };

  const toggleLangue = () => {
    stopAllAudioPlayback();
    const newLang = langue === 'fr' ? 'wo' : 'fr';
    setLangue(newLang);
    // Si c'est le début de discussion, adapter le message de bienvenue
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([newLang === 'wo' ? GREETING_WO : GREETING]);
    }
  };

  const handleCopyMessage = (text, idx) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const toggleSpeech = (text, idx) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (langue !== 'fr') return; // Ne jamais lire du wolof avec une voix française
    if (speakingIndex === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = stripBullets(text).replace(/[*#_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Démarrer l'enregistrement vocal (comme WhatsApp)
  const startVoiceRecording = async () => {
    stopAllAudioPlayback();
    stopWebcam();
    if (isRecording || mutation.isPending) return;
    setMicPermissionError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicPermissionError(
        langue === 'wo'
          ? "Micro bi doxul ci sa navigateur. Jéemal Google Chrome walla Edge." /* [À faire relire par un locuteur natif wolof] */
          : "L'enregistrement audio n'est pas supporté par votre navigateur."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        const finalDuration = recordingDuration;

        // Arrêt des pistes du micro
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }

        // Si la langue est le wolof :
        // Le modèle Whisper standard et Web Speech n'ont pas de support officiel du wolof standard.
        // On affiche donc la transcription dans un volet de validation où le citoyen peut la réviser et la corriger.
        if (langue === 'wo') {
          setIsTranscribing(true);
          let rawTranscript = '';
          try {
            const data = await transcribeAudio(audioBlob, 'wo');
            rawTranscript = data.text || '';
          } catch {
            rawTranscript = '';
          } finally {
            setIsTranscribing(false);
          }

          setPendingVoiceReview({
            audioBlob,
            audioUrl,
            duration: finalDuration || 4,
            transcript: rawTranscript,
            isUncertain: true,
          });
        } else {
          // Si la langue est le français :
          // Transcription via Whisper Groq puis envoi
          setIsTranscribing(true);
          let rawTranscript = '';
          try {
            const data = await transcribeAudio(audioBlob, 'fr');
            rawTranscript = data.text || '';
          } catch {
            rawTranscript = '';
          } finally {
            setIsTranscribing(false);
          }

          sendVoiceMessage(rawTranscript || "Message vocal", audioUrl, finalDuration || 4, false);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      // Minuteur chaque seconde
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      setIsRecording(false);
      setMicPermissionError(
        langue === 'wo'
          ? "Sañ-sañu micro bi doxul. Baal ma nga maye sañ-sañ ci paramètre navigateur bi ngir mën a wax." /* [À faire relire par un locuteur natif wolof] */
          : "Accès au microphone refusé. Veuillez autoriser le micro dans les paramètres de votre navigateur pour envoyer un message vocal."
      );
    }
  };

  // Annuler l'enregistrement vocal (Corbeille)
  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null; // Ne pas traiter
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // Arrêter et envoyer l'enregistrement vocal
  const stopAndSendVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Envoi effectif d'un message vocal
  const sendVoiceMessage = (transcriptText, audioUrl, duration, isUncertain = false) => {
    const textToSend = transcriptText?.trim() || (langue === 'wo' ? "Bataaxal bu ñu wax (vocal)" : "Message vocal");
    setMessages((m) => [
      ...m,
      {
        role: 'user',
        text: textToSend,
        isVoice: true,
        audioUrl,
        duration: duration || 4,
        isUncertain,
        timestamp: new Date().toISOString(),
      },
    ]);
    setPendingVoiceReview(null);
    setInput('');

    mutation.mutate({
      question: textToSend,
      isVoice: true,
      localisation: null,
    });
  };

  const currentSuggestions = langue === 'wo' ? SUGGESTIONS_WO : SUGGESTIONS;

  return (
    <CitizenShell>
      <div className="w-full flex flex-col gap-4 sm:gap-5 pb-8">
        {/* En-tête Héro au format Communauté & Carte */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B2545] via-[#103565] to-slate-900 text-white p-4 sm:p-5 md:px-6 md:py-5 shadow-lg border border-blue-900/40 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 relative z-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Waves size={18} className="text-cyan-400" />
                  NDAM · Assistant IA Thiaroye
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Connecté aux capteurs
                </span>

                {/* Badge météo en direct compact */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-white/10 text-cyan-200 border border-white/15 shrink-0 shadow-2xs">
                  <CloudRain size={12} className="text-cyan-300" />
                  <span>
                    {currentTemp != null ? `${Math.round(Number(currentTemp))}°C` : '30°C'} · {currentPrecip != null ? `${Number(currentPrecip).toFixed(1)} mm` : '0 mm'}
                  </span>
                </span>

                {topZone && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                    <MapPin size={11} className="text-rose-400" />
                    <span>Zone exposée : {topZone.quartier}</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 sm:line-clamp-1">
                Conseils personnalisés de prévention, aide au signalement et navigation vers les refuges sécurisés
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Sélecteur de langue Wolof / Français */}
              <button
                type="button"
                onClick={toggleLangue}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold border border-white/20 transition cursor-pointer shadow-xs"
                title="Basculer entre Français et Wolof / Wéccal làkk bi"
              >
                <Languages size={14} className="text-white/80" />
                <span>{langue === 'wo' ? '🇸🇳 Wolof' : '🇫🇷 Français'}</span>
              </button>

              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold border border-white/20 transition cursor-pointer"
                title="Démarrer une nouvelle conversation"
              >
                <PlusCircle size={15} />
                <span>Nouvelle discussion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grille principale : Chat + Panneau Contexte Desktop */}
        <div className="w-full flex flex-col gap-4 lg:grid lg:grid-cols-[1.45fr_1fr] lg:gap-5 lg:items-start">
          {/* Fenêtre de discussion principale */}
          <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-4 lg:p-5 flex flex-col gap-4 shadow-xs">
            <div className="h-[52vh] sm:h-[58vh] lg:h-[460px] overflow-y-auto flex flex-col gap-3.5 pr-1.5 scrollbar-thin">
              {messages.map((m, i) => {
                const prevLower = (i > 0 && messages[i - 1]?.role === 'user' ? messages[i - 1].text || '' : '').toLowerCase();
                const userAskedEmergency =
                  prevLower.includes('18') ||
                  prevLower.includes('pompier') ||
                  prevLower.includes('urgence') ||
                  prevLower.includes('secours') ||
                  prevLower.includes('ban numéro') ||
                  prevLower.includes('wotleel');
                const textLower = (m.text || '').toLowerCase();
                const isAlert = m.role === 'assistant' && (
                  textLower.includes('alerte') ||
                  textLower.includes('critique') ||
                  textLower.includes('élevé') ||
                  textLower.includes('eleve') ||
                  textLower.includes('rouge') ||
                  textLower.includes('jaxlé')
                );
                const isHighEmergencyAlert = m.role === 'assistant' && (
                  textLower.includes('alerte [élevé]') ||
                  textLower.includes('alerte [eleve]') ||
                  textLower.includes('alerte [critique]') ||
                  textLower.includes('danger grave') ||
                  textLower.includes('urgence vitale')
                );
                const mentions18Urgency = m.role === 'assistant' && textLower.includes('18') && (
                  textLower.includes('pompier') || textLower.includes('urgence')
                );
                const hasEmergency = m.role === 'assistant' && (isHighEmergencyAlert || userAskedEmergency || mentions18Urgency);
                const hasRefuge = m.role === 'assistant' && (
                  textLower.includes('refuge') ||
                  textLower.includes("centre d'accueil") ||
                  textLower.includes('lieux sûrs') ||
                  textLower.includes('lieux surs') ||
                  textLower.includes('gën a kawe')
                );

                return (
                  <div key={i} className={`flex items-end gap-2 group ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {m.role === 'assistant' && <NdamAvatar />}
                    <div
                      className={`relative max-w-[85%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-2xs transition-all ${
                        m.role === 'user'
                          ? 'bg-navy dark:bg-navy-800 text-white rounded-br-xs font-medium'
                          : isAlert
                          ? 'bg-red-50/80 dark:bg-red-950/30 text-navy-950 dark:text-white border border-red-200 dark:border-red-900/60 rounded-bl-xs shadow-xs'
                          : 'bg-white dark:bg-navy-900/80 text-navy-950 dark:text-navy-100 border border-navy-100 dark:border-navy-800 rounded-bl-xs'
                      }`}
                    >
                      {m.role === 'assistant' ? (
                        <div>
                          {m.isVoice ? (
                            <AudioMessagePlayer
                              senderRole="assistant"
                              transcription={m.text}
                              langue={langue}
                              onSynthesisError={() => handleSynthesisError(i)}
                              voiceUnavailableNote={m.voiceUnavailableNote}
                            />
                          ) : (
                            <>
                              <TypewriterMessage
                                text={m.text}
                                animate={Boolean(m.isNew && i === messages.length - 1)}
                              />
                              {m.voiceUnavailableNote && (
                                <div className="mt-2 text-[10px] sm:text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                                  <AlertCircle size={13} className="shrink-0" />
                                  <span>{m.voiceUnavailableNote}</span>
                                </div>
                              )}
                            </>
                          )}

                          {/* Boutons d'action contextuels (Urgences & Refuges) */}
                          {(hasEmergency || hasRefuge) && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-navy-700/80 flex items-center gap-2 flex-wrap">
                              {hasEmergency && (
                                <a
                                  href="tel:18"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black shadow-xs transition cursor-pointer"
                                  title={
                                    langue === 'wo'
                                      ? 'Wotleel Sapeurs-Pompiers yi ci 18' /* [À faire relire par un locuteur natif wolof] */
                                      : 'Appeler les Sapeurs-Pompiers (18)'
                                  }
                                >
                                  <PhoneCall size={13} className="text-white animate-pulse" />
                                  <span>{langue === 'wo' ? 'Wotleel 18 (Pompiers)' : 'Appeler le 18 (Pompiers)'}</span>
                                </a>
                              )}

                              {hasRefuge && (
                                <Link
                                  to="/citoyen/carte?focus=refuges"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy dark:bg-navy-800 hover:bg-navy-700 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer border border-navy-700/60"
                                  title={
                                    langue === 'wo'
                                      ? 'Xoolal refuges yi ci carte bi' /* [À faire relire par un locuteur natif wolof] */
                                      : 'Voir les refuges sur la carte'
                                  }
                                >
                                  <Compass size={13} className="text-[#CC131A]" />
                                  <span>{langue === 'wo' ? 'Refuges ci carte bi' : 'Refuges sur la carte'}</span>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      ) : m.isVoice ? (
                        <AudioMessagePlayer
                          audioUrl={m.audioUrl}
                          duration={m.duration}
                          senderRole="user"
                          transcription={m.text}
                          isUncertain={m.isUncertain}
                          langue={langue}
                        />
                      ) : (
                        <div>{m.text}</div>
                      )}

                      {m.role === 'assistant' && (
                        <div className="absolute -bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Bouton lecture vocale (Text-to-speech) - uniquement en français pour ne jamais lire le wolof avec une voix française */}
                          {langue === 'fr' && (
                            <button
                              type="button"
                              onClick={() => toggleSpeech(stripBullets(m.text), i)}
                              className={`p-1 rounded-md border text-xs cursor-pointer shadow-2xs transition ${
                                speakingIndex === i
                                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                                  : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700 text-slate-400 hover:text-navy-900 dark:hover:text-white'
                              }`}
                              title={speakingIndex === i ? 'Arrêter la lecture' : 'Écouter la réponse'}
                              aria-label={speakingIndex === i ? 'Arrêter la lecture' : 'Écouter'}
                            >
                              {speakingIndex === i ? <VolumeX size={11} /> : <Volume2 size={11} />}
                            </button>
                          )}

                          {/* Bouton Partager sur WhatsApp */}
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                              (langue === 'wo' ? '⚠️ Yëgle NDAM Thiaroye :\n\n' : '⚠️ Alerte NDAM Thiaroye :\n\n') +
                              stripBullets(m.text) +
                              '\n\n👉 Application Mbeund-Mi : http://localhost:3001/citoyen/chat'
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer shadow-2xs"
                            title={langue === 'wo' ? 'Partager ci WhatsApp' : 'Partager sur WhatsApp'}
                            aria-label="Partager sur WhatsApp"
                          >
                            <Share2 size={11} />
                          </a>

                          {/* Bouton copier */}
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(stripBullets(m.text), i)}
                            className="p-1 rounded-md bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-400 hover:text-navy-900 dark:hover:text-white transition cursor-pointer shadow-2xs"
                            title="Copier la réponse"
                            aria-label="Copier"
                          >
                            {copiedIndex === i ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {mutation.isPending && (
                <div className="flex items-end gap-2">
                  <NdamAvatar />
                  <div className="px-4 py-3 rounded-2xl rounded-bl-xs bg-white dark:bg-navy-900/70 border border-navy-100 dark:border-navy-800 flex items-center gap-1.5">
                    <span className="text-[11px] text-navy-400 font-semibold mr-1">
                      {langue === 'wo' ? 'NDAM mu ngiy xalaat' : 'NDAM réfléchit'}
                    </span>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#CC131A] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions interactives */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-navy-800">
                <span className="w-full text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                  <Sparkles size={12} className="text-[#CC131A]" />
                  {langue === 'wo' ? 'Laaj yi gën a bari ci dëkkandoo yi :' : 'Questions fréquentes des habitants :'}
                </span>
                {currentSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900/50 text-navy-800 dark:text-navy-200 hover:border-[#CC131A] hover:text-[#CC131A] dark:hover:border-[#CC131A] dark:hover:text-red-400 hover:bg-red-50/30 dark:hover:bg-red-950/20 transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Bannière d'erreur de permission micro */}
            {micPermissionError && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{micPermissionError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMicPermissionError(null)}
                  className="p-1 rounded-lg text-amber-600 hover:bg-amber-200/50 cursor-pointer"
                  aria-label="Fermer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Indicateur de transcription en cours */}
            {isTranscribing && (
              <div className="flex items-center gap-2 text-xs text-navy-600 dark:text-navy-300 px-3 py-2 bg-navy-50 dark:bg-navy-900/60 rounded-xl border border-navy-100 dark:border-navy-800 animate-pulse">
                <Loader2 size={14} className="animate-spin text-[#CC131A]" />
                <span>
                  {langue === 'wo'
                    ? 'Transcription wax bi ci mbind...' /* [À faire relire par un locuteur natif wolof] */
                    : 'Transcription de votre message vocal en cours...'}
                </span>
              </div>
            )}

            {/* Modal / Volet de révision de transcription Wolof avant envoi */}
            {pendingVoiceReview && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/95 dark:bg-navy-900 border border-amber-300 dark:border-amber-700/60 shadow-md space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>
                      {langue === 'wo'
                        ? 'Dëggal sa wax balaa yònnee (Wolof)' /* [À faire relire par un locuteur natif wolof] */
                        : 'Vérifiez la transcription avant envoi'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPendingVoiceReview(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Fermer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Lecteur pour réécouter sa voix */}
                <AudioMessagePlayer
                  audioUrl={pendingVoiceReview.audioUrl}
                  duration={pendingVoiceReview.duration}
                  senderRole="user"
                  langue={langue}
                />

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    {langue === 'wo'
                      ? 'Mbindu wax bi (mën nga ko soppi su amé njuumte) :' /* [À faire relire par un locuteur natif wolof] */
                      : 'Transcription (modifiable si incertaine) :'}
                  </label>
                  <textarea
                    rows={2}
                    value={pendingVoiceReview.transcript}
                    onChange={(e) =>
                      setPendingVoiceReview({
                        ...pendingVoiceReview,
                        transcript: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-950 dark:text-white resize-none focus:outline-none focus:border-[#CC131A] focus:ring-1 focus:ring-[#CC131A]"
                    placeholder={
                      langue === 'wo'
                        ? 'Bindal li nga wax ci wolof...' /* [À faire relire par un locuteur natif wolof] */
                        : 'Ajustez le texte de votre message...'
                    }
                  />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    {langue === 'wo'
                      ? '⚠️ Reconnaissance vocale wolof dafa mën a am njuumte ci appareil yi. Mbind mi moo lay may ngay wóor ci li ngay laaj.' /* [À faire relire par un locuteur natif wolof] */
                      : '⚠️ La reconnaissance vocale du wolof peut être imprécise. Vérifiez vos mots avant envoi.'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPendingVoiceReview(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 transition cursor-pointer min-h-[44px]"
                  >
                    {langue === 'wo' ? 'Neenal' : 'Annuler'} {/* [À faire relire par un locuteur natif wolof] */}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendVoiceMessage(
                        pendingVoiceReview.transcript,
                        pendingVoiceReview.audioUrl,
                        pendingVoiceReview.duration,
                        pendingVoiceReview.isUncertain
                      )
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-[#CC131A] hover:from-red-700 hover:to-[#b01016] text-white flex items-center gap-1.5 transition cursor-pointer shadow-md min-h-[44px]"
                  >
                    <Send size={14} />
                    <span>{langue === 'wo' ? 'Yònnee léegi' : 'Envoyer maintenant'}</span> {/* [À faire relire par un locuteur natif wolof] */}
                  </button>
                </div>
              </div>
            )}

            {/* Inputs réels cachés pour prise de photo ou sélection galerie */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              data-testid="camera-file-input"
              onChange={handlePhotoSelected}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              data-testid="gallery-file-input"
              onChange={handlePhotoSelected}
            />

            {/* Menu Popover pour le choix de la photo (Caméra vs Galerie) */}
            {showPhotoMenu && (
              <div
                data-testid="photo-picker-menu"
                className="p-3 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 shadow-md space-y-2 animate-in fade-in"
              >
                <div className="flex items-center justify-between text-xs font-bold text-navy-900 dark:text-white">
                  <span>
                    {langue === 'wo'
                      ? 'Duggal nataal ci waxtaan bi :' /* [À faire relire par un locuteur natif wolof] */
                      : 'Ajouter une photo à la discussion :'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPhotoMenu(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Fermer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="p-3 rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-950 hover:bg-red-50 dark:hover:bg-red-950/30 text-navy-900 dark:text-white flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer min-h-[44px]"
                  >
                    <Camera size={16} className="text-[#CC131A]" />
                    <span>
                      {langue === 'wo'
                        ? 'Nàllal photo (caméra)' /* [À faire relire par un locuteur natif wolof] */
                        : 'Prendre une photo'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopAllAudioPlayback();
                      stopWebcam();
                      setShowPhotoMenu(false);
                      galleryInputRef.current?.click();
                    }}
                    className="p-3 rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-950 hover:bg-navy-100 dark:hover:bg-navy-800 text-navy-900 dark:text-white flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer min-h-[44px]"
                  >
                    <Image size={16} className="text-navy-700 dark:text-navy-300" />
                    <span>
                      {langue === 'wo'
                        ? 'Tànn ci galeri bi' /* [À faire relire par un locuteur natif wolof] */
                        : 'Choisir dans la galerie'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Volet Webcam en direct sur ordinateur */}
            {isWebcamOpen && (
              <div
                data-testid="webcam-preview-container"
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 shadow-md space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between text-xs font-bold text-navy-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                    <span>
                      {langue === 'wo'
                        ? 'Caméra ci waxtaan bi' /* [À faire relire par un locuteur natif wolof] */
                        : 'Aperçu de la caméra'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopWebcam}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
                    aria-label="Fermer la caméra"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-[300px] flex items-center justify-center border border-navy-800">
                  <video
                    ref={webcamVideoRef}
                    autoPlay
                    playsInline
                    muted
                    data-testid="webcam-video-element"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={stopWebcam}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 transition cursor-pointer min-h-[44px]"
                  >
                    {langue === 'wo' ? 'Neenal' : 'Annuler'} {/* [À faire relire par un locuteur natif wolof] */}
                  </button>
                  <button
                    type="button"
                    onClick={captureWebcamPhoto}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-[#CC131A] hover:from-red-700 hover:to-[#b01016] text-white flex items-center gap-1.5 transition cursor-pointer shadow-md min-h-[44px]"
                  >
                    <Camera size={15} />
                    <span>{langue === 'wo' ? 'Jël nataal bi' : 'Prendre la photo'}</span> {/* [À faire relire par un locuteur natif wolof] */}
                  </button>
                </div>
              </div>
            )}

            {/* Bannière d'erreur caméra avec repli sur la galerie */}
            {cameraError && (
              <div
                data-testid="camera-error-banner"
                className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCameraError(null)}
                    className="p-2 text-amber-700 hover:bg-amber-200/50 rounded-lg cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Fermer"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCameraError(null);
                      galleryInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy dark:bg-navy-800 text-white font-bold text-xs hover:bg-navy-700 transition cursor-pointer min-h-[44px]"
                  >
                    <Image size={15} />
                    <span>{langue === 'wo' ? 'Tànn ci galeri bi' : 'Choisir dans la galerie'}</span> {/* [À faire relire par un locuteur natif wolof] */}
                  </button>
                </div>
              </div>
            )}

            {/* Panneau partagé : Confirmation de signalement */}
            {signalementSuccessMessage && (
              <div
                data-testid="signalement-success-banner"
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs shadow-xs animate-in fade-in"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold">{signalementSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSignalementSuccessMessage(null)}
                  className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-200/50 cursor-pointer"
                  aria-label="Fermer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Panneau partagé : Erreur d'envoi de signalement avec bouton Réessayer */}
            {signalementError && (
              <div
                data-testid="signalement-error-banner"
                className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs shadow-xs animate-in fade-in flex-wrap gap-2"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-[#CC131A] shrink-0" />
                  <span>{signalementError}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSubmitSignalement}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#CC131A] text-white font-bold text-xs hover:bg-red-700 transition cursor-pointer min-h-[44px]"
                  >
                    <RotateCcw size={14} />
                    <span>{langue === 'wo' ? 'Jéemaatal' : 'Réessayer'}</span> {/* [À faire relire par un locuteur natif wolof] */}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignalementError(null)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Fermer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Panneau partagé : Alerte erreur GPS avec proposition de saisie manuelle */}
            {gpsError && !attachedLocation && (
              <div
                data-testid="gps-error-banner"
                className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{gpsError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGpsError(null)}
                    className="p-1 text-amber-700 hover:bg-amber-200/50 rounded-lg cursor-pointer"
                    aria-label="Fermer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <input
                    ref={manualLocationInputRef}
                    type="text"
                    placeholder={
                      langue === 'wo'
                        ? 'Bindal sa quartier (ex: Thiaroye Gare)' /* [À faire relire par un locuteur natif wolof] */
                        : 'Saisissez votre quartier ou lieu (ex: Thiaroye Gare)'
                    }
                    value={manualLocationText}
                    onChange={(e) => setManualLocationText(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-navy-950 text-navy-950 dark:text-white text-xs focus:outline-none focus:border-[#CC131A]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = (manualLocationInputRef.current?.value || manualLocationText).trim();
                      if (!val) return;
                      setAttachedLocation({
                        lat: 14.7500,
                        lng: -17.3800,
                        label: val,
                        isManual: true,
                      });
                      setGpsError(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-navy dark:bg-navy-800 text-white font-bold text-xs hover:bg-navy-700 transition cursor-pointer min-h-[44px]"
                  >
                    {langue === 'wo' ? 'Dëggal barab bi' : 'Valider le lieu'} {/* [À faire relire par un locuteur natif wolof] */}
                  </button>
                </div>
              </div>
            )}

            {/* Formulaire direct partagé : éléments joints (Photo et/ou Position) */}
            {(attachedPhoto || attachedLocation) && (
              <div
                data-testid="direct-signalement-form"
                className="p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 shadow-md space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between text-xs font-bold text-navy-900 dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#CC131A]" />
                    {attachedPhoto
                      ? (langue === 'wo' ? 'Signalement direct ci chat bi' : 'Signalement avec photo') /* [À faire relire par un locuteur natif wolof] */
                      : (langue === 'wo' ? 'Diagnostic ak position GPS' : 'Diagnostic de votre position')} {/* [À faire relire par un locuteur natif wolof] */}
                  </span>
                  <span className="text-[11px] font-medium text-navy-500 dark:text-navy-400">
                    {attachedPhoto
                      ? (langue === 'wo' ? 'Dina yònnee signalement' : 'Transmis aux autorités') /* [À faire relire par un locuteur natif wolof] */
                      : (langue === 'wo' ? 'Dina laaj NDAM' : 'Question posée à NDAM')} {/* [À faire relire par un locuteur natif wolof] */}
                  </span>
                </div>

                {/* Badges des éléments joints avec croix pour retirer */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Miniature Photo */}
                  {attachedPhoto && (
                    <div
                      data-testid="attached-photo-preview"
                      className="flex items-center gap-2 p-1.5 pr-2 rounded-xl bg-navy-50/80 dark:bg-navy-950 border border-navy-200 dark:border-navy-700"
                    >
                      <img
                        src={attachedPhoto.previewUrl}
                        alt="Miniature"
                        className="w-12 h-12 rounded-lg object-cover border border-navy-200 dark:border-navy-800 shrink-0"
                      />
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="text-xs font-bold text-navy-900 dark:text-white truncate max-w-[120px]">
                          {attachedPhoto.name || 'Photo'}
                        </span>
                        <span className="text-[10px] text-navy-500 dark:text-navy-400">
                          {langue === 'wo' ? 'Nataal duggal na' : 'Photo attachée'} {/* [À faire relire par un locuteur natif wolof] */}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeAttachedPhoto}
                        className="w-11 h-11 rounded-lg text-slate-500 hover:text-[#CC131A] dark:text-slate-400 dark:hover:text-red-400 flex items-center justify-center transition cursor-pointer hover:bg-white dark:hover:bg-navy-800"
                        title={langue === 'wo' ? 'Far nataal bi' : 'Retirer la photo'} /* [À faire relire par un locuteur natif wolof] */
                        aria-label="Retirer la photo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {/* Position GPS / Manuelle */}
                  {attachedLocation && (
                    <div
                      data-testid="attached-location-badge"
                      className="flex items-center gap-2 p-2 rounded-xl bg-navy-50/80 dark:bg-navy-950 border border-navy-200 dark:border-navy-700"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#CC131A] flex items-center justify-center shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="text-xs font-bold text-navy-900 dark:text-white truncate max-w-[150px]">
                          {attachedLocation.label || `Lat: ${attachedLocation.lat.toFixed(4)}, Lng: ${attachedLocation.lng.toFixed(4)}`}
                        </span>
                        <span className="text-[10px] text-navy-500 dark:text-navy-400">
                          {attachedLocation.isManual
                            ? (langue === 'wo' ? 'Barab bu ñu duggal ci loxo' : 'Lieu saisi manuellement') /* [À faire relire par un locuteur natif wolof] */
                            : (langue === 'wo' ? 'Coordonnées GPS wóor' : 'Position GPS détectée')} {/* [À faire relire par un locuteur natif wolof] */}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedLocation(null)}
                        className="w-11 h-11 rounded-lg text-slate-500 hover:text-[#CC131A] dark:text-slate-400 dark:hover:text-red-400 flex items-center justify-center transition cursor-pointer hover:bg-white dark:hover:bg-navy-800"
                        title={langue === 'wo' ? 'Far position bi' : 'Retirer la position'} /* [À faire relire par un locuteur natif wolof] */
                        aria-label="Retirer la position"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Si photo présente : Sélecteur de catégorie (Inondation, Égouts, Autre) */}
                {attachedPhoto && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-navy-800">
                    <span className="text-[11px] font-semibold text-navy-600 dark:text-navy-300 mr-1">
                      {langue === 'wo' ? 'Wàll / Catégorie :' : 'Catégorie :'} {/* [À faire relire par un locuteur natif wolof] */}
                    </span>
                    {[
                      { value: 'inondation', label: langue === 'wo' ? 'Ndox / Inondation' : 'Inondation' },
                      { value: 'egouts', label: langue === 'wo' ? 'Égouts / Kànn' : 'Égouts' },
                      { value: 'autre', label: langue === 'wo' ? 'Yeneen / Autre' : 'Autre' },
                    ].map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setSignalementCategory(cat.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
                          signalementCategory === cat.value
                            ? 'bg-[#CC131A] text-white shadow-2xs'
                            : 'bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-navy-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Champ de description modifiable dans le formulaire */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-navy-700 dark:text-navy-300 block">
                    {langue === 'wo'
                      ? 'Faramfàccal li xew (mën nga ko soppi) :' /* [À faire relire par un locuteur natif wolof] */
                      : 'Description de la situation (modifiable) :'}
                  </label>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      attachedPhoto
                        ? (langue === 'wo' ? 'Bindal li xew (ruelle inondée, hauteur eau)...' : 'Précisez l’incident (ruelle inondée, concession, hauteur)...') /* [À faire relire par un locuteur natif wolof] */
                        : (langue === 'wo' ? 'Bindal sa laaj ci position bi...' : 'Précisez votre question sur cette position...') /* [À faire relire par un locuteur natif wolof] */
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-950 dark:text-white focus:outline-none focus:border-[#CC131A] focus:ring-1 focus:ring-[#CC131A]"
                  />
                </div>

                {/* Boutons d'action du formulaire direct : Annuler et Envoyer */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-navy-800">
                  <button
                    type="button"
                    onClick={() => {
                      removeAttachedPhoto();
                      setAttachedLocation(null);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 transition cursor-pointer min-h-[44px]"
                  >
                    {langue === 'wo' ? 'Neenal lépp' : 'Annuler'} {/* [À faire relire par un locuteur natif wolof] */}
                  </button>
                  <button
                    type="button"
                    onClick={handleFormSubmit}
                    disabled={isSignalementSubmitting || mutation.isPending}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-[#CC131A] hover:from-red-700 hover:to-[#b01016] text-white flex items-center gap-1.5 transition cursor-pointer shadow-md min-h-[44px] disabled:opacity-50"
                  >
                    {isSignalementSubmitting || mutation.isPending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    <span>
                      {isSignalementSubmitting
                        ? (langue === 'wo' ? 'Mu ngiy yònnee...' : 'Envoi en cours...') /* [À faire relire par un locuteur natif wolof] */
                        : (langue === 'wo' ? 'Yònnee léegi' : 'Envoyer')} {/* [À faire relire par un locuteur natif wolof] */}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Formulaire de saisie utilisateur */}
            <form
              onSubmit={handleFormSubmit}
              className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-navy-800 flex-shrink-0"
            >
              {isRecording ? (
                /* Interface d'enregistrement vocal type WhatsApp */
                <div className="flex-1 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 animate-in fade-in min-h-[48px]">
                  {/* Minuteur avec point rouge pulsant */}
                  <div className="flex items-center gap-2 text-[#CC131A] dark:text-red-400 font-mono font-bold text-xs sm:text-sm shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#CC131A] animate-ping" />
                    <span>{formatTimer(recordingDuration)}</span>
                  </div>

                  {/* Onde sonore animée */}
                  <div className="flex-1 flex items-center justify-center gap-1 h-7 px-2">
                    {[35, 70, 95, 55, 85, 45, 100, 75, 40, 90, 60, 80].map((h, i) => (
                      <span
                        key={i}
                        style={{
                          height: `${Math.max(20, Math.min(100, h * (0.6 + Math.sin(recordingDuration * 4 + i) * 0.4)))}%`,
                        }}
                        className="w-1 bg-[#CC131A] dark:bg-red-400 rounded-full transition-all duration-150"
                      />
                    ))}
                  </div>

                  {/* Bouton Annuler (Corbeille - supprime l'enregistrement) - min 44px */}
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    className="w-11 h-11 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:text-[#CC131A] hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center shrink-0 transition active:scale-95 cursor-pointer shadow-2xs"
                    title={langue === 'wo' ? 'Neenal wax bi (far)' : 'Annuler l’enregistrement'} /* [À faire relire par un locuteur natif wolof] */
                    aria-label="Annuler l'enregistrement"
                  >
                    <Trash2 size={18} />
                  </button>

                  {/* Bouton Envoyer le vocal - min 44px */}
                  <button
                    type="button"
                    onClick={stopAndSendVoiceRecording}
                    className="w-11 h-11 rounded-xl bg-gradient-to-r from-red-600 to-[#CC131A] hover:from-red-700 hover:to-[#b01016] active:scale-95 text-white flex items-center justify-center shrink-0 transition cursor-pointer shadow-md"
                    title={langue === 'wo' ? 'Yònnee wax bi' : 'Envoyer le message vocal'} /* [À faire relire par un locuteur natif wolof] */
                    aria-label="Envoyer"
                  >
                    <Send size={18} />
                  </button>
                </div>
              ) : (
                /* Mode standard : texte + GPS + Micro + Envoyer */
                <>
                  {/* Bouton Appareil photo (ouvre le menu de choix photo sans redirection) */}
                  <button
                    type="button"
                    onClick={() => {
                      stopAllAudioPlayback();
                      setShowPhotoMenu((prev) => !prev);
                    }}
                    className="w-11 h-11 rounded-xl bg-white dark:bg-navy-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-navy-700 dark:text-navy-200 hover:text-[#CC131A] dark:hover:text-red-400 border border-navy-200 dark:border-navy-700 hover:border-red-300 dark:hover:border-red-900/60 flex items-center justify-center transition active:scale-95 shrink-0 shadow-2xs cursor-pointer"
                    title={
                      langue === 'wo'
                        ? 'Duggal nataal / photo' /* [À faire relire par un locuteur natif wolof] */
                        : 'Ajouter une photo'
                    }
                    aria-label="Appareil photo"
                  >
                    <Camera size={18} className="text-[#CC131A]" />
                  </button>

                  {/* Bouton localisation (ouvre le formulaire direct sans envoi automatique) */}
                  <button
                    type="button"
                    onClick={triggerLocationLookup}
                    disabled={isLocating || mutation.isPending || isSignalementSubmitting}
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition active:scale-95 cursor-pointer shadow-2xs ${
                      isLocating
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-300 text-[#CC131A]'
                        : attachedLocation
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-300 text-[#CC131A]'
                        : 'bg-white dark:bg-navy-900 border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:text-navy-950 dark:hover:text-white hover:bg-navy-50 dark:hover:bg-navy-800'
                    }`}
                    title={
                      langue === 'wo'
                        ? 'Duggal sama barab ci GPS' /* [À faire relire par un locuteur natif wolof] */
                        : 'Localiser ma position'
                    }
                    aria-label="Localiser ma position"
                  >
                    {isLocating ? (
                      <Loader2 size={17} className="animate-spin text-[#CC131A]" />
                    ) : (
                      <LocateFixed size={18} />
                    )}
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      langue === 'wo'
                        ? 'Bindal sa laaj ci NDAM (risk, taw, refuges)...' /* [À faire relire par un locuteur natif wolof] */
                        : 'Écrivez votre question à NDAM (risques, refuges, météo)…'
                    }
                    className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900/60 text-xs sm:text-sm text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:border-[#CC131A] focus:ring-1 focus:ring-[#CC131A] transition shadow-2xs"
                  />

                  {/* Bouton micro WhatsApp (min 44px) */}
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="w-11 h-11 rounded-xl border bg-white dark:bg-navy-900 border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200 hover:text-[#CC131A] hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-900/60 flex items-center justify-center flex-shrink-0 transition active:scale-95 cursor-pointer shadow-2xs"
                    title={
                      langue === 'wo'
                        ? 'Waxal sa laaj (vocal)' /* [À faire relire par un locuteur natif wolof] */
                        : 'Enregistrer un message vocal (WhatsApp)'
                    }
                    aria-label="Microphone"
                  >
                    <Mic size={18} />
                  </button>

                  {/* Bouton envoyer (min 44px) */}
                  <button
                    type="submit"
                    disabled={(!input.trim() && !attachedPhoto && !attachedLocation) || mutation.isPending || isSignalementSubmitting}
                    className="w-11 h-11 rounded-xl bg-gradient-to-r from-red-600 to-[#CC131A] hover:from-red-700 hover:to-[#b01016] active:scale-95 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition cursor-pointer shadow-md"
                    aria-label="Envoyer"
                  >
                    {isSignalementSubmitting || mutation.isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </>
              )}
            </form>
          </div>


          {/* Panneau de contexte latéral (Desktop) */}
          <div className="hidden lg:flex flex-col gap-3.5 sticky top-6">
            {/* Boîte Contexte Territorial */}
            <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-4 shadow-xs">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-[#CC131A]" />
                Contexte analysé par NDAM
              </h3>

              {topZone ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-extrabold text-navy-950 dark:text-white flex items-center gap-1">
                      <MapPin size={13} className="text-[#CC131A]" />
                      {topZone.quartier}
                    </span>
                    <RiskBadge niveau={topZone.niveau_risque} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Zone surveillée prioritairement par les algorithmes prédictifs.
                  </p>
                  <div className="flex items-center justify-between text-xs font-semibold bg-slate-50 dark:bg-navy-900/60 p-2 rounded-lg">
                    <span className="text-slate-500">Score de vulnérabilité :</span>
                    <span className="text-navy-950 dark:text-white font-black">
                      {Math.round(Number(topZone.score_risque_moyen ?? 0) * 100)}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-navy-400">Aucune zone enregistrée pour l’instant.</p>
              )}
            </div>

            {/* Boîte Météo & Capteurs */}
            <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-4 shadow-xs">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <CloudRain size={14} className="text-[#CC131A]" />
                Météo en direct
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Thermometer size={14} className="text-amber-500" />
                    Température :
                  </span>
                  <span className="font-black text-navy-950 dark:text-white">
                    {currentTemp != null ? `${Math.round(Number(currentTemp))}°C` : '30°C'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CloudRain size={14} className="text-[#CC131A]" />
                    Précipitations :
                  </span>
                  <span className="font-black text-navy-950 dark:text-white">
                    {currentPrecip != null ? `${Number(currentPrecip).toFixed(1)} mm` : '0.0 mm'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wind size={14} className="text-teal-500" />
                    Vent :
                  </span>
                  <span className="font-black text-navy-950 dark:text-white">
                    {currentWind != null ? `${Math.round(Number(currentWind))} km/h` : '18 km/h'}
                  </span>
                </div>
              </div>
            </div>

            {/* Assistance d'urgence */}
            <div className="bg-gradient-to-br from-slate-900 to-navy-950 text-white rounded-2xl p-4 border border-blue-900/30 space-y-2 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
                <PhoneCall size={12} />
                Lignes de secours immédiat
              </span>
              <p className="text-[11px] text-slate-300 leading-snug">
                En cas de danger immédiat ou de montée brutale des eaux, contactez sans attendre les secours :
              </p>
              <div className="flex items-center justify-between pt-1 font-bold text-xs">
                <span>Pompiers : <strong className="text-red-400">18</strong></span>
                <span>SAMU : <strong className="text-emerald-400">15</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CitizenShell>
  );
}
