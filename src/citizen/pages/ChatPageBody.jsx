import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Waves,
  Send,
  CloudRain,
  ShieldAlert,
  PlusCircle,
  History,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  Thermometer,
  Wind,
  PhoneCall,
  Check,
  Copy,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Trash2,
  MessageSquare,
  X,
  Clock,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import RiskBadge from '../../shared/components/RiskBadge';
import { askNdam } from '../../api/endpoints/chat';
import { useZones } from '../../shared/hooks/useZones';
import { usePrevisions } from '../../shared/hooks/usePrevisions';

const SUGGESTIONS = [
  'Quel est le niveau de risque actuel ?',
  'Quels sont les refuges les plus proches ?',
  'Comment signaler une inondation ?',
  'Que faire avant une inondation ?',
  'Météo et marée à Thiaroye',
  'Salam aleykoum, ndox mi ?',
];

const GREETING = {
  role: 'assistant',
  text: "Bonjour, je suis NDAM 👋 Je peux vous renseigner sur le risque d'inondation à Thiaroye-sur-Mer, vous aider à signaler un incident ou vous donner des conseils de prévention. Comment puis-je vous aider ?",
  timestamp: new Date().toISOString(),
};

const NIVEAU_RANK = { vert: 0, jaune: 1, orange: 2, rouge: 3 };

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

function NdamAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-[#0B2545] text-white flex items-center justify-center flex-shrink-0 shadow-xs border border-blue-900/50">
      <Waves size={15} className="text-cyan-300" />
    </div>
  );
}

