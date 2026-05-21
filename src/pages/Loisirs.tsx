import { BookOpen, Gamepad2, Laugh, FileText, Download, Play, Trophy } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const books = [
  { title: "L'art de la sérénité", author: "Marie Claire", year: "2023", format: "PDF", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200" },
  { title: "Mémoire Vive", author: "Dr Jean Roche", year: "2022", format: "E-Pub", image: "https://images.unsplash.com/photo-1543004218-ee141104308e?auto=format&fit=crop&q=80&w=200" },
  { title: "Le Petit Prince", author: "St-Exupéry", year: "1943", format: "PDF", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=200" }
];

const jokes = [
  "Pourquoi les oiseaux volent-ils vers le sud en hiver ? Parce que c'est trop long à pied !",
  "Quel est le comble pour un médecin ? C'est d'être patient !",
  "Mon mari est tellement distrait qu'il a cherché ses lunettes alors qu'elles étaient sur son nez.",
  "Deux papis discutent : - Tu te souviens de ma femme ? - Oui. - Elle m'a fait arrêter de fumer en brûlant mes fauteuils !",
  "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que s'ils plongeaient en avant, ils tomberaient dans le bateau !"
];

function MemoryGame() {
  const icons = ['🍎', '🍌', '🍓', '🍇', '🍒', '🍍', '🥝', '🍉'];
  const [cards, setCards] = useState(() => 
    [...icons, ...icons].sort(() => Math.random() - 0.5).map((icon, i) => ({ id: i, icon, flipped: false, matched: false }))
  );
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const resetGame = () => {
    setCards([...icons, ...icons].sort(() => Math.random() - 0.5).map((icon, i) => ({ id: i, icon, flipped: false, matched: false })));
    setFlippedIds([]);
    setMoves(0);
  };

  const handleCardClick = (id: number) => {
    if (flippedIds.length === 2 || cards[id].flipped || cards[id].matched) return;

    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].icon === cards[second].icon) {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === first || c.id === second) ? { ...c, matched: true } : c));
          setFlippedIds([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === first || c.id === second) ? { ...c, flipped: false } : c));
          setFlippedIds([]);
        }, 1000);
      }
    }
  };

  const isWon = cards.every(c => c.matched);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl">
        <span className="font-bold text-blue-700">Coups : {moves}</span>
        <button onClick={resetGame} className="text-blue-600 font-bold hover:underline">Recommencer</button>
      </div>
      
      {isWon && (
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-green-100 text-green-700 p-4 rounded-2xl text-center font-bold">
          Bravo ! Vous avez gagné ! 🎉
        </motion.div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {cards.map(card => (
          <motion.div
            key={card.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCardClick(card.id)}
            className={`aspect-square rounded-xl cursor-pointer flex items-center justify-center text-3xl shadow-sm transition-all duration-300 ${
              card.flipped || card.matched ? 'bg-white rotate-0' : 'bg-blue-600 rotate-180'
            }`}
          >
            {(card.flipped || card.matched) ? card.icon : '?'}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function Loisirs() {
  const [activeTab, setActiveTab] = useState<'books' | 'games' | 'jokes'>('books');
  const [jokeIndex, setJokeIndex] = useState(0);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full font-bold text-sm">
          <Gamepad2 size={18} />
          Divertissement
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight title-serif">Le Coin Détente</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">Pour le plaisir de lire, de jouer et de rire ensemble.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {[
          { id: 'books', label: 'Bibliothèque', icon: <BookOpen size={20} /> },
          { id: 'games', label: 'Jeux de Mémoire', icon: <Gamepad2 size={20} /> },
          { id: 'jokes', label: 'Blagues', icon: <Laugh size={20} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-bold transition-all ${
              activeTab === tab.id 
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 ring-4 ring-blue-100' 
              : 'bg-white text-slate-500 hover:text-blue-600 border border-slate-100 shadow-sm'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'books' && (
          <motion.div
            key="books"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {books.map((b, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2.5rem] premium-shadow border border-slate-50 flex flex-col items-center text-center space-y-5 hover:border-blue-100 transition-all group">
                <img src={b.image} alt={b.title} className="w-32 h-44 rounded-xl object-cover shadow-2xl group-hover:scale-105 transition-transform" />
                <div>
                  <h3 className="font-bold text-xl text-slate-800">{b.title}</h3>
                  <p className="text-slate-500 text-sm italic">{b.author} ({b.year})</p>
                </div>
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 font-bold shadow-lg">
                  <Download size={20} />
                  Lire le PDF
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'games' && (
          <motion.div
            key="games"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-xl mx-auto w-full"
          >
            <div className="bg-white p-8 rounded-[3rem] premium-shadow border border-slate-50 space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-slate-800 italic title-serif">L'exercice du jour</h3>
                <p className="text-slate-500 text-sm">Trouvez les paires d'images pour stimuler votre concentration.</p>
              </div>
              <MemoryGame />
            </div>
          </motion.div>
        )}

        {activeTab === 'jokes' && (
          <motion.div
            key="jokes"
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white p-12 rounded-[3.5rem] premium-shadow border-8 border-orange-50 text-center space-y-10 relative overflow-hidden">
              <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Laugh className="text-orange-600" size={40} />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={jokeIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed italic title-serif"
                >
                  "{jokes[jokeIndex]}"
                </motion.p>
              </AnimatePresence>
              <button
                onClick={() => setJokeIndex((prev) => (prev + 1) % jokes.length)}
                className="bg-orange-600 text-white px-12 py-5 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 active:scale-95"
              >
                Haha ! Une autre blague !
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
