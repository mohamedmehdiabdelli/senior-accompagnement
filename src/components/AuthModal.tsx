import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Home, Building2, Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: Mode;
  onClose: () => void;
}

export default function AuthModal({ isOpen, initialMode, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  // Reset when opening / switching mode
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  const reset = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setRole(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (mode === 'signup' && !role) {
      setError('Veuillez choisir votre type de compte.');
      return;
    }

    setLoading(true);
    const result = mode === 'signup'
      ? await signUp(email.trim(), password, role!, fullName.trim() || undefined)
      : await signIn(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden relative"
        >
          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 z-10"
          >
            <X size={20} />
          </button>

          <div className="p-8 md:p-10 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 mb-2">
                <img src="/logo.svg" alt="Tamini" className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 title-serif">
                {mode === 'signin' ? 'Bon retour !' : 'Créer votre compte'}
              </h2>
              <p className="text-slate-500">
                {mode === 'signin'
                  ? 'Connectez-vous pour accéder à votre espace.'
                  : 'Rejoignez Tamini en quelques secondes.'}
              </p>
            </div>

            {/* Role selector — sign up only */}
            {mode === 'signup' && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Je suis...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('elderly')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      role === 'elderly'
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Home size={22} className={role === 'elderly' ? 'text-blue-600' : 'text-slate-400'} />
                    <div className="mt-2 font-bold text-slate-900 text-sm">Personne âgée</div>
                    <div className="text-xs text-slate-500 mt-0.5">Santé, rappels, loisirs...</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('nursing_home')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      role === 'nursing_home'
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Building2 size={22} className={role === 'nursing_home' ? 'text-blue-600' : 'text-slate-400'} />
                    <div className="mt-2 font-bold text-slate-900 text-sm">Maison de retraite</div>
                    <div className="text-xs text-slate-500 mt-0.5">Espace aidants</div>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Nom complet (optionnel)</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Votre nom"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Mot de passe</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 rounded-2xl font-bold text-base hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-lg shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Veuillez patienter...
                  </>
                ) : (
                  mode === 'signin' ? 'Se connecter' : 'Créer mon compte'
                )}
              </button>
            </form>

            <div className="text-center text-sm text-slate-500">
              {mode === 'signin' ? (
                <>
                  Pas encore de compte ?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(null); }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    S'inscrire
                  </button>
                </>
              ) : (
                <>
                  Vous avez déjà un compte ?{' '}
                  <button
                    onClick={() => { setMode('signin'); setError(null); }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Se connecter
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
