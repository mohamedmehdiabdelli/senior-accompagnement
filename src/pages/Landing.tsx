import { motion } from 'motion/react';
import { Heart, Shield, Users, Clock } from 'lucide-react';

interface LandingProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function Landing({ onSignIn, onSignUp }: LandingProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[180px] opacity-30" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[180px] opacity-25" />
      <div className="absolute top-1/3 left-1/2 w-[400px] h-[400px] bg-purple-600 rounded-full blur-[180px] opacity-20" />

      {/* Top bar */}
      <header className="relative z-10 px-6 md:px-12 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Tamini" className="w-12 h-12 rounded-2xl shadow-lg" />
          <span className="text-2xl font-bold tracking-tight title-serif">Tamini</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSignIn}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
          >
            Se connecter
          </button>
          <button
            onClick={onSignUp}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all"
          >
            S'inscrire
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 md:px-12 pt-12 md:pt-20 pb-24">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex bg-white/10 border border-white/20 backdrop-blur-md px-5 py-2 rounded-full text-sm font-semibold tracking-wide"
          >
            ✨ Bienveillance, sécurité et accompagnement
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight title-serif leading-tight"
          >
            Bienvenue sur <span className="italic text-blue-300">Tamini</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-2xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed"
          >
            Une plateforme bienveillante conçue pour les personnes âgées et les maisons de retraite.
            Santé, écoute, rappels, sécurité et bien plus, en un seul espace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <button
              onClick={onSignUp}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-600/40 transition-all hover:scale-105 active:scale-95"
            >
              Créer mon compte gratuitement
            </button>
            <button
              onClick={onSignIn}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95"
            >
              J'ai déjà un compte
            </button>
          </motion.div>
        </div>

        {/* Feature cards */}
        <div className="max-w-6xl mx-auto mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { icon: Heart, title: "Santé", desc: "Matériel & téléconsultations" },
            { icon: Shield, title: "Sécurité", desc: "Alerte GPS instantanée" },
            { icon: Clock, title: "Rappels", desc: "Médicaments & rendez-vous" },
            { icon: Users, title: "Aidants", desc: "Suivi pour maisons de retraite" }
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="bg-white/5 border border-white/10 backdrop-blur-md p-5 md:p-6 rounded-3xl hover:bg-white/10 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                <f.icon size={22} className="text-blue-300" />
              </div>
              <h3 className="font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-blue-100/70">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 px-6 md:px-12 py-6 text-center text-sm text-blue-100/50">
        © {new Date().getFullYear()} Tamini — Tous droits réservés
      </footer>
    </div>
  );
}
