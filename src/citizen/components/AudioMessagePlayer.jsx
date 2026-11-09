import { useState, useRef, useEffect } from 'react';
import { Play, Pause, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { synthesizeSpeech } from '../../api/endpoints/chat';

// Formatage du temps en MM:SS
function formatDuration(sec) {
  if (!sec || isNaN(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function AudioMessagePlayer({
  audioUrl = null,
  duration = 0,
  role = 'user',
  senderRole = null,
  transcription = '',
  isUncertain = false,
  langue = 'fr',
  voiceUnavailableNote = null,
  onSynthesisError = null,
}) {
  const currentRole = senderRole || role || 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [showTranscription, setShowTranscription] = useState(false);
  const audioRef = useRef(null);

  // Initialisation et gestion de l'audio HTML5
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      try {
        audio.pause();
      } catch {}
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Nettoyage au démontage : arrêter tout audio et synthèse vocale en cours
  useEffect(() => {
    const handleStopAudio = () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
      setIsPlaying(false);
      setCurrentTime(0);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mbeund-mi:stop-audio', handleStopAudio);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mbeund-mi:stop-audio', handleStopAudio);
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
    };
  }, []);

  // Simulation de progression temporelle pendant la synthèse vocale
  useEffect(() => {
    if (!audioRef.current && isPlaying) {
      const estimatedSec =
        audioDuration ||
        (transcription ? Math.max(3, Math.round(transcription.length / 18)) : 5);
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= estimatedSec) return prev;
          return Math.min(estimatedSec, prev + 0.25);
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isPlaying, audioDuration, transcription]);

  const handleTogglePlay = async () => {
    // Cas 1 : Fichier audio réel (message vocal utilisateur ou réponse audio existante)
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
      return;
    }

    // Cas 2 : Tentative de synthèse vocale neuronale naturelle féminine via backend
    if (transcription && typeof process === 'undefined' && typeof window !== 'undefined') {
      try {
        const res = await synthesizeSpeech(transcription, langue);
        if (res?.audio_url) {
          const audio = new Audio(res.audio_url);
          audioRef.current = audio;
          audio.onended = () => {
            setIsPlaying(false);
            setCurrentTime(0);
          };
          audio.onerror = () => {
            setIsPlaying(false);
          };
          await audio.play();
          setIsPlaying(true);
          return;
        }
      } catch {
        // Repli vers speechSynthesis ci-dessous
      }
    }

    // Cas 3 : Synthèse vocale de secours (ex: tests Vitest / mode hors ligne)
    if (typeof window !== 'undefined' && window.speechSynthesis && transcription) {
      if (langue !== 'fr') {
        // Règle stricte : Ne jamais lire du wolof avec une voix française
        return;
      }

      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setCurrentTime(0);
        return;
      }

      window.speechSynthesis.cancel();
      const clean = transcription.replace(/[*#_~]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;

      utterance.onstart = () => {
        setIsPlaying(true);
      };
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      utterance.onerror = (e) => {
        setIsPlaying(false);
        if (e.error && e.error !== 'not-allowed' && e.error !== 'interrupted') {
          onSynthesisError?.();
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsPlaying(false);
        onSynthesisError?.();
      }
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = newProgress * audioDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercent = audioDuration > 0 ? (currentTime / audioDuration) * 100 : isPlaying ? 50 : 0;

  // Barres d'ondes audio réalistes
  const waveHeights = [25, 45, 80, 55, 95, 60, 40, 75, 90, 50, 70, 35, 85, 65, 40, 30];

  const isUser = currentRole === 'user';

  return (
    <div className="w-full flex flex-col gap-2 max-w-[290px] sm:max-w-[340px]">
      {/* Lecteur audio principal */}
      <div className="flex items-center gap-2.5">
        {/* Bouton Lecture / Pause (minimum 44x44px accessible mobile) */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition active:scale-95 cursor-pointer shadow-xs ${
            isUser
              ? 'bg-white text-navy hover:bg-navy-50'
              : 'bg-gradient-to-r from-red-600 to-[#CC131A] hover:from-red-700 hover:to-[#b01016] text-white shadow-md'
          }`}
          title={isPlaying ? (langue === 'wo' ? 'Taxawal wax bi' : 'Mettre en pause') : (langue === 'wo' ? 'Tàmmal wax bi' : 'Écouter le message vocal')}
          aria-label={isPlaying ? 'Pause' : 'Lecture audio'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        {/* Onde sonore & progression */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
          <div
            role="slider"
            tabIndex={0}
            aria-label={langue === 'wo' ? 'Avancement vocal' : 'Progression audio'}
            aria-valuenow={Math.round(progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            onClick={handleSeek}
            onKeyDown={(e) => {
              if (audioRef.current && audioDuration) {
                if (e.key === 'ArrowRight') {
                  audioRef.current.currentTime = Math.min(audioDuration, audioRef.current.currentTime + 2);
                  setCurrentTime(audioRef.current.currentTime);
                } else if (e.key === 'ArrowLeft') {
                  audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 2);
                  setCurrentTime(audioRef.current.currentTime);
                }
              }
            }}
            className="h-7 flex items-center gap-0.5 cursor-pointer select-none py-1 group"
            title={langue === 'wo' ? 'Dëppal ci bar bi ngir avancer' : 'Cliquer pour avancer dans le vocal'}
          >
            {waveHeights.map((h, i) => {
              const barProgress = (i / waveHeights.length) * 100;
              const isPast = progressPercent >= barProgress;
              return (
                <span
                  key={i}
                  style={{
                    height: isPlaying ? `${Math.max(20, Math.min(100, h * (0.8 + Math.sin((currentTime * 8) + i) * 0.4)))}%` : `${h}%`,
                  }}
                  className={`w-1 sm:w-1.5 rounded-full transition-all duration-150 ${
                    isUser
                      ? isPast
                        ? 'bg-white'
                        : 'bg-white/40 group-hover:bg-white/60'
                      : isPast
                      ? 'bg-[#CC131A] dark:bg-red-400'
                      : 'bg-navy-200 dark:bg-navy-700 group-hover:bg-navy-300'
                  }`}
                />
              );
            })}
          </div>

          {/* Durée */}
          <div className="flex items-center justify-between text-[10px] font-mono font-semibold opacity-85">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(audioDuration || (transcription ? Math.max(3, Math.round(transcription.length / 18)) : 0))}</span>
          </div>
        </div>
      </div>

      {/* Note d'information si la synthèse vocale est indisponible (ex: wolof) */}
      {voiceUnavailableNote && (
        <div className="text-[10px] sm:text-[11px] leading-snug px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-medium">
          <AlertCircle size={13} className="shrink-0" />
          <span>{voiceUnavailableNote}</span>
        </div>
      )}

      {/* Option Afficher / Masquer la transcription */}
      {transcription && (
        <div className="pt-1 border-t border-white/20 dark:border-navy-700/60">
          <button
            type="button"
            onClick={() => setShowTranscription(!showTranscription)}
            className={`inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer transition py-0.5 active:scale-95 ${
              isUser
                ? 'text-white/90 hover:text-white underline underline-offset-2'
                : 'text-[#CC131A] dark:text-red-400 hover:underline'
            }`}
          >
            {showTranscription ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>
              {showTranscription
                ? (langue === 'wo' ? 'Nëbb mbind mi' : 'Masquer la transcription') /* [À faire relire par un locuteur natif wolof] */
                : (langue === 'wo' ? 'Wan mbind mi' : 'Afficher la transcription') /* [À faire relire par un locuteur natif wolof] */}
            </span>
          </button>

          {showTranscription && (
            <div
              className={`mt-1.5 p-2.5 rounded-xl text-xs leading-relaxed animate-in fade-in duration-200 ${
                isUser
                  ? 'bg-navy-950/70 text-white border border-white/15'
                  : 'bg-navy-50/80 dark:bg-navy-950/70 text-navy-950 dark:text-navy-100 border border-navy-100 dark:border-navy-800'
              }`}
            >
              {isUncertain && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold mb-1">
                  <AlertCircle size={11} />
                  <span>
                    {langue === 'wo'
                      ? '⚠️ Mbind mi mën na am njuumte (wolof)' /* [À faire relire par un locuteur natif wolof] */
                      : '⚠️ Transcription incertaine (wolof)'}
                  </span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{transcription}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