export default function ChatPageBody() {
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

  // Liste des conversations sauvegardées dans l'historique
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_ndam_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    try {
      const savedId = localStorage.getItem('mbeund_mi_ndam_current_chat_id');
      if (savedId) return savedId;
    } catch {}
    return 'chat_' + Date.now();
  });

  const [input, setInput] = useState('');
  const [showMobileContext, setShowMobileContext] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  const { data: zonesData } = useZones();
  const { data: previsionsData } = usePrevisions();
  const topZone = pickMostAtRiskZone(zonesData?.features);
  const current = previsionsData?.results?.[0];

  const currentTemp = current?.temperature_c ?? current?.temperature_max_c ?? current?.temperature;
  const currentPrecip = current?.precipitation_mm ?? current?.precipitation;
  const currentWind = current?.vitesse_vent;

  // Arrêt de la voix quand on quitte la page
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Sauvegarde automatique du chat et de l'historique dans le localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mbeund_mi_ndam_current_chat', JSON.stringify(messages));
      localStorage.setItem('mbeund_mi_ndam_current_chat_id', currentChatId);
    } catch {}

    if (messages.length > 1) {
      const firstUserMsg = messages.find((m) => m.role === 'user');
      const title = firstUserMsg
        ? (firstUserMsg.text.length > 40 ? firstUserMsg.text.slice(0, 40) + '…' : firstUserMsg.text)
        : 'Discussion';

      setConversations((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === currentChatId);
        const updatedEntry = {
          id: currentChatId,
          title,
          updatedAt: new Date().toISOString(),
          messages,
        };
        let next;
        if (existingIdx >= 0) {
          next = [...prev];
          next[existingIdx] = updatedEntry;
        } else {
          next = [updatedEntry, ...prev];
        }
        try {
          localStorage.setItem('mbeund_mi_ndam_history', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [messages, currentChatId]);

  const mutation = useMutation({
    mutationFn: askNdam,
    onSuccess: (data) => {
      setMessages((m) => [...m, { role: 'assistant', text: data.reply, timestamp: new Date().toISOString() }]);
    },
    onError: () => {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: "Désolé, je n'arrive pas à vous répondre pour l'instant. Réessayez dans un instant.",
          timestamp: new Date().toISOString(),
        },
      ]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mutation.isPending]);

  const sendMessage = (text) => {
    const question = text.trim();
    if (!question || mutation.isPending) return;
    setMessages((m) => [...m, { role: 'user', text: question, timestamp: new Date().toISOString() }]);
    setInput('');
    mutation.mutate(question);
  };

  const handleNewChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
    const newId = 'chat_' + Date.now();
    setCurrentChatId(newId);
    setMessages([GREETING]);
    try {
      localStorage.removeItem('mbeund_mi_ndam_current_chat');
      localStorage.setItem('mbeund_mi_ndam_current_chat_id', newId);
    } catch {}
    setShowHistoryModal(false);
  };

  const handleSelectConversation = (conv) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
    setCurrentChatId(conv.id);
    setMessages(conv.messages || [GREETING]);
    setShowHistoryModal(false);
  };

  const handleDeleteConversation = (id, e) => {
    e.stopPropagation();
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem('mbeund_mi_ndam_history', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (currentChatId === id) {
      handleNewChat();
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Voulez-vous vraiment effacer tout votre historique de discussions ?')) {
      setConversations([]);
      try {
        localStorage.removeItem('mbeund_mi_ndam_history');
      } catch {}
      handleNewChat();
    }
  };

  const handleCopyMessage = (text, idx) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleToggleSpeech = (text, idx) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingIndex === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleVoiceRecording = () => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur. Veuillez utiliser Google Chrome, Microsoft Edge ou Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Erreur démarrage microphone:', err);
      setIsListening(false);
    }
  };

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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  IA & Moteur Résilient 24/7
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 sm:line-clamp-1">
                Conseils personnalisés de prévention, aide au signalement et navigation vers les refuges sécurisés
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Bouton Historique des discussions */}
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold border border-white/20 transition cursor-pointer shadow-xs"
                title="Consulter l'historique des discussions"
              >
                <History size={15} />
                <span>Historique{conversations.length > 0 ? ` (${conversations.length})` : ''}</span>
              </button>

              {/* Bouton Nouvelle Discussion */}
              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                title="Démarrer une nouvelle conversation"
              >
                <PlusCircle size={15} />
                <span>Nouvelle</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bouton contexte repliable pour mobile */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setShowMobileContext((prev) => !prev)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 text-xs font-bold text-navy-900 dark:text-white shadow-2xs cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-[#CC131A]" />
              Voir les données en direct utilisées par NDAM
            </span>
            {showMobileContext ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showMobileContext && (
            <div className="mt-2 p-3.5 rounded-xl bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 space-y-2.5 animate-in fade-in duration-200">
              {topZone && (
                <div className="text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Zone la plus exposée</span>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-navy-950 dark:text-white">{topZone.quartier}</span>
                    <RiskBadge niveau={topZone.niveau_risque} />
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Météo :</span>
                <span className="font-bold text-navy-950 dark:text-white">
                  {currentTemp != null ? `${Math.round(Number(currentTemp))}°C` : '30°C'} · {currentPrecip != null ? `${Number(currentPrecip).toFixed(1)} mm pluie` : '0 mm'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Grille principale : Chat + Panneau Contexte Desktop */}
        <div className="w-full flex flex-col gap-4 lg:grid lg:grid-cols-[1.45fr_1fr] lg:gap-5 lg:items-start">
          {/* Fenêtre de discussion principale */}
          <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-2xl p-4 lg:p-5 flex flex-col gap-4 shadow-xs">
            <div className="h-[52vh] sm:h-[58vh] lg:h-[460px] overflow-y-auto flex flex-col gap-3.5 pr-1.5 scrollbar-thin">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 group ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {m.role === 'assistant' && <NdamAvatar />}
                  <div
                    className={`relative max-w-[85%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-2xs ${
                      m.role === 'user'
                        ? 'bg-[#2563EB] text-white rounded-br-xs font-medium'
                        : 'bg-slate-50 dark:bg-navy-900/70 text-navy-950 dark:text-slate-100 border border-slate-200/80 dark:border-navy-700/60 rounded-bl-xs'
                    }`}
                  >
                    {m.text}

                    {m.role === 'assistant' && (
                      <div className="absolute -bottom-2.5 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Bouton Écouter Audio (Speech) */}
                        {typeof window !== 'undefined' && 'speechSynthesis' in window && (
                          <button
                            type="button"
                            onClick={() => handleToggleSpeech(m.text, i)}
                            className={`p-1 rounded-md border text-xs transition cursor-pointer shadow-2xs ${
                              speakingIndex === i
                                ? 'bg-cyan-600 text-white border-cyan-700 animate-pulse'
                                : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300'
                            }`}
                            title={speakingIndex === i ? 'Arrêter la lecture' : 'Écouter la réponse vocale (Audio)'}
                            aria-label="Écouter la réponse"
                          >
                            {speakingIndex === i ? <VolumeX size={11} /> : <Volume2 size={11} />}
                          </button>
                        )}

                        {/* Bouton Copier */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(m.text, i)}
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
              ))}

              {mutation.isPending && (
                <div className="flex items-end gap-2">
                  <NdamAvatar />
                  <div className="px-4 py-3 rounded-2xl rounded-bl-xs bg-slate-50 dark:bg-navy-900/70 border border-slate-200/80 dark:border-navy-700/60 flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold mr-1">NDAM réfléchit</span>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce"
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
                  Questions fréquentes des habitants :
                </span>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900/50 text-navy-800 dark:text-slate-200 hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] transition active:scale-95 cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Bannière active pendant l'enregistrement vocal */}
            {isListening && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold animate-pulse">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                  <span>🎙️ Écoute en cours… Parlez clairement, votre voix est transcrite en direct.</span>
                </span>
                <button
                  type="button"
                  onClick={handleToggleVoiceRecording}
                  className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[11px] font-black cursor-pointer hover:bg-red-700 shrink-0 ml-2"
                >
                  Terminer
                </button>
              </div>
            )}

            {/* Formulaire de saisie utilisateur */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-navy-800 flex-shrink-0"
            >
              {/* Bouton Micro Enregistrement Vocal */}
              <button
                type="button"
                onClick={handleToggleVoiceRecording}
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition cursor-pointer shadow-xs ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-400/30'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300'
                }`}
                title={isListening ? "Arrêter l'enregistrement vocal" : "Dicter votre question au micro (Voix)"}
                aria-label="Enregistrement vocal"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Écoute en cours… Parlez maintenant" : "Écrivez votre question ou dictez à NDAM (risques, refuges, météo)…"}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-900/50 text-xs sm:text-sm text-navy-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || mutation.isPending}
                className="w-11 h-11 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition cursor-pointer shadow-sm"
                aria-label="Envoyer"
              >
                <Send size={17} />
              </button>
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
                <CloudRain size={14} className="text-[#2563EB]" />
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
                    <CloudRain size={14} className="text-[#2563EB]" />
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

        {/* Modale d'historique des discussions */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header modale */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <History size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-navy-950 dark:text-white">
                      Historique des discussions
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {conversations.length} discussion{conversations.length > 1 ? 's' : ''} enregistrée{conversations.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                  aria-label="Fermer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Corps : liste des discussions */}
              <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
                {conversations.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                    <MessageSquare size={36} className="opacity-40 stroke-1" />
                    <p className="text-sm font-bold">Aucune discussion dans l'historique</p>
                    <p className="text-xs max-w-xs text-slate-500">
                      Vos échanges avec NDAM s'enregistrent automatiquement ici pour que vous puissiez les relire à tout moment.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isActive = conv.id === currentChatId;
                    const dateStr = conv.updatedAt
                      ? new Date(conv.updatedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';
                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500/50 shadow-xs ring-1 ring-blue-500/30'
                            : 'bg-slate-50/70 hover:bg-slate-100 dark:bg-navy-800/50 dark:hover:bg-navy-800 border-slate-200/80 dark:border-navy-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <MessageSquare
                              size={14}
                              className={isActive ? 'text-blue-600 dark:text-cyan-400 shrink-0' : 'text-slate-400 shrink-0'}
                            />
                            <h4 className="text-xs font-bold text-navy-950 dark:text-white truncate">
                              {conv.title || 'Discussion'}
                            </h4>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded-md bg-blue-600 text-[9px] font-black text-white shrink-0">
                                En cours
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {dateStr}
                            </span>
                            <span>•</span>
                            <span>{(conv.messages?.length || 0)} message{(conv.messages?.length || 0) > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 flex items-center justify-center transition shrink-0 cursor-pointer"
                          title="Supprimer cette discussion"
                          aria-label="Supprimer discussion"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer modale */}
              <div className="p-4 border-t border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/50 flex items-center justify-between">
                {conversations.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Tout effacer</span>
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-navy-800 dark:hover:bg-navy-700 text-xs font-bold text-navy-900 dark:text-white transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CitizenShell>
  );
}
