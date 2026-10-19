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
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import RiskBadge from '../../shared/components/RiskBadge';
import { askNdam } from '../../api/endpoints/chat';
import { useZones } from '../../shared/hooks/useZones';
import { usePrevisions } from '../../shared/hooks/usePrevisions';

const SUGGESTIONS = [
  'Quel est le niveau de risque actuel ?',
  'Comment signaler une inondation ?',
  'Quels sont les refuges les plus proches ?',
  'Que faire avant une inondation ?',
  'Comment lire la carte des zones ?',
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

  const [input, setInput] = useState('');
  const [showMobileContext, setShowMobileContext] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const bottomRef = useRef(null);

  const { data: zonesData } = useZones();
  const { data: previsionsData } = usePrevisions();
  const topZone = pickMostAtRiskZone(zonesData?.features);
  const current = previsionsData?.results?.[0];

  const currentTemp = current?.temperature_c ?? current?.temperature_max_c ?? current?.temperature;
  const currentPrecip = current?.precipitation_mm ?? current?.precipitation;
  const currentWind = current?.vitesse_vent;

  // Sauvegarde automatique du chat dans le localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mbeund_mi_ndam_current_chat', JSON.stringify(messages));
    } catch {}
  }, [messages]);

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
    setMessages([GREETING]);
    try {
      localStorage.removeItem('mbeund_mi_ndam_current_chat');
    } catch {}
  };

  const handleCopyMessage = (text, idx) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Connecté aux capteurs
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 sm:line-clamp-1">
                Conseils personnalisés de prévention, aide au signalement et navigation vers les refuges sécurisés
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
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
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.text, i)}
                        className="absolute -bottom-2 right-2 p-1 rounded-md bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-400 hover:text-navy-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-2xs"
                        title="Copier la réponse"
                        aria-label="Copier"
                      >
                        {copiedIndex === i ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      </button>
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

            {/* Formulaire de saisie utilisateur */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-navy-800 flex-shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrivez votre question à NDAM (risques, refuges, météo)…"
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
      </div>
    </CitizenShell>
  );
}
