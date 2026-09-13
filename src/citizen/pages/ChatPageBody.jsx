import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Waves, Send, CloudRain, ShieldAlert } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import RiskBadge from '../../shared/components/RiskBadge';
import { askNdam } from '../../api/endpoints/chat';
import { useZones } from '../../shared/hooks/useZones';
import { usePrevisions } from '../../shared/hooks/usePrevisions';

const SUGGESTIONS = [
  'Quel est le niveau de risque actuel ?',
  'Comment signaler une inondation ?',
  'Que faire avant une inondation ?',
  'Comment lire la carte des zones ?',
];

const GREETING = {
  role: 'assistant',
  text: "Bonjour, je suis NDAM 👋 Je peux vous renseigner sur le risque d'inondation à Thiaroye-sur-Mer, vous aider à signaler un incident ou vous donner des conseils de prévention. Comment puis-je vous aider ?",
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
    <div className="w-8 h-8 rounded-full bg-navy dark:bg-navy-800 text-white flex items-center justify-center flex-shrink-0">
      <Waves size={15} />
    </div>
  );
}

export default function ChatPageBody() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  const { data: zonesData } = useZones();
  const { data: previsionsData } = usePrevisions();
  const topZone = pickMostAtRiskZone(zonesData?.features);
  const current = previsionsData?.results?.[0];

  const mutation = useMutation({
    mutationFn: askNdam,
    onSuccess: (data) => {
      setMessages((m) => [...m, { role: 'assistant', text: data.reply }]);
    },
    onError: () => {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: "Désolé, je n'arrive pas à vous répondre pour l'instant. Réessayez dans un instant." },
      ]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mutation.isPending]);

  const sendMessage = (text) => {
    const question = text.trim();
    if (!question || mutation.isPending) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    mutation.mutate(question);
  };

  return (
    <CitizenShell>
      <div>
        <h1 className="text-lg font-extrabold flex items-center gap-2">
          <Waves size={17} className="text-red" />
          NDAM · Assistant
        </h1>
        <p className="text-xs text-navy-400 mt-0.5">Réponses basées sur la météo et le risque en temps réel</p>
      </div>

      {/* Desktop : conversation + panneau de contexte sur toute la largeur
          disponible (comme la page Carte), tous deux alignés juste sous le
          titre commun — plus de colonne plafonnée ni de décalage vertical. */}
      <div className="w-full flex flex-col gap-4 lg:grid lg:grid-cols-[1.4fr_1fr] lg:gap-5 lg:items-start">
        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-4 lg:p-5 flex flex-col gap-4">
            <div className="h-[50vh] lg:h-[420px] overflow-y-auto flex flex-col gap-3 pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {m.role === 'assistant' && <NdamAvatar />}
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-red text-white rounded-br-sm'
                        : 'bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {mutation.isPending && (
                <div className="flex items-end gap-2">
                  <NdamAvatar />
                  <div className="px-4 py-3 rounded-xl rounded-bl-sm bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-navy-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs font-semibold px-3 py-2 rounded-pill border-[1.5px] border-navy-200 dark:border-navy-800 text-navy dark:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrivez votre question…"
                className="flex-1 px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm placeholder:text-navy-400 focus:outline-none focus:border-navy dark:focus:border-navy-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || mutation.isPending}
                className="w-10 h-10 rounded-md bg-red text-white flex items-center justify-center flex-shrink-0 disabled:opacity-60"
                aria-label="Envoyer"
              >
                <Send size={16} />
              </button>
            </form>
        </div>

        <div className="hidden lg:flex flex-col gap-3 sticky top-6">
          <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-4">
            <h3 className="text-[11px] font-bold uppercase text-navy-400 mb-2 flex items-center gap-1.5">
              <ShieldAlert size={13} />
              Contexte utilisé par NDAM
            </h3>
            {topZone ? (
              <>
                <p className="text-sm font-semibold">{topZone.quartier}</p>
                <RiskBadge niveau={topZone.niveau_risque} className="mt-1.5" />
                <p className="text-xs text-navy-400 mt-2">
                  Score de risque : {Math.round(Number(topZone.score_risque_moyen ?? 0) * 100)}%
                </p>
              </>
            ) : (
              <p className="text-xs text-navy-400">Aucune zone enregistrée pour l’instant.</p>
            )}
          </div>

          <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-4">
            <h3 className="text-[11px] font-bold uppercase text-navy-400 mb-2 flex items-center gap-1.5">
              <CloudRain size={13} />
              Météo actuelle
            </h3>
            {current ? (
              <div className="text-xs text-navy-600 dark:text-navy-200 space-y-1">
                <p className="text-xl font-extrabold text-navy dark:text-navy-50">{current.temperature}°C</p>
                <p>Précipitations : {current.precipitation} mm</p>
                <p>Vent : {current.vitesse_vent} km/h</p>
              </div>
            ) : (
              <p className="text-xs text-navy-400">Aucune prévision enregistrée.</p>
            )}
          </div>
        </div>
      </div>
    </CitizenShell>
  );
}
