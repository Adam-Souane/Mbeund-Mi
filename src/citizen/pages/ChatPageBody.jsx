import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Waves, Send } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import { askNdam } from '../../api/endpoints/chat';

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
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-extrabold flex items-center gap-2">
            <Waves size={17} className="text-red" />
            NDAM · Assistant
          </h1>
          <p className="text-xs text-navy-400 mt-0.5">Réponses basées sur la météo et le risque en temps réel</p>
        </div>

        <div className="h-[55vh] lg:h-[60vh] overflow-y-auto flex flex-col gap-3 pr-1">
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
    </CitizenShell>
  );
}
