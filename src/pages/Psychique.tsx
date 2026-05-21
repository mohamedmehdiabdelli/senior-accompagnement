import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Phone, Video } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from "motion/react";

// DELETE the hardcoded array
// ADD imports:
import { useEffect } from 'react'; // already imported
import { getPsychologists } from '../lib/db';
import type { Psychologist } from '../lib/db';

// ADD state inside the component:
const [psychologists, setPsychologists] = useState<Psychologist[]>([]);

useEffect(() => {
  getPsychologists().then(setPsychologists);
}, []);

export default function Psychique() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Bonjour ! Je suis votre compagnon IA bienveillant. Je suis ici pour vous écouter et discuter avec vous. Comment vous sentez-vous aujourd'hui ?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [
            {
              role: 'system',
              content: `Tu es un compagnon IA bienveillant et chaleureux spécialement conçu pour accompagner les personnes âgées.
Tu t'appelles "Camille". Tu parles en français, avec douceur, patience et empathie.
Tu n'es pas un médecin et tu ne donnes pas de conseils médicaux, mais tu écoutes, tu réconfortes, et tu animes des conversations légères et positives.
Reste toujours positif, bienveillant et encourageant. Si la personne semble en détresse sérieuse, suggère doucement de parler à un professionnel.
Réponds en 2-3 phrases maximum pour rester accessible.`
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ]
        })
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "Je suis désolé, je n'ai pas pu répondre. Veuillez réessayer.";
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Je suis désolé, une erreur est survenue. Veuillez réessayer dans un moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="space-y-4">
        <div className="inline-flex bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase">
          Bien-être & Écoute
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight title-serif">Espace Psychique</h1>
        <p className="text-lg text-slate-500">Parlez librement avec notre compagnon IA ou prenez rendez-vous avec un spécialiste.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden flex flex-col" style={{ height: '600px' }}>
          <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🤖</div>
            <div>
              <h3 className="font-bold text-lg">Camille</h3>
              <p className="text-purple-100 text-sm">Compagnon IA bienveillant • En ligne</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-9 h-9 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0 text-lg">🤖</div>
                  )}
                  <div className={`max-w-[80%] px-5 py-4 rounded-3xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-slate-50 text-slate-700 rounded-tl-sm'
                  }`}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  {m.role === 'user' && (
                    <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                      <User size={16} className="text-blue-600" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0 text-lg">🤖</div>
                  <div className="bg-slate-50 px-5 py-4 rounded-3xl rounded-tl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 border-t border-slate-100 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Écrivez votre message..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center hover:bg-purple-700 transition-all disabled:opacity-50 active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Psychologists */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 title-serif">Nos Spécialistes</h3>
          {psychologists.map(p => (
            <div key={p.name} className="bg-white rounded-[2.5rem] p-6 shadow-lg border border-slate-50 space-y-4">
              <div className="flex gap-4 items-center">
                <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-2xl object-cover" />
                <div>
                  <h4 className="font-bold text-slate-800">{p.name}</h4>
                  <p className="text-sm text-purple-600 font-medium">{p.specialty}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{p.availability}</span>
                <span className="font-bold text-slate-800">{p.price}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 bg-purple-50 text-purple-700 py-3 rounded-2xl font-bold text-sm hover:bg-purple-100 transition-all">
                  <Phone size={16} /> Appeler
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all">
                  <Video size={16} /> Vidéo
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
